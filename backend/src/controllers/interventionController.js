const interventionService = require('../services/interventionService');
const DevelopmentIntervention = require('../models/DevelopmentIntervention');

exports.createIntervention = async (req, res) => {
  try {
    const intervention = await interventionService.createIntervention(req.body);
    res.status(201).json({ success: true, data: intervention });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getIntervention = async (req, res) => {
  try {
    const intervention = await interventionService.getIntervention(req.params.id);
    res.status(200).json({ success: true, data: intervention });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

exports.getEmployeeInterventions = async (req, res) => {
  try {
    const interventions = await DevelopmentIntervention.find({ employee: req.params.employeeId })
      .populate('jobRole', 'title department')
      .populate('skill', 'name category')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: interventions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateIntervention = async (req, res) => {
  try {
    const intervention = await interventionService.updateIntervention(req.params.id, req.body);
    res.status(200).json({ success: true, data: intervention });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.completeIntervention = async (req, res) => {
  try {
    const intervention = await interventionService.completeIntervention(req.params.id);
    res.status(200).json({ success: true, data: intervention });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
