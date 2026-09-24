const mongoose = require('mongoose');

const skillGapSchema = new mongoose.Schema({
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  requiredLevel: {
    type: Number,
    required: true
  },
  importance: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  
  // Preserved Context from EmployeeSkillCapability
  currentCapabilityScore: {
    type: Number,
    default: null
  },
  currentProficiencyLevel: {
    type: Number,
    default: null
  },
  currentConfidenceScore: {
    type: Number,
    default: null
  },
  currentTrajectoryDirection: {
    type: String,
    default: null
  },
  currentTrajectoryVelocity: {
    type: Number,
    default: null
  },

  // Calculated Gap
  gap: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['MEETS', 'NEAR_GAP', 'GAP', 'INSUFFICIENT_EVIDENCE'],
    default: 'INSUFFICIENT_EVIDENCE'
  }
}, { _id: false });

const employeeRoleGapSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  jobRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRole',
    required: true
  },
  
  skills: [skillGapSchema],

  roleStatus: {
    type: String,
    enum: ['MEETS_REQUIREMENTS', 'HAS_GAPS', 'INSUFFICIENT_EVIDENCE'],
    default: 'INSUFFICIENT_EVIDENCE'
  },

  totalRequiredSkills: { type: Number, default: 0 },
  meetsCount: { type: Number, default: 0 },
  nearGapCount: { type: Number, default: 0 },
  gapCount: { type: Number, default: 0 },
  insufficientEvidenceCount: { type: Number, default: 0 },

  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique compound index to prevent duplicate state documents
employeeRoleGapSchema.index({ employee: 1, jobRole: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeRoleGap', employeeRoleGapSchema);
