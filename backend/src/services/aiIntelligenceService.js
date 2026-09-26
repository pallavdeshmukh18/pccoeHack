const groqService = require('./groqService');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const Employee = require('../models/Employee');
const DevelopmentPriority = require('../models/EmployeeDevelopmentPriority');
const EmployeeRoleGap = require('../models/EmployeeRoleGap');
const EvidenceConflict = require('../models/EvidenceConflict');

exports.analyzeEvidence = async (text) => {
  const prompt = `Analyze this performance evidence: "${text}". Output JSON with fields: { "identifiedSkills": ["string"], "polarity": "POSITIVE|NEGATIVE|NEUTRAL", "estimatedReliability": 0.0-1.0 }`;
  const res = await groqService.generateStructuredResponse(prompt, ['identifiedSkills', 'polarity', 'estimatedReliability']);
  return JSON.parse(res);
};

exports.summarizeFeedback = async (feedbacks) => {
  const prompt = `Summarize these feedbacks into a single development paragraph: ${feedbacks.join(' | ')}`;
  return await groqService.generateNaturalLanguage(prompt);
};

exports.explainCapability = async (employeeId, skillId) => {
  const capabilityExplanationService = require('./capabilityExplanationService');
  const baseExpl = await capabilityExplanationService.explainCapability(employeeId, skillId);
  const prompt = `Rewrite this structured capability explanation into a supportive, professional paragraph for an employee: ${JSON.stringify(baseExpl.explanation)}`;
  return await groqService.generateNaturalLanguage(prompt);
};

exports.chat = async (employeeId, query) => {
  const emp = await Employee.findById(employeeId).populate('role').populate('department');
  const caps = await EmployeeSkillCapability.find({ employee: employeeId }).populate('skill', 'name category');
  const priorities = await DevelopmentPriority.findOne({ employee: employeeId }).populate('priorities.skill', 'name');
  const gaps = await EmployeeRoleGap.findOne({ employee: employeeId, role: emp.role?._id }).populate('gaps.skill', 'name');
  const conflicts = await EvidenceConflict.find({ employee: employeeId, conflictStatus: 'CONFLICTING' }).populate('skill', 'name');
  
  // Create a bounded deterministic context
  const contextData = {
    employeeDetails: {
      department: emp.department,
      jobTitle: emp.jobTitle
    },
    capabilities: caps.map(c => ({
      skill: c.skill.name,
      capabilityScore: c.capabilityScore, // can be null
      proficiencyLevel: c.proficiencyLevel, // can be null
      confidenceScore: c.confidenceScore,
      evidenceSufficiency: c.evidenceSufficiency,
      trajectoryDirection: c.trajectoryDirection,
      trajectoryVelocity: c.trajectoryVelocity
    })),
    roleGaps: gaps ? gaps.gaps.map(g => ({ skill: g.skill.name, requiredLevel: g.requiredLevel, currentLevel: g.currentLevel })) : [],
    priorities: priorities ? priorities.priorities.map(p => ({ skill: p.skill.name, score: p.priorityScore })) : [],
    conflictingSkills: conflicts.map(c => c.skill.name)
  };

  const systemPrompt = `You are the TalentTwin AI assistant. You help employees understand their capabilities based ONLY on the provided deterministic data.
Rules:
1. Do not invent capabilities or scores.
2. If capabilityScore or proficiencyLevel is null, state explicitly that evidence is insufficient. Do not substitute 0.
3. You cannot alter numerical values.
4. Keep responses professional and concise.

Context Data for this employee:
${JSON.stringify(contextData)}`;

  return await groqService.generateNaturalLanguage(`${systemPrompt}\n\nEmployee Query: ${query}`);
};
