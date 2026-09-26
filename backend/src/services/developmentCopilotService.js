/**
 * Phase 6B: AI Development Copilot & Recommendations
 * Generates personalized development plans using LLM while protecting Phase 6A facts.
 */

const Employee = require('../models/Employee');
const JobRole = require('../models/JobRole');
const EmployeeRoleGap = require('../models/EmployeeRoleGap');
const EmployeeDevelopmentPriority = require('../models/EmployeeDevelopmentPriority');
const DevelopmentRecommendation = require('../models/DevelopmentRecommendation');
const groqService = require('./groqService');

exports.generateEmployeeDevelopmentPlan = async (employeeId, jobRoleId) => {
  // 1-4. Load necessary facts
  const employee = await Employee.findById(employeeId).lean();
  const jobRole = await JobRole.findById(jobRoleId).lean();
  const roleGap = await EmployeeRoleGap.findOne({ employee: employeeId, jobRole: jobRoleId }).lean();
  const devPriority = await EmployeeDevelopmentPriority.findOne({ employee: employeeId, jobRole: jobRoleId })
    .populate('priorities.skill', 'name')
    .lean();

  if (!employee || !jobRole || !roleGap || !devPriority) {
    throw new Error('Required data missing. Ensure Phase 6A has run.');
  }

  // Check if there are confirmed priorities (GAP or NEAR_GAP)
  if (devPriority.confirmedDevelopmentNeeds === 0 || !devPriority.priorities || devPriority.priorities.length === 0) {
    // Upsert empty plan
    return await DevelopmentRecommendation.findOneAndUpdate(
      { employee: employeeId, jobRole: jobRoleId },
      {
        $set: {
          generationStatus: 'GENERATED',
          overallSummary: 'No confirmed development gaps found for this role.',
          developmentPlan: 'Keep up the good work and focus on maintaining current capabilities.',
          priorities: [],
          model: 'none',
          promptVersion: '1.0',
          generatedAt: new Date(),
          errorMessage: null
        }
      },
      { returnDocument: 'after', upsert: true }
    );
  }

  // 6. Build trusted AI context
  const aiContext = {
    employee: {
      name: employee.name || 'Employee',
      department: employee.department || 'General'
    },
    role: {
      title: jobRole.title,
      department: jobRole.department
    },
    developmentPriorities: devPriority.priorities.map(p => ({
      skillName: p.skill.name,
      priorityLevel: p.priorityLevel,
      priorityScore: p.priorityScore,
      requiredLevel: p.requiredLevel,
      currentLevel: p.currentProficiencyLevel,
      importance: p.importance,
      confidence: p.currentConfidenceScore,
      trajectoryDirection: p.trajectoryDirection,
      trajectoryVelocity: p.trajectoryVelocity
    }))
  };

  let aiResponse = null;
  let validationError = null;

  try {
    // 8. Call Groq
    aiResponse = await groqService.generateDevelopmentRecommendations(aiContext);

    // 10. Validate Output
    if (!aiResponse || typeof aiResponse !== 'object') throw new Error('Response is not a JSON object.');
    if (!Array.isArray(aiResponse.recommendations)) throw new Error('Recommendations must be an array.');
    
    // Map existing priorities for validation
    const existingPriorities = devPriority.priorities.map(p => ({
      skillId: p.skill._id.toString(),
      skillName: p.skill.name
    }));

    if (aiResponse.recommendations.length !== existingPriorities.length) {
      throw new Error(`Expected ${existingPriorities.length} recommendations, got ${aiResponse.recommendations.length}.`);
    }

    const processedSkills = new Set();
    
    for (let i = 0; i < aiResponse.recommendations.length; i++) {
      const rec = aiResponse.recommendations[i];
      const expectedSkillName = existingPriorities[i].skillName;
      
      // Order match
      if (rec.skillName !== expectedSkillName) {
        throw new Error(`Priority order mismatch or unknown skill. Expected ${expectedSkillName}, got ${rec.skillName}`);
      }

      // Duplicate check
      if (processedSkills.has(rec.skillName)) {
        throw new Error(`Duplicate skill in recommendations: ${rec.skillName}`);
      }
      processedSkills.add(rec.skillName);

      // Data type checks
      if (typeof rec.developmentObjective !== 'string') throw new Error('developmentObjective must be a string');
      if (typeof rec.whyThisMatters !== 'string') throw new Error('whyThisMatters must be a string');
      if (!Array.isArray(rec.recommendedActions)) throw new Error('recommendedActions must be an array');
      if (!Array.isArray(rec.practiceActivities)) throw new Error('practiceActivities must be an array');
      if (!Array.isArray(rec.suggestedProjects)) throw new Error('suggestedProjects must be an array');
      if (!Array.isArray(rec.successIndicators)) throw new Error('successIndicators must be an array');
      if (!Array.isArray(rec.cautions)) throw new Error('cautions must be an array');
      if (typeof rec.estimatedTimeframe !== 'string') throw new Error('estimatedTimeframe must be a string');
    }

  } catch (error) {
    validationError = error.message;
  }

  // If validation failed, store failure state safely
  if (validationError) {
    return await DevelopmentRecommendation.findOneAndUpdate(
      { employee: employeeId, jobRole: jobRoleId },
      {
        $set: {
          generationStatus: 'FAILED',
          errorMessage: validationError,
          generatedAt: new Date()
        }
      },
      { returnDocument: 'after', upsert: true }
    );
  }

  // 11. Merge AI recommendations with authoritative backend facts
  const mergedPriorities = devPriority.priorities.map((p, index) => {
    const rec = aiResponse.recommendations[index];

    return {
      // Backend Facts (Unchangeable)
      skill: p.skill._id,
      priorityLevel: p.priorityLevel,
      priorityScore: p.priorityScore,
      currentProficiencyLevel: p.currentProficiencyLevel,
      requiredLevel: p.requiredLevel,
      importance: p.importance,
      confidenceScore: p.currentConfidenceScore,
      trajectoryDirection: p.trajectoryDirection,
      trajectoryVelocity: p.trajectoryVelocity,

      // AI Facts
      developmentObjective: rec.developmentObjective,
      whyThisMatters: rec.whyThisMatters,
      recommendedActions: rec.recommendedActions,
      practiceActivities: rec.practiceActivities,
      suggestedProjects: rec.suggestedProjects,
      successIndicators: rec.successIndicators,
      estimatedTimeframe: rec.estimatedTimeframe,
      cautions: rec.cautions
    };
  });

  // 12. Store DevelopmentRecommendation
  const finalRecommendation = await DevelopmentRecommendation.findOneAndUpdate(
    { employee: employeeId, jobRole: jobRoleId },
    {
      $set: {
        generationStatus: 'GENERATED',
        overallSummary: aiResponse.overallSummary || 'Development Plan',
        developmentPlan: aiResponse.developmentPlan || '',
        priorities: mergedPriorities,
        model: process.env.GROQ_MODEL || 'allam-2-7b',
        promptVersion: '1.0',
        generatedAt: new Date(),
        errorMessage: null
      }
    },
    { returnDocument: 'after', upsert: true }
  );

  return finalRecommendation;
};
