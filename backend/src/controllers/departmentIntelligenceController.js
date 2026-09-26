const deptIntellService = require('../services/departmentIntelligenceService');

exports.getDepartmentOverview = async (req, res, next) => {
  try {
    res.json({ success: true, data: await deptIntellService.getDepartmentOverview(req.params.department) });
  } catch (error) { next(error); }
};
