const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const JobRole = require('../models/JobRole');
const roleGapService = require('./roleGapService');
const groqService = require('./groqService');

exports.simulateCareerPath = async (employeeId, targetJobRoleId) => {
  const role = await JobRole.findById(targetJobRoleId);
  if (!role) throw new Error("Job role not found");

  // We actually reuse roleGap calculation to ensure exactly the same semantics.
  // roleGapService compares an employee to a given role and returns gaps and readinessState.
  const roleGap = await roleGapService.calculateEmployeeRoleGap(employeeId, targetJobRoleId);
  
  // Deterministic simulation generated. Optionally append AI dev sequence.
  const prompt = `Create a short development sequence for an employee moving to ${role.title} with gaps: ${JSON.stringify(roleGap.gaps.map(g => g.skill))}. Output JSON { "developmentSequence": ["step1", "step2"] }`;
  let aiRes = { developmentSequence: [] };
  try {
     const str = await groqService.generateStructuredResponse(prompt, ['developmentSequence']);
     aiRes = JSON.parse(str);
  } catch(e) {}

  return {
    employeeId,
    targetRole: role,
    overallReadiness: roleGap.overallMatchScore,
    currentState: roleGap.readinessState,
    gaps: roleGap.gaps,
    developmentSequence: aiRes.developmentSequence
  };
};
