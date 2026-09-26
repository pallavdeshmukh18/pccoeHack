const mongoose = require('mongoose');

const evidenceSourcePolicySchema = new mongoose.Schema({
  sourceType: { type: String, required: true, unique: true },
  reliability: { type: Number, required: true, min: 0, max: 1 },
  defaultRelevance: { type: Number, required: true, min: 0, max: 1 },
  isActive: { type: Boolean, default: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('EvidenceSourcePolicy', evidenceSourcePolicySchema);
