const mongoose = require('mongoose');

const employeeCompetencyCapabilitySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  competency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competency',
    required: true
  },
  capabilityScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  proficiencyLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  evidenceSufficiency: {
    type: String,
    enum: ['INSUFFICIENT', 'LIMITED', 'MODERATE', 'STRONG'],
    default: 'INSUFFICIENT'
  },
  skillCount: {
    type: Number,
    default: 0
  },
  effectiveSkillCount: {
    type: Number,
    default: 0
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique compound index to prevent duplicate state documents
employeeCompetencyCapabilitySchema.index({ employee: 1, competency: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeCompetencyCapability', employeeCompetencyCapabilitySchema);
