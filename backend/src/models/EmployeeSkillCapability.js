const mongoose = require('mongoose');

const employeeSkillCapabilitySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
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
  evidenceCount: {
    type: Number,
    default: 0
  },
  effectiveEvidenceCount: {
    type: Number,
    default: 0
  },
  excludedEvidenceCount: {
    type: Number,
    default: 0
  },
  
  // Phase 5B: Confidence & Sufficiency
  evidenceSufficiency: {
    type: String,
    enum: ['INSUFFICIENT', 'LIMITED', 'MODERATE', 'STRONG'],
    default: 'INSUFFICIENT'
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  quantityScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  diversityScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  consistencyScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },

  // Phase 5C: Skill Trajectory & Velocity
  trajectoryDirection: {
    type: String,
    enum: ['IMPROVING', 'STABLE', 'DECLINING', 'INSUFFICIENT_DATA'],
    default: 'INSUFFICIENT_DATA'
  },
  trajectorySlope: {
    type: Number,
    default: null
  },
  trajectoryVelocity: {
    type: Number,
    default: null
  },
  trajectoryR2: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  trajectoryConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  observationCount: {
    type: Number,
    default: 0
  },
  firstObservedAt: {
    type: Date,
    default: null
  },
  lastObservedAt: {
    type: Date,
    default: null
  },
  lastEvidenceAt: {
    type: Date,
    default: null
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique compound index to prevent duplicate state documents
employeeSkillCapabilitySchema.index({ employee: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeSkillCapability', employeeSkillCapabilitySchema);
