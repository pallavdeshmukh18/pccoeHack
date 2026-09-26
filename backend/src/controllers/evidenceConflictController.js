const evidenceConflictService = require('../services/evidenceConflictService');

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
