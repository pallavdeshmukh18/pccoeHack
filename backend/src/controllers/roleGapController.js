const roleGapService = require('../services/roleGapService');
const EmployeeRoleGap = require('../models/EmployeeRoleGap');

exports.recalculateRoleGap = async (req, res) => {
  try {
    const { employeeId, jobRoleId } = req.body;
    
    if (!employeeId || !jobRoleId) {
      return res.status(400).json({ success: false, message: 'employeeId and jobRoleId are required' });
    }

    const gap = await roleGapService.calculateEmployeeRoleGap(employeeId, jobRoleId);
    
    res.status(200).json({ success: true, data: gap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeRoleGaps = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const gaps = await EmployeeRoleGap.find({ employee: employeeId })
      .populate('jobRole', 'title department')
      .populate('skills.skill', 'name category')
      .sort({ calculatedAt: -1 });

    res.status(200).json({ success: true, data: gaps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeRoleGap = async (req, res) => {
  try {
    const { employeeId, jobRoleId } = req.params;
    const gap = await EmployeeRoleGap.findOne({ employee: employeeId, jobRole: jobRoleId })
      .populate('jobRole', 'title department')
      .populate('skills.skill', 'name category');

    if (!gap) {
      return res.status(404).json({ success: false, message: 'Role gap not found' });
    }

    res.status(200).json({ success: true, data: gap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
