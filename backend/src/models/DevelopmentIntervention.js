const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  capturedAt: { type: Date, required: true },
  capabilityScore: { type: Number, default: null },
  proficiencyLevel: { type: Number, default: null },
  confidenceScore: { type: Number, default: null },
  trajectoryDirection: { type: String, default: null },
  trajectoryVelocity: { type: Number, default: null },
  evidenceCount: { type: Number, default: null },
  effectiveEvidenceCount: { type: Number, default: null }
}, { _id: false });

const impactSchema = new mongoose.Schema({
  capabilityScoreDelta: { type: Number, default: null },
  proficiencyLevelDelta: { type: Number, default: null },
  confidenceScoreDelta: { type: Number, default: null },
  trajectoryVelocityDelta: { type: Number, default: null },
  evidenceCountDelta: { type: Number, default: null },
  effectiveEvidenceCountDelta: { type: Number, default: null },

  capabilityImproved: { type: Boolean, default: null },
  confidenceImproved: { type: Boolean, default: null },
  trajectoryImproved: { type: Boolean, default: null },

  assessmentAvailable: { type: Boolean, default: false },

  impactStatus: {
    type: String,
    enum: [
      'NOT_STARTED',
      'INSUFFICIENT_BASELINE',
      'IN_PROGRESS',
      'COMPLETED_NO_MEASURABLE_CHANGE',
      'COMPLETED_IMPROVED',
      'COMPLETED_DECLINED',
      'COMPLETED_INCONCLUSIVE'
    ],
    default: 'NOT_STARTED'
  },
  
  impactSummary: { type: String, default: null }
}, { _id: false });

const developmentInterventionSchema = new mongoose.Schema({
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
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },

  developmentRecommendation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DevelopmentRecommendation',
    default: null
  },
  developmentPriority: {
    type: mongoose.Schema.Types.ObjectId, // Logical reference (might be embedded in actual implementations, but modeled as ID reference if needed)
    default: null
  },

  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  interventionType: {
    type: String,
    enum: ['LEARNING', 'PRACTICE', 'PROJECT', 'ASSESSMENT', 'MENTORING', 'COACHING', 'OTHER'],
    required: true
  },

  status: {
    type: String,
    enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PLANNED'
  },

  plannedStartDate: { type: Date },
  plannedEndDate: { type: Date },
  actualStartDate: { type: Date },
  actualEndDate: { type: Date },

  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  employeeFeedback: { type: String },
  outcomeNotes: { type: String },

  baselineSnapshot: {
    type: snapshotSchema,
    default: null
  },
  
  postInterventionSnapshot: {
    type: snapshotSchema,
    default: null
  },

  impact: {
    type: impactSchema,
    default: () => ({ impactStatus: 'NOT_STARTED' })
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DevelopmentIntervention', developmentInterventionSchema);
