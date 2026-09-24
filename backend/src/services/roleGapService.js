/**
 * Phase 5E: Role Gap & Readiness Analysis
 * Compares employee's current skill capabilities against JobRole requirements.
 */

const JobRole = require('../models/JobRole');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const EmployeeRoleGap = require('../models/EmployeeRoleGap');

exports.calculateEmployeeRoleGap = async (employeeId, jobRoleId) => {
  // 1. Load the JobRole
  const role = await JobRole.findById(jobRoleId);
  if (!role) {
    throw new Error('JobRole not found');
  }

  // 2. Read its skillRequirements
  const requiredSkills = role.skillRequirements || [];
  
  const skillIds = requiredSkills.map(req => req.skill);

  // 3. Find the employee's EmployeeSkillCapability states
  const employeeCapabilities = await EmployeeSkillCapability.find({
    employee: employeeId,
    skill: { $in: skillIds }
  });

  // Map for quick lookup
  const capMap = {};
  for (const cap of employeeCapabilities) {
    capMap[cap.skill.toString()] = cap;
  }

  const skillsAnalysis = [];
  
  let meetsCount = 0;
  let nearGapCount = 0;
  let gapCount = 0;
  let insufficientEvidenceCount = 0;

  // 4. Match each required skill
  for (const req of requiredSkills) {
    const cap = capMap[req.skill.toString()];
    
    const analysis = {
      skill: req.skill,
      requiredLevel: req.requiredLevel,
      importance: req.importance,
      
      currentCapabilityScore: cap ? cap.capabilityScore : null,
      currentProficiencyLevel: cap ? cap.proficiencyLevel : null,
      currentConfidenceScore: cap ? cap.confidenceScore : null,
      currentTrajectoryDirection: cap ? cap.trajectoryDirection : null,
      currentTrajectoryVelocity: cap ? cap.trajectoryVelocity : null,
      
      gap: null,
      status: 'INSUFFICIENT_EVIDENCE'
    };

    // 5. Calculate gap/status
    if (analysis.currentProficiencyLevel == null) {
      analysis.status = 'INSUFFICIENT_EVIDENCE';
      analysis.gap = null;
      insufficientEvidenceCount++;
    } else {
      const gap = analysis.requiredLevel - analysis.currentProficiencyLevel;
      analysis.gap = gap;
      
      if (gap <= 0) {
        analysis.status = 'MEETS';
        meetsCount++;
      } else if (gap === 1) {
        analysis.status = 'NEAR_GAP';
        nearGapCount++;
      } else {
        analysis.status = 'GAP';
        gapCount++;
      }
    }

    skillsAnalysis.push(analysis);
  }

  // 7. Calculate role status
  let roleStatus = 'MEETS_REQUIREMENTS';
  
  if (gapCount > 0 || nearGapCount > 0) {
    roleStatus = 'HAS_GAPS'; // Gaps take precedence
  } else if (insufficientEvidenceCount > 0) {
    roleStatus = 'INSUFFICIENT_EVIDENCE';
  }

  // 9. Upsert EmployeeRoleGap
  const roleGapRecord = await EmployeeRoleGap.findOneAndUpdate(
    { employee: employeeId, jobRole: jobRoleId },
    {
      $set: {
        skills: skillsAnalysis,
        roleStatus,
        totalRequiredSkills: requiredSkills.length,
        meetsCount,
        nearGapCount,
        gapCount,
        insufficientEvidenceCount,
        calculatedAt: new Date()
      }
    },
    { returnDocument: 'after', upsert: true }
  );

  return roleGapRecord;
};
