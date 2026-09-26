const mongoose = require('mongoose');

const skillRiskSchema = new mongoose.Schema({
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  scopeType: { type: String, enum: ['ORGANIZATION', 'DEPARTMENT', 'TEAM'], required: true },
  scopeId: { type: String, required: true }, // e.g. "org", department name, or teamId
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
  riskScore: { type: Number, default: 0 },
  capableEmployeeCount: { type: Number, default: 0 },
  criticalEmployeeCount: { type: Number, default: 0 },
  averageCapability: { type: Number, default: 0 },
  averageConfidence: { type: Number, default: 0 },
  trajectorySignal: { type: Number, default: 0 },
  concentrationScore: { type: Number, default: 0 },
  evidenceCoverage: { type: Number, default: 0 },
  riskFactors: [{ type: String }],
  calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

skillRiskSchema.index({ skill: 1, scopeType: 1, scopeId: 1 });

module.exports = mongoose.model('SkillRisk', skillRiskSchema);
