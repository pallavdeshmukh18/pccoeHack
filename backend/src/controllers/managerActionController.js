const managerActionService = require('../services/managerActionService');

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
