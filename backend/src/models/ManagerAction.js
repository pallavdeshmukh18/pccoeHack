const mongoose = require('mongoose');

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
