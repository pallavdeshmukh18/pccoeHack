const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String, // could be an ObjectId or UUID
    required: true
  },
  question: {
    type: String,
    required: true
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  answer: {
    type: String,
    default: null
  },
  evaluation: {
    type: mongoose.Schema.Types.Mixed, // Storing structured evaluation object
    default: null
  },
  score: {
    type: Number,
    default: null
  },
  estimatedLevel: {
    type: Number,
    default: null
  },
  correctness: {
    type: Number,
    default: null
  },
  reasoningQuality: {
    type: Number,
    default: null
  },
  rubricCoverage: {
    type: Number,
    default: null
  },
  depth: {
    type: Number,
    default: null
  },
  dimensions: {
    type: [{
      name: String,
      score: Number,
      evidence: String
    }],
    default: []
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  missingAreas: {
    type: [String],
    default: []
  },
  feedback: {
    type: String,
    default: null
  },
  answeredAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const assessmentSessionSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required']
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: [true, 'Skill reference is required']
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
    default: 'IN_PROGRESS'
  },
  currentDifficulty: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  currentEstimate: {
    type: Number,
    default: 3
  },
  confidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  questions: {
    type: [questionSchema],
    default: []
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  minQuestions: {
    type: Number,
    default: 3
  },
  maxQuestions: {
    type: Number,
    default: 3
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  finalResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AssessmentSession', assessmentSessionSchema);
