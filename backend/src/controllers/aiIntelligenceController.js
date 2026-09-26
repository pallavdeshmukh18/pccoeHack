const aiIntelligenceService = require('../services/aiIntelligenceService');

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
