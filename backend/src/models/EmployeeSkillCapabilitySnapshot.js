const mongoose = require('mongoose');

const employeeSkillCapabilitySnapshotSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  capabilityScore: { type: Number, min: 0, max: 1, default: null },
  proficiencyLevel: { type: Number, min: 1, max: 5, default: null },
  confidenceScore: { type: Number, min: 0, max: 1, default: 0 },
  evidenceSufficiency: { type: String, enum: ['INSUFFICIENT', 'LIMITED', 'MODERATE', 'STRONG'], default: 'INSUFFICIENT' },
  trajectoryDirection: { type: String, enum: ['IMPROVING', 'DECLINING', 'STABLE', 'INSUFFICIENT_DATA'], default: 'INSUFFICIENT_DATA' },
  trajectoryVelocity: { type: Number, default: 0 },
  evidenceCount: { type: Number, default: 0 },
  effectiveEvidenceCount: { type: Number, default: 0 },
  excludedEvidenceCount: { type: Number, default: 0 },
  snapshotReason: { type: String, enum: ['RECALCULATION', 'ASSESSMENT', 'INTERVENTION_COMPLETION', 'SCHEDULED', 'MANUAL'], default: 'SCHEDULED' },
  calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

employeeSkillCapabilitySnapshotSchema.index({ employee: 1, skill: 1, calculatedAt: -1 });

module.exports = mongoose.model('EmployeeSkillCapabilitySnapshot', employeeSkillCapabilitySnapshotSchema);
