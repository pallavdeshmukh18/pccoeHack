const mongoose = require('mongoose');
const AssessmentSession = require('../models/AssessmentSession');
const Employee = require('../models/Employee');
const Skill = require('../models/Skill');
const groqService = require('../services/groqService');
const engine = require('../services/assessmentEngine');
const crypto = require('crypto');

exports.startAssessment = async (req, res) => {
  try {
    const { employeeId, skillId } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const skill = await Skill.findById(skillId);
    if (!skill || !skill.isActive) return res.status(404).json({ success: false, message: 'Skill not found or inactive' });

    // Initialize session
    const session = new AssessmentSession({
      employee: employee._id,
      skill: skill._id,
      status: 'IN_PROGRESS',
      currentDifficulty: 3,
      currentEstimate: 3,
      confidence: 0,
      totalQuestions: 0
    });

    const levelObj = skill.proficiencyLevels.find(l => l.level === session.currentDifficulty);

    let generated;
    try {
      generated = await groqService.generateAssessmentQuestion({
        skillName: skill.name,
        skillDescription: skill.description,
        targetDifficulty: session.currentDifficulty,
        levelName: levelObj ? levelObj.name : 'Proficient',
        levelDescription: levelObj ? levelObj.description : 'Solid practical experience',
        previousWeaknesses: []
      });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }

    const questionObj = {
      questionId: crypto.randomUUID(),
      question: generated.question,
      difficulty: session.currentDifficulty
    };

    session.questions.push(questionObj);
    session.totalQuestions = 1;
    await session.save();

    res.status(201).json({
      success: true,
      data: {
        assessmentId: session._id,
        skill: {
          id: skill._id,
          name: skill.name
        },
        question: {
          questionId: questionObj.questionId,
          question: questionObj.question,
          difficulty: questionObj.difficulty
        },
        status: session.status
      }
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    
    if (!answer || answer.trim() === '') {
      return res.status(400).json({ success: false, message: 'Answer cannot be empty' });
    }

    const session = await AssessmentSession.findById(req.params.id).populate('skill');
    if (!session) return res.status(404).json({ success: false, message: 'Assessment session not found' });

    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, message: 'Assessment is not in progress' });
    }

    const qIndex = session.questions.findIndex(q => q.questionId === questionId);
    if (qIndex === -1) {
      return res.status(400).json({ success: false, message: 'Invalid questionId' });
    }
    
    const questionDoc = session.questions[qIndex];
    if (questionDoc.answer) {
      return res.status(400).json({ success: false, message: 'Question already answered' });
    }

    // Save answer
    questionDoc.answer = answer;
    questionDoc.answeredAt = new Date();

    const levelObj = session.skill.proficiencyLevels.find(l => l.level === questionDoc.difficulty);

    // Evaluate
    let evaluation;
    try {
      evaluation = await groqService.evaluateAssessmentAnswer({
        skillName: session.skill.name,
        question: questionDoc.question,
        answer: questionDoc.answer,
        levelName: levelObj ? levelObj.name : 'Unknown',
        levelDescription: levelObj ? levelObj.description : 'Unknown'
      });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }

    // Update question
    questionDoc.evaluation = evaluation;
    questionDoc.score = evaluation.score;
    questionDoc.estimatedLevel = evaluation.estimatedLevel;
    questionDoc.correctness = evaluation.correctness;
    questionDoc.reasoningQuality = evaluation.reasoningQuality;
    questionDoc.depth = evaluation.depth;
    questionDoc.dimensions = evaluation.dimensions || [];
    
    // Backend derived rubric coverage
    if (questionDoc.dimensions && questionDoc.dimensions.length > 0) {
      const sum = questionDoc.dimensions.reduce((acc, dim) => acc + dim.score, 0);
      questionDoc.rubricCoverage = sum / questionDoc.dimensions.length;
    } else {
      questionDoc.rubricCoverage = evaluation.rubricCoverage ?? 0.8; // backward compatibility fallback
    }

    questionDoc.strengths = evaluation.strengths || [];
    questionDoc.weaknesses = evaluation.weaknesses || [];
    questionDoc.missingAreas = evaluation.missingAreas || [];
    questionDoc.feedback = evaluation.feedback;

    // Recalculate metrics
    const metrics = engine.calculateAssessmentMetrics(session.questions);
    session.currentEstimate = metrics.currentEstimate;
    session.confidence = metrics.confidence;

    const answeredCount = session.questions.filter(q => q.answer).length;
    
    // Check stop condition
    if (engine.shouldStopAssessment(answeredCount, session.minQuestions, session.maxQuestions, session.confidence)) {
      // Don't mark as completed here, let the client explicitly call /complete or we auto-complete.
      // The instructions say "Determine whether the assessment should stop. If not stopping: calculate next... generate next...".
      // We will just not generate the next question.
      await session.save();
      
      return res.json({
        success: true,
        data: {
          assessmentId: session._id,
          evaluation,
          assessment: {
            currentEstimate: session.currentEstimate,
            confidence: session.confidence
          },
          status: 'IN_PROGRESS',
          message: 'Ready to complete assessment'
        }
      });
    }

    // Generate next question
    session.currentDifficulty = engine.calculateNextDifficulty(session.currentDifficulty, questionDoc);
    
    const nextLevelObj = session.skill.proficiencyLevels.find(l => l.level === session.currentDifficulty);
    
    let generated;
    try {
      generated = await groqService.generateAssessmentQuestion({
        skillName: session.skill.name,
        skillDescription: session.skill.description,
        targetDifficulty: session.currentDifficulty,
        levelName: nextLevelObj ? nextLevelObj.name : 'Unknown',
        levelDescription: nextLevelObj ? nextLevelObj.description : 'Unknown',
        previousWeaknesses: evaluation.weaknesses || []
      });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }

    const nextQuestionObj = {
      questionId: crypto.randomUUID(),
      question: generated.question,
      difficulty: session.currentDifficulty
    };

    session.questions.push(nextQuestionObj);
    session.totalQuestions += 1;
    await session.save();

    res.json({
      success: true,
      data: {
        assessmentId: session._id,
        evaluation,
        assessment: {
          currentEstimate: session.currentEstimate,
          confidence: session.confidence
        },
        nextQuestion: {
          questionId: nextQuestionObj.questionId,
          question: nextQuestionObj.question,
          difficulty: nextQuestionObj.difficulty
        },
        status: session.status
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.completeAssessment = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Assessment session not found' });

    if (session.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Assessment already completed' });
    }

    const answeredCount = session.questions.filter(q => q.answer).length;
    if (answeredCount < session.minQuestions) {
      return res.status(400).json({ success: false, message: `Cannot complete: answered fewer than ${session.minQuestions} questions` });
    }

    const metrics = engine.calculateAssessmentMetrics(session.questions);
    
    session.status = 'COMPLETED';
    session.completedAt = new Date();
    session.currentEstimate = metrics.currentEstimate;
    session.confidence = metrics.confidence;
    
    session.finalResult = {
      estimatedLevel: session.currentEstimate,
      confidence: session.confidence,
      questionsAnswered: answeredCount
    };

    await session.save();

    res.json({
      success: true,
      data: session.finalResult
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAssessmentById = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeCode')
      .populate('skill', 'name category');

    if (!session) return res.status(404).json({ success: false, message: 'Assessment session not found' });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
