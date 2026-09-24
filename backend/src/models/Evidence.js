const mongoose = require('mongoose');
const Skill = require('./Skill');

const sourceTypes = [
  'INTERNAL_ASSESSMENT',
  'PROJECT',
  'KPI',
  'MANAGER_FEEDBACK',
  'PEER_FEEDBACK',
  'TRAINING',
  'CERTIFICATION',
  'EXTERNAL_GITHUB',
  'EXTERNAL_LEETCODE',
  'EXTERNAL_LINKEDIN',
  'EXTERNAL_COURSERA',
  'EXTERNAL_HACKERRANK',
  'GENERATED_AI_QUIZ',
  'GENERATED_SKILL_ASSESSMENT',
  'GENERATED_SIMULATION'
];

const evidenceKinds = [
  'OBSERVATION',
  'OUTCOME',
  'ASSESSMENT',
  'FEEDBACK',
  'ACHIEVEMENT',
  'ACTIVITY',
  'CERTIFICATION'
];

const evidenceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required']
  },
  sourceType: {
    type: String,
    enum: sourceTypes,
    required: [true, 'sourceType is required']
  },
  sourceId: {
    type: String,
    default: null
  },
  sourceReference: {
    type: String,
    default: null
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  occurredAt: {
    type: Date,
    default: Date.now
  },
  recordedAt: {
    type: Date,
    default: Date.now
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    default: null
  },
  competency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competency',
    default: null
  },
  rawValue: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'REVOKED', 'ARCHIVED'],
    default: 'ACTIVE'
  },
  direction: {
    type: String,
    enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
    default: 'POSITIVE'
  },
  evidenceKind: {
    type: String,
    enum: evidenceKinds,
    required: [true, 'evidenceKind is required']
  },
  // Phase 4B.1: Evidence Quality
  reliability: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  relevance: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  freshness: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  quality: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  // Phase 4B.2: Evidence Normalization
  normalizedValue: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  normalizationMethod: {
    type: String,
    default: null
  },
  normalizationOverride: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  minimize: false // ensures empty rawValue/metadata objects are saved
});

// Indexes for retrieval
evidenceSchema.index({ employee: 1 });
evidenceSchema.index({ employee: 1, skill: 1 });
evidenceSchema.index({ employee: 1, competency: 1 });
evidenceSchema.index({ employee: 1, sourceType: 1 });
evidenceSchema.index({ employee: 1, occurredAt: -1 });
evidenceSchema.index({ status: 1 });

// Pre-save validation for skill-competency mapping
evidenceSchema.pre('save', async function() {
  if (this.skill && this.competency) {
    const skill = await Skill.findById(this.skill).select('competency isActive');
    if (!skill) {
      throw new Error('Referenced skill does not exist.');
    }
    if (!skill.isActive) {
      throw new Error('Referenced skill is inactive.');
    }
    if (skill.competency.toString() !== this.competency.toString()) {
      throw new Error('Inconsistent mapping: Skill does not belong to the referenced competency.');
    }
  }
});

module.exports = mongoose.model('Evidence', evidenceSchema);
