const mongoose = require('mongoose');

const priorityFactorSchema = new mongoose.Schema({
  gapSeverity: { type: Number, required: true },
  importance: { type: Number, required: true },
  confidence: { type: Number, required: true },
  trajectory: { type: Number, required: true },
  evidenceSufficiency: { type: Number, required: true }
}, { _id: false });

const developmentPrioritySchema = new mongoose.Schema({
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
  trajectoryDirection: {
    type: String,
    default: null
  },
  trajectoryVelocity: {
    type: Number,
    default: null
  },
  gap: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['MEETS', 'NEAR_GAP', 'GAP', 'INSUFFICIENT_EVIDENCE'],
    required: true
  },
  priorityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  priorityLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  priorityFactors: {
    type: priorityFactorSchema,
    required: true
  },
  priorityReason: {
    type: String,
    required: true
  }
}, { _id: false });

const employeeDevelopmentPrioritySchema = new mongoose.Schema({
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
  
  priorities: [developmentPrioritySchema],

  totalRequiredSkills: { type: Number, default: 0 },
  confirmedDevelopmentNeeds: { type: Number, default: 0 },
  criticalCount: { type: Number, default: 0 },
  highCount: { type: Number, default: 0 },
  mediumCount: { type: Number, default: 0 },
  lowCount: { type: Number, default: 0 },
  insufficientEvidenceCount: { type: Number, default: 0 },
  meetsCount: { type: Number, default: 0 },

  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

employeeDevelopmentPrioritySchema.index({ employee: 1, jobRole: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeDevelopmentPriority', employeeDevelopmentPrioritySchema);
