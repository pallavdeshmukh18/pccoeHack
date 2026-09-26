const mongoose = require('mongoose');

const evidenceConflictSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  competency: { type: mongoose.Schema.Types.ObjectId, ref: 'Competency' },
  conflictStatus: { type: String, enum: ['CONSISTENT', 'MIXED', 'CONFLICTING', 'INSUFFICIENT_EVIDENCE'], default: 'INSUFFICIENT_EVIDENCE' },
  conflictScore: { type: Number, default: 0 },
  evidenceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }],
  positiveEvidenceCount: { type: Number, default: 0 },
  negativeEvidenceCount: { type: Number, default: 0 },
  signalSpread: { type: Number, default: 0 },
  calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

evidenceConflictSchema.index({ employee: 1, skill: 1 });

module.exports = mongoose.model('EvidenceConflict', evidenceConflictSchema);
