const orgIntellService = require('../services/organizationIntelligenceService');

exports.getOverview = async (req, res, next) => {
  try {
    res.json({ success: true, data: await orgIntellService.getOverview() });
  } catch (error) { next(error); }
};
