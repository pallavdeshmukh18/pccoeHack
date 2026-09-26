const fs = require('fs');
const path = require('path');

const ctrlsDir = path.join(__dirname, '../src/controllers');

const ctrls = {
  'evidenceConflictController.js': `const evidenceConflictService = require('../services/evidenceConflictService');

exports.detectConflicts = async (req, res, next) => {
  try {
    const { employeeId, skillId } = req.body;
    const conflict = await evidenceConflictService.detectConflicts(employeeId, skillId);
    res.json({ success: true, data: conflict });
  } catch (error) { next(error); }
};

exports.getEmployeeConflicts = async (req, res, next) => {
  try {
    const conflicts = await evidenceConflictService.getEmployeeConflicts(req.params.employeeId);
    res.json({ success: true, data: conflicts });
  } catch (error) { next(error); }
};
`,
  'capabilityExplanationController.js': `const capabilityExplanationService = require('../services/capabilityExplanationService');

exports.explainCapability = async (req, res, next) => {
  try {
    const { employeeId, skillId } = req.params;
    const explanation = await capabilityExplanationService.explainCapability(employeeId, skillId);
    res.json({ success: true, data: explanation });
  } catch (error) { next(error); }
};
`,
  'evidencePolicyController.js': `const evidencePolicyService = require('../services/evidencePolicyService');

exports.getPolicies = async (req, res, next) => {
  try {
    res.json({ success: true, data: await evidencePolicyService.getPolicies() });
  } catch (error) { next(error); }
};

exports.updatePolicy = async (req, res, next) => {
  try {
    res.json({ success: true, data: await evidencePolicyService.updatePolicy(req.params.id, req.body) });
  } catch (error) { next(error); }
};
`,
  'aiIntelligenceController.js': `const aiIntelligenceService = require('../services/aiIntelligenceService');

exports.analyzeEvidence = async (req, res, next) => {
  try {
    res.json({ success: true, data: await aiIntelligenceService.analyzeEvidence(req.body.text) });
  } catch (error) { next(error); }
};

exports.summarizeFeedback = async (req, res, next) => {
  try {
    res.json({ success: true, data: await aiIntelligenceService.summarizeFeedback(req.body.feedbacks) });
  } catch (error) { next(error); }
};

exports.explainCapability = async (req, res, next) => {
  try {
    res.json({ success: true, data: await aiIntelligenceService.explainCapability(req.params.employeeId, req.params.skillId) });
  } catch (error) { next(error); }
};

exports.chat = async (req, res, next) => {
  try {
    res.json({ success: true, data: await aiIntelligenceService.chat(req.user.employeeId, req.body.query) });
  } catch (error) { next(error); }
};
`,
  'careerSimulationController.js': `const careerSimulationService = require('../services/careerSimulationService');

exports.simulateCareerPath = async (req, res, next) => {
  try {
    res.json({ success: true, data: await careerSimulationService.simulateCareerPath(req.body.employeeId, req.body.jobRoleId) });
  } catch (error) { next(error); }
};
`,
  'teamIntelligenceController.js': `const teamIntelligenceService = require('../services/teamIntelligenceService');
const Team = require('../models/Team');

exports.getTeams = async (req, res, next) => {
  try {
    res.json({ success: true, data: await Team.find() });
  } catch (error) { next(error); }
};

exports.getTeamCapabilities = async (req, res, next) => {
  try {
    res.json({ success: true, data: await teamIntelligenceService.getTeamCapabilities(req.params.teamId) });
  } catch (error) { next(error); }
};
`,
  'skillRiskController.js': `const skillRiskService = require('../services/skillRiskService');

exports.evaluateSkillRisk = async (req, res, next) => {
  try {
    res.json({ success: true, data: await skillRiskService.evaluateSkillRisk(req.body.skillId, req.body.scopeType, req.body.scopeId) });
  } catch (error) { next(error); }
};
`,
  'organizationIntelligenceController.js': `const orgIntellService = require('../services/organizationIntelligenceService');

exports.getOverview = async (req, res, next) => {
  try {
    res.json({ success: true, data: await orgIntellService.getOverview() });
  } catch (error) { next(error); }
};
`,
  'departmentIntelligenceController.js': `const deptIntellService = require('../services/departmentIntelligenceService');

exports.getDepartmentOverview = async (req, res, next) => {
  try {
    res.json({ success: true, data: await deptIntellService.getDepartmentOverview(req.params.department) });
  } catch (error) { next(error); }
};
`,
  'managerActionController.js': `const managerActionService = require('../services/managerActionService');

exports.generateActions = async (req, res, next) => {
  try {
    await managerActionService.generateActions();
    res.json({ success: true, message: 'Actions generated' });
  } catch (error) { next(error); }
};

exports.getActions = async (req, res, next) => {
  try {
    res.json({ success: true, data: await managerActionService.getActions() });
  } catch (error) { next(error); }
};

exports.updateActionStatus = async (req, res, next) => {
  try {
    res.json({ success: true, data: await managerActionService.updateActionStatus(req.params.id, req.body.status) });
  } catch (error) { next(error); }
};
`
};

for (const [filename, content] of Object.entries(ctrls)) {
  fs.writeFileSync(path.join(ctrlsDir, filename), content);
  console.log('Created', filename);
}
