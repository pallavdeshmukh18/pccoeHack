const capabilityExplanationService = require('../services/capabilityExplanationService');

exports.explainCapability = async (req, res, next) => {
  try {
    const { employeeId, skillId } = req.params;
    const explanation = await capabilityExplanationService.explainCapability(employeeId, skillId);
    res.json({ success: true, data: explanation });
  } catch (error) { next(error); }
};
