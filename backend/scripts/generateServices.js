const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../src/services');

const services = {
  'evidenceConflictService.js': `const EvidenceConflict = require('../models/EvidenceConflict');
const Evidence = require('../models/Evidence');

exports.detectConflicts = async (employeeId, skillId) => {
  const evidences = await Evidence.find({ employee: employeeId, skill: skillId, status: 'ACTIVE' });
  if (evidences.length < 2) return null;

  let positiveCount = 0;
  let negativeCount = 0;
  let quantValues = [];

  for (const ev of evidences) {
    if (ev.direction === 'POSITIVE') positiveCount++;
    if (ev.direction === 'NEGATIVE') negativeCount++;
    if (ev.normalizedValue !== null) quantValues.push(ev.normalizedValue);
  }

  let conflictStatus = 'CONSISTENT';
  let conflictScore = 0;
  let signalSpread = 0;

  if (quantValues.length > 1) {
    const min = Math.min(...quantValues);
    const max = Math.max(...quantValues);
    signalSpread = max - min;
    if (signalSpread > 0.4) {
      conflictStatus = 'CONFLICTING';
      conflictScore = signalSpread;
    } else if (signalSpread > 0.2) {
      conflictStatus = 'MIXED';
      conflictScore = signalSpread;
    }
  }

  if (positiveCount > 0 && negativeCount > 0 && conflictStatus === 'CONSISTENT') {
    conflictStatus = 'MIXED';
    conflictScore = Math.max(0.3, conflictScore);
  }

  let conflictRecord = await EvidenceConflict.findOne({ employee: employeeId, skill: skillId });
  if (!conflictRecord) {
    conflictRecord = new EvidenceConflict({ employee: employeeId, skill: skillId });
  }

  conflictRecord.conflictStatus = conflictStatus;
  conflictRecord.conflictScore = conflictScore;
  conflictRecord.evidenceIds = evidences.map(e => e._id);
  conflictRecord.positiveEvidenceCount = positiveCount;
  conflictRecord.negativeEvidenceCount = negativeCount;
  conflictRecord.signalSpread = signalSpread;
  conflictRecord.calculatedAt = new Date();

  await conflictRecord.save();
  return conflictRecord;
};

exports.getEmployeeConflicts = async (employeeId) => {
  return await EvidenceConflict.find({ employee: employeeId }).populate('skill', 'name category');
};
`,

  'capabilityExplanationService.js': `const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const Evidence = require('../models/Evidence');

exports.explainCapability = async (employeeId, skillId) => {
  const cap = await EmployeeSkillCapability.findOne({ employee: employeeId, skill: skillId }).populate('skill');
  const ev = await Evidence.find({ employee: employeeId, skill: skillId, status: 'ACTIVE' }).sort({ quality: -1 });

  if (!cap) return { employee: employeeId, skill: skillId, explanation: "No capability record found." };

  const isForming = cap.capabilityScore === null;
  let conclusion = isForming ? \`\${cap.skill.name} is currently a developing profile with insufficient quantitative evidence.\` : \`\${cap.skill.name} is currently at Level \${cap.proficiencyLevel} (score: \${(cap.capabilityScore*100).toFixed(0)}%).\`;

  let explanation = conclusion;
  if (!isForming) {
    explanation += \` The system has \${cap.confidenceScore >= 0.7 ? 'high' : 'moderate'} confidence based on \${cap.observationCount} observations.\`;
    if (cap.trajectoryDirection !== 'INSUFFICIENT_DATA') {
      explanation += \` The capability trajectory is \${cap.trajectoryDirection.toLowerCase()}.\`;
    }
  } else {
    explanation = "TalentTwin does not have enough quantitative evidence to establish a reliable capability estimate.";
  }

  return {
    employee: employeeId,
    skill: skillId,
    conclusion,
    capabilityScore: cap.capabilityScore,
    proficiencyLevel: cap.proficiencyLevel,
    confidenceScore: cap.confidenceScore,
    trajectoryDirection: cap.trajectoryDirection,
    trajectoryVelocity: cap.trajectoryVelocity,
    evidenceSummary: ev.map(e => ({ id: e._id, title: e.title, quality: e.quality, value: e.normalizedValue, direction: e.direction })),
    strongestSupportingEvidence: ev.filter(e => e.direction === 'POSITIVE').slice(0,3),
    conflictingEvidence: ev.filter(e => e.direction === 'NEGATIVE'),
    contributingFactors: [],
    explanation
  };
};
`,

  'evidencePolicyService.js': `const EvidenceSourcePolicy = require('../models/EvidenceSourcePolicy');

exports.seedDefaultPolicies = async () => {
  const defaults = [
    { sourceType: 'PERFORMANCE_REVIEW', reliability: 0.9, defaultRelevance: 1.0 },
    { sourceType: 'PROJECT_FEEDBACK', reliability: 0.8, defaultRelevance: 0.9 },
    { sourceType: 'PEER_FEEDBACK', reliability: 0.7, defaultRelevance: 0.8 },
    { sourceType: 'ASSESSMENT', reliability: 0.85, defaultRelevance: 1.0 },
    { sourceType: 'CERTIFICATION', reliability: 0.7, defaultRelevance: 0.8 },
    { sourceType: 'SELF_REPORT', reliability: 0.3, defaultRelevance: 0.7 },
    { sourceType: 'SYSTEM_OBSERVATION', reliability: 0.9, defaultRelevance: 1.0 }
  ];

  for (const p of defaults) {
    await EvidenceSourcePolicy.findOneAndUpdate({ sourceType: p.sourceType }, { $setOnInsert: p }, { upsert: true });
  }
};

exports.getPolicies = async () => {
  return await EvidenceSourcePolicy.find();
};

exports.getPolicy = async (sourceType) => {
  return await EvidenceSourcePolicy.findOne({ sourceType });
};

exports.updatePolicy = async (id, data) => {
  return await EvidenceSourcePolicy.findByIdAndUpdate(id, data, { new: true });
};
`,

  'evidenceProcessingService.js': `const evidenceNormalizationService = require('./evidenceNormalizationService');
const evidenceQualityService = require('./evidenceQualityService');
const Evidence = require('../models/Evidence');
const evidencePolicyService = require('./evidencePolicyService');

exports.processEvidence = async (evidenceData) => {
  // Use Policy for reliability if available
  const policy = await evidencePolicyService.getPolicy(evidenceData.sourceType);
  
  if (evidenceData.metadata && evidenceData.metadata.reliability === undefined) {
    if (policy) evidenceData.metadata.reliability = policy.reliability;
  } else if (!evidenceData.metadata) {
    evidenceData.metadata = { reliability: policy ? policy.reliability : 0.7, relevance: policy ? policy.defaultRelevance : 0.8 };
  }

  // Calculate Normalized Value
  evidenceData.normalizedValue = evidenceNormalizationService.normalize(evidenceData);

  // Calculate Quality
  evidenceData.quality = evidenceQualityService.calculateQuality(evidenceData);

  // Save evidence
  const evidence = new Evidence(evidenceData);
  await evidence.save();

  return evidence;
};
`,

  'capabilitySnapshotService.js': `const EmployeeSkillCapabilitySnapshot = require('../models/EmployeeSkillCapabilitySnapshot');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');

exports.createSnapshot = async (employeeId, skillId, snapshotReason = 'RECALCULATION') => {
  const current = await EmployeeSkillCapability.findOne({ employee: employeeId, skill: skillId });
  if (!current) return null;

  const snapshot = new EmployeeSkillCapabilitySnapshot({
    employee: current.employee,
    skill: current.skill,
    capabilityScore: current.capabilityScore,
    proficiencyLevel: current.proficiencyLevel,
    confidenceScore: current.confidenceScore,
    evidenceSufficiency: current.evidenceSufficiency,
    trajectoryDirection: current.trajectoryDirection,
    trajectoryVelocity: current.trajectoryVelocity,
    evidenceCount: current.observationCount, // Mapping observationCount to evidenceCount
    effectiveEvidenceCount: current.observationCount, // Simplified
    snapshotReason,
    calculatedAt: new Date()
  });

  await snapshot.save();
  return snapshot;
};

exports.getHistory = async (employeeId, skillId) => {
  return await EmployeeSkillCapabilitySnapshot.find({ employee: employeeId, skill: skillId }).sort({ calculatedAt: 1 });
};
`,

  'aiIntelligenceService.js': `const groqService = require('./groqService');
const Employee = require('../models/Employee');
const capabilityExplanationService = require('./capabilityExplanationService');

exports.analyzeEvidence = async (text) => {
  const prompt = \`Extract candidate skills and competencies from the following evidence text. Return in strictly JSON format: { "skills": [...], "competencies": [...], "reasoning": "...", "confidence": 0.0-1.0 }. Text: \${text}\`;
  const response = await groqService.generateStructuredResponse(prompt, ['skills', 'competencies', 'reasoning', 'confidence']);
  return JSON.parse(response);
};

exports.summarizeFeedback = async (feedbacks) => {
  const text = feedbacks.map(f => f.description).join('\\n---\\n');
  const prompt = \`Summarize the following feedback records into strengths, developmentAreas, and recurringThemes. Return JSON: { "summary": "", "strengths": [], "developmentAreas": [], "recurringThemes": [] }. Feedback: \${text}\`;
  const response = await groqService.generateStructuredResponse(prompt, ['summary', 'strengths', 'developmentAreas', 'recurringThemes']);
  return JSON.parse(response);
};

exports.explainCapability = async (employeeId, skillId) => {
  const structured = await capabilityExplanationService.explainCapability(employeeId, skillId);
  const prompt = \`Convert this structured capability explanation into a natural, encouraging paragraph for the employee. JSON: \${JSON.stringify(structured)}\`;
  return await groqService.generateText(prompt);
};

exports.chat = async (employeeId, query) => {
  const employee = await Employee.findById(employeeId).populate('role');
  const context = \`You are TalentTwin Assistant. The employee is \${employee.firstName} \${employee.lastName}, Role: \${employee.role?.title || 'Unknown'}. Please answer their query based on this limited context.\`;
  return await groqService.generateText(context + '\\n\\nQuery: ' + query);
};
`,

  'careerSimulationService.js': `const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const JobRole = require('../models/JobRole');
const groqService = require('./groqService');

exports.simulateCareerPath = async (employeeId, targetJobRoleId) => {
  const role = await JobRole.findById(targetJobRoleId);
  if (!role) throw new Error("Job role not found");

  const capabilities = await EmployeeSkillCapability.find({ employee: employeeId });
  const capMap = {};
  capabilities.forEach(c => capMap[c.skill.toString()] = c);

  let matchScore = 0;
  let totalWeight = 0;
  const gaps = [];

  for (const req of role.skillRequirements) {
    const weight = req.importance === 'CRITICAL' ? 3 : req.importance === 'HIGH' ? 2 : req.importance === 'MEDIUM' ? 1.5 : 1;
    totalWeight += weight;

    const cap = capMap[req.skill.toString()];
    if (cap && cap.capabilityScore !== null) {
      const currentLevel = cap.proficiencyLevel;
      if (currentLevel >= req.requiredLevel) {
        matchScore += weight;
      } else {
        matchScore += weight * (currentLevel / req.requiredLevel);
        gaps.push({ skill: req.skill, currentLevel, requiredLevel: req.requiredLevel, gapSize: req.requiredLevel - currentLevel });
      }
    } else {
      gaps.push({ skill: req.skill, currentLevel: 0, requiredLevel: req.requiredLevel, gapSize: req.requiredLevel, insufficientEvidence: true });
    }
  }

  const overallReadiness = totalWeight > 0 ? matchScore / totalWeight : 0;
  let currentState = 'HAS_GAPS';
  if (overallReadiness >= 1) currentState = 'MEETS_REQUIREMENTS';
  else if (capabilities.length === 0) currentState = 'INSUFFICIENT_EVIDENCE';

  // Deterministic simulation generated. Optionally append AI dev sequence.
  const prompt = \`Create a short development sequence for an employee moving to \${role.title} with gaps: \${JSON.stringify(gaps.map(g => g.skill))}. Output JSON { "developmentSequence": ["step1", "step2"] }\`;
  let aiRes = { developmentSequence: [] };
  try {
     const str = await groqService.generateStructuredResponse(prompt, ['developmentSequence']);
     aiRes = JSON.parse(str);
  } catch(e) {}

  return {
    employeeId,
    targetRole: role,
    overallReadiness,
    currentState,
    gaps,
    developmentSequence: aiRes.developmentSequence
  };
};
`,

  'teamIntelligenceService.js': `const Team = require('../models/Team');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');

exports.getTeamCapabilities = async (teamId) => {
  const team = await Team.findById(teamId).populate('members');
  if (!team) throw new Error("Team not found");

  const memberIds = team.members.map(m => m._id);
  const capabilities = await EmployeeSkillCapability.find({ employee: { $in: memberIds } }).populate('skill');

  const skillAgg = {};
  capabilities.forEach(cap => {
    const sId = cap.skill._id.toString();
    if (!skillAgg[sId]) {
      skillAgg[sId] = { skill: cap.skill, sum: 0, count: 0, improving: 0, declining: 0, stable: 0, insufficient: 0 };
    }
    if (cap.capabilityScore !== null) {
      skillAgg[sId].sum += cap.capabilityScore;
      skillAgg[sId].count++;
    } else {
      skillAgg[sId].insufficient++;
    }

    if (cap.trajectoryDirection === 'IMPROVING') skillAgg[sId].improving++;
    if (cap.trajectoryDirection === 'DECLINING') skillAgg[sId].declining++;
    if (cap.trajectoryDirection === 'STABLE') skillAgg[sId].stable++;
  });

  return Object.values(skillAgg).map(s => ({
    skill: s.skill,
    averageCapability: s.count > 0 ? s.sum / s.count : null,
    capableCount: s.count,
    improvingCount: s.improving,
    decliningCount: s.declining,
    stableCount: s.stable,
    insufficientCount: s.insufficient
  }));
};
`,

  'skillRiskService.js': `const SkillRisk = require('../models/SkillRisk');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const Employee = require('../models/Employee');

exports.evaluateSkillRisk = async (skillId, scopeType, scopeId) => {
  // Simplistic org-level evaluation for example
  let filter = { skill: skillId };
  // ignoring scope filtering for simplicity in this base implementation, assuming org-level

  const caps = await EmployeeSkillCapability.find(filter);
  const totalEmployees = await Employee.countDocuments();

  let capableCount = 0;
  let sumCap = 0;
  caps.forEach(c => {
    if (c.capabilityScore !== null && c.capabilityScore > 0.4) {
      capableCount++;
      sumCap += c.capabilityScore;
    }
  });

  const concentrationScore = totalEmployees > 0 ? (totalEmployees - capableCount) / totalEmployees : 0;
  
  let riskLevel = 'LOW';
  if (concentrationScore > 0.9) riskLevel = 'CRITICAL';
  else if (concentrationScore > 0.7) riskLevel = 'HIGH';
  else if (concentrationScore > 0.5) riskLevel = 'MEDIUM';

  const risk = new SkillRisk({
    skill: skillId,
    scopeType,
    scopeId,
    riskLevel,
    riskScore: concentrationScore,
    capableEmployeeCount: capableCount,
    averageCapability: capableCount > 0 ? sumCap/capableCount : 0,
    concentrationScore
  });

  await risk.save();
  return risk;
};
`,

  'organizationIntelligenceService.js': `const Employee = require('../models/Employee');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');

exports.getOverview = async () => {
  const totalEmployees = await Employee.countDocuments();
  const allCaps = await EmployeeSkillCapability.find();
  
  let improving = 0, declining = 0, stable = 0, insufficient = 0;
  allCaps.forEach(c => {
    if (c.trajectoryDirection === 'IMPROVING') improving++;
    else if (c.trajectoryDirection === 'DECLINING') declining++;
    else if (c.trajectoryDirection === 'STABLE') stable++;
    else insufficient++;
  });

  const total = allCaps.length || 1;

  return {
    totalEmployees,
    totalCapabilityRecords: allCaps.length,
    percentages: {
      improving: improving / total,
      declining: declining / total,
      stable: stable / total,
      insufficient: insufficient / total
    }
  };
};
`,

  'departmentIntelligenceService.js': `const Employee = require('../models/Employee');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');

exports.getDepartmentOverview = async (department) => {
  const employees = await Employee.find({ department });
  const employeeIds = employees.map(e => e._id);
  
  const allCaps = await EmployeeSkillCapability.find({ employee: { $in: employeeIds } });
  
  let improving = 0, declining = 0, stable = 0, insufficient = 0;
  allCaps.forEach(c => {
    if (c.trajectoryDirection === 'IMPROVING') improving++;
    else if (c.trajectoryDirection === 'DECLINING') declining++;
    else if (c.trajectoryDirection === 'STABLE') stable++;
    else insufficient++;
  });

  const total = allCaps.length || 1;

  return {
    department,
    totalEmployees: employees.length,
    percentages: {
      improving: improving / total,
      declining: declining / total,
      stable: stable / total,
      insufficient: insufficient / total
    }
  };
};
`,

  'managerActionService.js': `const ManagerAction = require('../models/ManagerAction');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');

exports.generateActions = async () => {
  // Find declining critical skills
  const declining = await EmployeeSkillCapability.find({ trajectoryDirection: 'DECLINING' }).populate('employee skill');
  
  for (const cap of declining) {
    const existing = await ManagerAction.findOne({ type: 'DECLINING_SKILL', referenceId: cap.employee._id, status: 'OPEN' });
    if (!existing) {
      await ManagerAction.create({
        type: 'DECLINING_SKILL',
        severity: 'HIGH',
        title: \`Declining capability: \${cap.skill.name}\`,
        description: \`\${cap.employee.firstName} \${cap.employee.lastName} is showing a declining trajectory in \${cap.skill.name}.\`,
        referenceType: 'EMPLOYEE',
        referenceId: cap.employee._id,
        recommendedNextStep: 'Schedule a check-in to discuss recent evidence signals.'
      });
    }
  }
};

exports.getActions = async () => {
  return await ManagerAction.find().sort({ severity: -1, createdAt: -1 });
};

exports.updateActionStatus = async (id, status) => {
  return await ManagerAction.findByIdAndUpdate(id, { status }, { new: true });
};
`
};

for (const [filename, content] of Object.entries(services)) {
  fs.writeFileSync(path.join(servicesDir, filename), content);
  console.log('Created', filename);
}
