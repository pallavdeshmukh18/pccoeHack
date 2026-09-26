const EmployeeSkillCapabilitySnapshot = require('../models/EmployeeSkillCapabilitySnapshot');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');

exports.createSnapshot = async (employeeId, skillId, snapshotReason = 'RECALCULATION') => {
  const current = await EmployeeSkillCapability.findOne({ employee: employeeId, skill: skillId });
  if (!current) return null;

  const snapshot = new EmployeeSkillCapabilitySnapshot({
    employee: current.employee,
    skill: current.skill,
    capabilityScore: current.capabilityScore,
    proficiencyLevel: current.proficiencyLevel,
    confidenceScore: current.confidenceScore,
    evidenceSufficiency: current.evidenceSufficiency,
    trajectoryDirection: current.trajectoryDirection,
    trajectoryVelocity: current.trajectoryVelocity,
    evidenceCount: current.evidenceCount,
    effectiveEvidenceCount: current.effectiveEvidenceCount,
    excludedEvidenceCount: current.excludedEvidenceCount,
    snapshotReason,
    calculatedAt: new Date()
  });

  await snapshot.save();
  return snapshot;
};

exports.getHistory = async (employeeId, skillId) => {
  return await EmployeeSkillCapabilitySnapshot.find({ employee: employeeId, skill: skillId }).sort({ calculatedAt: 1 });
};

exports.getLatestSnapshot = async (employeeId, skillId) => {
  return await EmployeeSkillCapabilitySnapshot.findOne({ employee: employeeId, skill: skillId }).sort({ calculatedAt: -1 });
};
