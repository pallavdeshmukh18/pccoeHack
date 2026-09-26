const teamIntelligenceService = require('../services/teamIntelligenceService');
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
