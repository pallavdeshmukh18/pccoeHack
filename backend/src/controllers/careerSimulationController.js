const careerSimulationService = require('../services/careerSimulationService');

exports.simulateCareerPath = async (req, res, next) => {
  try {
    res.json({ success: true, data: await careerSimulationService.simulateCareerPath(req.body.employeeId, req.body.jobRoleId) });
  } catch (error) { next(error); }
};
