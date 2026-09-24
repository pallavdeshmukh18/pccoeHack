const capabilityAggregationService = require('../services/capabilityAggregationService');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');

exports.recalculateCapability = async (req, res) => {
  try {
    const { employeeId, skillId } = req.body;
    
    if (!employeeId || !skillId) {
      return res.status(400).json({ success: false, message: 'employeeId and skillId are required' });
    }

    const capability = await capabilityAggregationService.calculateEmployeeSkillCapability(employeeId, skillId);
    
    res.status(200).json({ success: true, data: capability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeCapabilities = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const capabilities = await EmployeeSkillCapability.find({ employee: employeeId })
      .populate('skill', 'name category')
      .sort({ calculatedAt: -1 });

    res.status(200).json({ success: true, data: capabilities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeSkillCapability = async (req, res) => {
  try {
    const { employeeId, skillId } = req.params;
    const capability = await EmployeeSkillCapability.findOne({ employee: employeeId, skill: skillId })
      .populate('skill', 'name category');

    if (!capability) {
      return res.status(404).json({ success: false, message: 'Capability not found' });
    }

    res.status(200).json({ success: true, data: capability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
