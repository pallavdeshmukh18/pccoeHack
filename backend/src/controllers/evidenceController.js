const Evidence = require('../models/Evidence');
const Employee = require('../models/Employee');
const Skill = require('../models/Skill');
const Competency = require('../models/Competency');
const evidenceQualityService = require('../services/evidenceQualityService');
const evidenceNormalizationService = require('../services/evidenceNormalizationService');

exports.createEvidence = async (req, res) => {
  try {
    const data = req.body;
    
    // Check if employee exists
    const employee = await Employee.findById(data.employee);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (data.skill) {
      const skill = await Skill.findById(data.skill);
      if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    
    if (data.competency) {
      const comp = await Competency.findById(data.competency);
      if (!comp) return res.status(404).json({ success: false, message: 'Competency not found' });
    }

    let enrichedData = evidenceQualityService.enrichEvidenceQuality(data);
    enrichedData = evidenceNormalizationService.enrichEvidenceNormalization(enrichedData);
    
    const evidence = new Evidence(enrichedData);
    await evidence.save();

    res.status(201).json({ success: true, data: evidence });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getEvidence = async (req, res) => {
  try {
    const filter = {};
    if (req.query.employeeId) filter.employee = req.query.employeeId;
    if (req.query.skillId) filter.skill = req.query.skillId;
    if (req.query.competencyId) filter.competency = req.query.competencyId;
    if (req.query.sourceType) filter.sourceType = req.query.sourceType;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.direction) filter.direction = req.query.direction;
    if (req.query.evidenceKind) filter.evidenceKind = req.query.evidenceKind;

    const evidence = await Evidence.find(filter)
      .populate('employee', 'firstName lastName')
      .populate('skill', 'name')
      .populate('competency', 'name')
      .sort({ occurredAt: -1 });

    res.status(200).json({ success: true, data: evidence });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEvidenceById = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id)
      .populate('employee', 'firstName lastName')
      .populate('skill', 'name')
      .populate('competency', 'name');

    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence not found' });
    }
    res.status(200).json({ success: true, data: evidence });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);
    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence not found' });
    }

    // Only allow updating specific fields to preserve core immutability of evidence observation
    const updatableFields = ['title', 'description', 'rawValue', 'metadata', 'status', 'direction', 'reliability', 'relevance', 'freshness'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        evidence[field] = req.body[field];
      }
    });

    // If explicit quality wasn't passed via an override or if any component changed, recalculate
    if (req.body.reliability !== undefined || req.body.relevance !== undefined || req.body.freshness !== undefined) {
       evidence.quality = evidenceQualityService.calculateQuality(evidence.reliability, evidence.relevance, evidence.freshness);
    }
    
    // If rawValue changed, recalculate normalization
    if (req.body.rawValue !== undefined || req.body.sourceType !== undefined) {
      const { normalizedValue, normalizationMethod } = evidenceNormalizationService.normalizeEvidence({
        sourceType: evidence.sourceType,
        rawValue: evidence.rawValue
      });
      evidence.normalizedValue = normalizedValue;
      evidence.normalizationMethod = normalizationMethod;
    }

    await evidence.save();
    res.status(200).json({ success: true, data: evidence });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.archiveEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);
    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence not found' });
    }

    evidence.status = 'ARCHIVED';
    await evidence.save();
    
    res.status(200).json({ success: true, message: 'Evidence archived successfully', data: evidence });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
