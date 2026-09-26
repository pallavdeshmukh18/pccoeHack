const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../src/models');

const models = {
  'EvidenceConflict.js': `const mongoose = require('mongoose');

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
`,

  'EvidenceSourcePolicy.js': `const mongoose = require('mongoose');

const evidenceSourcePolicySchema = new mongoose.Schema({
  sourceType: { type: String, required: true, unique: true },
  reliability: { type: Number, required: true, min: 0, max: 1 },
  defaultRelevance: { type: Number, required: true, min: 0, max: 1 },
  isActive: { type: Boolean, default: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('EvidenceSourcePolicy', evidenceSourcePolicySchema);
`,

  'EmployeeSkillCapabilitySnapshot.js': `const mongoose = require('mongoose');

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
  snapshotReason: { type: String, enum: ['RECALCULATION', 'ASSESSMENT', 'INTERVENTION_COMPLETION', 'SCHEDULED', 'MANUAL'], default: 'SCHEDULED' },
  calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

employeeSkillCapabilitySnapshotSchema.index({ employee: 1, skill: 1, calculatedAt: -1 });

module.exports = mongoose.model('EmployeeSkillCapabilitySnapshot', employeeSkillCapabilitySnapshotSchema);
`,

  'Team.js': `const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  description: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
`,

  'SkillRisk.js': `const mongoose = require('mongoose');

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
`,

  'ManagerAction.js': `const mongoose = require('mongoose');

const managerActionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  title: { type: String, required: true },
  description: { type: String },
  referenceType: { type: String, enum: ['EMPLOYEE', 'TEAM', 'SKILL', 'ROLE'] },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  supportingEvidence: { type: mongoose.Schema.Types.Mixed },
  recommendedNextStep: { type: String },
  status: { type: String, enum: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'], default: 'OPEN' }
}, { timestamps: true });

module.exports = mongoose.model('ManagerAction', managerActionSchema);
`
};

for (const [filename, content] of Object.entries(models)) {
  fs.writeFileSync(path.join(modelsDir, filename), content);
  console.log('Created', filename);
}
