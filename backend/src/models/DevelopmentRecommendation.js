const mongoose = require('mongoose');

const recommendationPrioritySchema = new mongoose.Schema({
  // Preserved exactly from Phase 6A backend logic
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  priorityLevel: { type: String, required: true },
  priorityScore: { type: Number, required: true },
  currentProficiencyLevel: { type: Number, default: null },
  requiredLevel: { type: Number, required: true },
  importance: { type: String, required: true },
  confidenceScore: { type: Number, default: null },
  trajectoryDirection: { type: String, default: null },
  trajectoryVelocity: { type: Number, default: null },

  // AI Generated fields
  developmentObjective: { type: String },
  whyThisMatters: { type: String },
  recommendedActions: [{ type: String }],
  practiceActivities: [{ type: String }],
  suggestedProjects: [{ type: String }],
  successIndicators: [{ type: String }],
  estimatedTimeframe: { type: String },
  cautions: [{ type: String }]
}, { _id: false });

const developmentRecommendationSchema = new mongoose.Schema({
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
  
  generatedAt: { type: Date, default: null },
  model: { type: String, default: null },
  promptVersion: { type: String, default: null },

  priorities: [recommendationPrioritySchema],

  overallSummary: { type: String, default: null },
  developmentPlan: { type: String, default: null },

  generationStatus: {
    type: String,
    enum: ['GENERATED', 'FAILED'],
    required: true
  },
  errorMessage: { type: String, default: null }

}, {
  timestamps: true
});

developmentRecommendationSchema.index({ employee: 1, jobRole: 1 }, { unique: true });

module.exports = mongoose.model('DevelopmentRecommendation', developmentRecommendationSchema);
