const skillRiskService = require('../services/skillRiskService');
const SkillRisk = require('../models/SkillRisk');

exports.evaluateSkillRisk = async (req, res, next) => {
  try {
    res.json({ success: true, data: await skillRiskService.evaluateSkillRisk(req.body.skillId, req.body.scopeType, req.body.scopeId) });
  } catch (error) { next(error); }
};

exports.getSkillRisks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.scopeType) filter.scopeType = req.query.scopeType;
    if (req.query.scopeId) filter.scopeId = req.query.scopeId;
    res.json({ success: true, data: await SkillRisk.find(filter).populate('skill', 'name') });
  } catch(error) { next(error); }
}
