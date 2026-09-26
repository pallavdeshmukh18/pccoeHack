const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const Employee = require('../models/Employee');
const SkillRisk = require('../models/SkillRisk');
const Team = require('../models/Team');

exports.evaluateSkillRisk = async (skillId, scopeType = 'ORGANIZATION', scopeId = null) => {
  let employeeIds = [];

  if (scopeType === 'ORGANIZATION') {
    const emps = await Employee.find({}, '_id');
    employeeIds = emps.map(e => e._id);
  } else if (scopeType === 'DEPARTMENT') {
    if (!scopeId) throw new Error("Department scopeId required");
    const emps = await Employee.find({ department: scopeId }, '_id');
    employeeIds = emps.map(e => e._id);
  } else if (scopeType === 'TEAM') {
    if (!scopeId) throw new Error("Team scopeId required");
    const emps = await Employee.find({ team: scopeId }, '_id'); // or however team membership is mapped
    employeeIds = emps.map(e => e._id);
  }

  const totalEmployees = employeeIds.length;
  if (totalEmployees === 0) {
      const risk = new SkillRisk({
          skill: skillId, scopeType, scopeId, riskLevel: 'UNKNOWN',
          capableEmployeeCount: 0, criticalEmployeeCount: 0,
          averageCapability: 0, averageConfidence: 0, evidenceCoverage: 0, concentrationScore: 0
      });
      return await risk.save();
  }

  // Get capabilities ONLY for those employees
  const capabilities = await EmployeeSkillCapability.find({
    skill: skillId,
    employee: { $in: employeeIds }
  });

  const validCaps = capabilities.filter(c => c.capabilityScore !== null);
  const capableCount = validCaps.filter(c => c.proficiencyLevel >= 3).length; // assuming level 3 is "capable"
  const criticalCount = validCaps.filter(c => c.proficiencyLevel >= 4).length; // assuming level 4 is "critical/advanced"
  
  const avgCap = validCaps.length > 0 ? validCaps.reduce((s, c) => s + c.capabilityScore, 0) / validCaps.length : null;
  const avgConf = validCaps.length > 0 ? validCaps.reduce((s, c) => s + c.confidenceScore, 0) / validCaps.length : null;

  const coverage = validCaps.length / totalEmployees;
  
  // Concentration score: if only a few people hold the high capability.
  let concentrationScore = 0;
  if (capableCount > 0) {
      concentrationScore = 1 - (capableCount / totalEmployees); // High if few people are capable
  } else if (validCaps.length === 0) {
      concentrationScore = 1;
  }

  let riskLevel = 'LOW';
  if (concentrationScore > 0.8 || capableCount === 0) riskLevel = 'CRITICAL';
  else if (concentrationScore > 0.5) riskLevel = 'HIGH';
  else if (concentrationScore > 0.3) riskLevel = 'MEDIUM';

  const risk = new SkillRisk({
    skill: skillId,
    scopeType,
    scopeId,
    riskLevel,
    concentrationScore,
    capableEmployeeCount: capableCount,
    criticalEmployeeCount: criticalCount,
    averageCapability: avgCap,
    averageConfidence: avgConf,
    evidenceCoverage: coverage,
    calculatedAt: new Date()
  });

  await risk.save();
  return risk;
};
