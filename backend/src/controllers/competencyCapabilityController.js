const competencyCapabilityService = require('../services/competencyCapabilityService');
const EmployeeCompetencyCapability = require('../models/EmployeeCompetencyCapability');

exports.recalculateCompetencyCapability = async (req, res) => {
  try {
    const { employeeId, competencyId } = req.body;
    
    if (!employeeId || !competencyId) {
      return res.status(400).json({ success: false, message: 'employeeId and competencyId are required' });
    }

    const capability = await competencyCapabilityService.calculateEmployeeCompetencyCapability(employeeId, competencyId);
    
    res.status(200).json({ success: true, data: capability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeCompetencyCapabilities = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const capabilities = await EmployeeCompetencyCapability.find({ employee: employeeId })
      .populate('competency', 'name description')
      .sort({ calculatedAt: -1 });

    res.status(200).json({ success: true, data: capabilities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeCompetencyCapability = async (req, res) => {
  try {
    const { employeeId, competencyId } = req.params;
    const capability = await EmployeeCompetencyCapability.findOne({ employee: employeeId, competency: competencyId })
      .populate('competency', 'name description');

    if (!capability) {
      return res.status(404).json({ success: false, message: 'Competency capability not found' });
    }

    res.status(200).json({ success: true, data: capability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
