const Team = require('../models/Team');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');

exports.getTeamCapabilities = async (teamId) => {
  const team = await Team.findById(teamId).populate('members');
  if (!team) throw new Error("Team not found");

  const memberIds = team.members.map(m => m._id);
  const capabilities = await EmployeeSkillCapability.find({ employee: { $in: memberIds } }).populate('skill');

  const skillAgg = {};
  capabilities.forEach(cap => {
    const sId = cap.skill._id.toString();
    if (!skillAgg[sId]) {
      skillAgg[sId] = { skill: cap.skill, sum: 0, count: 0, improving: 0, declining: 0, stable: 0, insufficient: 0 };
    }
    if (cap.capabilityScore !== null) {
      skillAgg[sId].sum += cap.capabilityScore;
      skillAgg[sId].count++;
    } else {
      skillAgg[sId].insufficient++;
    }

    if (cap.trajectoryDirection === 'IMPROVING') skillAgg[sId].improving++;
    if (cap.trajectoryDirection === 'DECLINING') skillAgg[sId].declining++;
    if (cap.trajectoryDirection === 'STABLE') skillAgg[sId].stable++;
  });

  return Object.values(skillAgg).map(s => ({
    skill: s.skill,
    averageCapability: s.count > 0 ? s.sum / s.count : null,
    capableCount: s.count,
    improvingCount: s.improving,
    decliningCount: s.declining,
    stableCount: s.stable,
    insufficientCount: s.insufficient
  }));
};
