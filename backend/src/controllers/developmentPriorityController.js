const developmentPriorityService = require('../services/developmentPriorityService');
const EmployeeDevelopmentPriority = require('../models/EmployeeDevelopmentPriority');

exports.recalculateDevelopmentPriority = async (req, res) => {
  try {
    const { employeeId, jobRoleId } = req.body;
    
    if (!employeeId || !jobRoleId) {
      return res.status(400).json({ success: false, message: 'employeeId and jobRoleId are required' });
    }

    const priority = await developmentPriorityService.calculateEmployeeDevelopmentPriority(employeeId, jobRoleId);
    
    res.status(200).json({ success: true, data: priority });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeDevelopmentPriorities = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const priorities = await EmployeeDevelopmentPriority.find({ employee: employeeId })
      .populate('jobRole', 'title department')
      .populate('priorities.skill', 'name category')
      .sort({ calculatedAt: -1 });

    res.status(200).json({ success: true, data: priorities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeDevelopmentPriority = async (req, res) => {
  try {
    const { employeeId, jobRoleId } = req.params;
    const priority = await EmployeeDevelopmentPriority.findOne({ employee: employeeId, jobRole: jobRoleId })
      .populate('jobRole', 'title department')
      .populate('priorities.skill', 'name category');

    if (!priority) {
      return res.status(404).json({ success: false, message: 'Development priority not found' });
    }

    res.status(200).json({ success: true, data: priority });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
