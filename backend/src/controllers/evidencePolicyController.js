const evidencePolicyService = require('../services/evidencePolicyService');

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
