const developmentCopilotService = require('../services/developmentCopilotService');
const DevelopmentRecommendation = require('../models/DevelopmentRecommendation');

exports.generateCopilotPlan = async (req, res) => {
  try {
    const { employeeId, jobRoleId } = req.body;
    
    if (!employeeId || !jobRoleId) {
      return res.status(400).json({ success: false, message: 'employeeId and jobRoleId are required' });
    }

    const plan = await developmentCopilotService.generateEmployeeDevelopmentPlan(employeeId, jobRoleId);
    
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeCopilotPlans = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const plans = await DevelopmentRecommendation.find({ employee: employeeId })
      .populate('jobRole', 'title department')
      .populate('priorities.skill', 'name category')
      .sort({ generatedAt: -1 });

    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeCopilotPlan = async (req, res) => {
  try {
    const { employeeId, jobRoleId } = req.params;
    const plan = await DevelopmentRecommendation.findOne({ employee: employeeId, jobRole: jobRoleId })
      .populate('jobRole', 'title department')
      .populate('priorities.skill', 'name category');

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Development plan not found' });
    }

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
