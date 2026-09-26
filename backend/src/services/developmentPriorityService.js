/**
 * Phase 6A: Gap Prioritization & Development Planning
 * Deterministically ranks Phase 5E gaps into actionable development priorities.
 */

const EmployeeRoleGap = require('../models/EmployeeRoleGap');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const EmployeeDevelopmentPriority = require('../models/EmployeeDevelopmentPriority');
const Skill = require('../models/Skill');

function clamp(value) {
  if (value == null) return 0;
  return Math.max(0, Math.min(1, value));
}

function mapImportance(imp) {
  const map = { LOW: 0.25, MEDIUM: 0.50, HIGH: 0.75, CRITICAL: 1.00 };
  return map[imp] || 0;
}

function mapTrajectory(traj) {
  const map = { DECLINING: 1.00, STABLE: 0.75, INSUFFICIENT_DATA: 0.75, IMPROVING: 0.50 };
  return map[traj] || 0.75;
}

function mapEvidenceSufficiency(suff) {
  const map = { INSUFFICIENT: 0.00, LIMITED: 0.33, MODERATE: 0.67, STRONG: 1.00 };
  return map[suff] || 0;
}

function mapPriorityLevel(score) {
  if (score < 0.25) return 'LOW';
  if (score < 0.50) return 'MEDIUM';
  if (score < 0.75) return 'HIGH';
  return 'CRITICAL';
}

function generateReason(skillName, gap, requiredLevel, currentProficiencyLevel, importance, confidenceScore, trajectory) {
  let reason = `Current capability is ${gap} level(s) below the required level of ${requiredLevel}. `;
  
  if (importance === 'CRITICAL' || importance === 'HIGH') {
    reason += `This is a ${importance.toLowerCase()}-priority role requirement. `;
  }
  
  if (confidenceScore >= 0.75) {
    reason += `We have high confidence in this capability gap. `;
  }
  
  if (trajectory === 'DECLINING') {
    reason += `The skill is currently declining, making intervention urgent.`;
  } else if (trajectory === 'IMPROVING') {
    reason += `The employee is improving, but the gap remains significant.`;
  }

  return reason.trim();
}

exports.calculateEmployeeDevelopmentPriority = async (employeeId, jobRoleId) => {
  // 1. Load EmployeeRoleGap
  const roleGap = await EmployeeRoleGap.findOne({ employee: employeeId, jobRole: jobRoleId }).lean();
  if (!roleGap) {
    throw new Error('EmployeeRoleGap not found for this employee and role. Run Phase 5E first.');
  }

  // 2. Load relevant EmployeeSkillCapability records for context (sufficiency)
  const skillIds = roleGap.skills.map(s => s.skill);
  const capabilities = await EmployeeSkillCapability.find({
    employee: employeeId,
    skill: { $in: skillIds }
  }).lean();
  
  // Also load skills to sort by name and generate reasons
  const skills = await Skill.find({ _id: { $in: skillIds } }).select('name').lean();
  
  const capMap = {};
  for (const cap of capabilities) capMap[cap.skill.toString()] = cap;

  const skillNameMap = {};
  for (const s of skills) skillNameMap[s._id.toString()] = s.name;

  const priorities = [];
  let confirmedDevelopmentNeeds = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let insufficientEvidenceCount = 0;
  let meetsCount = 0;

  // Process gaps
  for (const sg of roleGap.skills) {
    // 3. Ignore MEETS and INSUFFICIENT_EVIDENCE
    if (sg.status === 'MEETS') {
      meetsCount++;
      continue;
    }
    
    if (sg.status === 'INSUFFICIENT_EVIDENCE') {
      insufficientEvidenceCount++;
      continue;
    }

    // 5. Process GAP and NEAR_GAP
    confirmedDevelopmentNeeds++;

    const capContext = capMap[sg.skill.toString()];
    const evidenceSufficiency = capContext ? capContext.evidenceSufficiency : 'INSUFFICIENT';
    const skillName = skillNameMap[sg.skill.toString()] || 'Unknown Skill';

    // 6. Calculate all five priority factors
    const gapSeverity = clamp(sg.gap / 4);
    const importanceFactor = mapImportance(sg.importance);
    const confidenceFactor = clamp(sg.currentConfidenceScore);
    const trajectoryFactor = mapTrajectory(sg.currentTrajectoryDirection);
    const evidenceSufficiencyFactor = mapEvidenceSufficiency(evidenceSufficiency);

    // 7. Calculate priorityScore
    const priorityScore = clamp(
      (0.30 * gapSeverity) +
      (0.25 * importanceFactor) +
      (0.20 * confidenceFactor) +
      (0.15 * trajectoryFactor) +
      (0.10 * evidenceSufficiencyFactor)
    );

    // 8. Determine priorityLevel
    const priorityLevel = mapPriorityLevel(priorityScore);

    if (priorityLevel === 'CRITICAL') criticalCount++;
    else if (priorityLevel === 'HIGH') highCount++;
    else if (priorityLevel === 'MEDIUM') mediumCount++;
    else if (priorityLevel === 'LOW') lowCount++;

    // 9. Generate deterministic priorityReason
    const priorityReason = generateReason(
      skillName,
      sg.gap,
      sg.requiredLevel,
      sg.currentProficiencyLevel,
      sg.importance,
      sg.currentConfidenceScore,
      sg.currentTrajectoryDirection
    );

    priorities.push({
      skill: sg.skill,
      skillName, // For sorting only
      requiredLevel: sg.requiredLevel,
      importance: sg.importance,
      currentCapabilityScore: sg.currentCapabilityScore,
      currentProficiencyLevel: sg.currentProficiencyLevel,
      currentConfidenceScore: sg.currentConfidenceScore,
      trajectoryDirection: sg.currentTrajectoryDirection,
      trajectoryVelocity: sg.currentTrajectoryVelocity,
      gap: sg.gap,
      status: sg.status,
      priorityScore,
      priorityLevel,
      priorityFactors: {
        gapSeverity,
        importance: importanceFactor,
        confidence: confidenceFactor,
        trajectory: trajectoryFactor,
        evidenceSufficiency: evidenceSufficiencyFactor
      },
      priorityReason
    });
  }

  // 10. Sort priorities deterministically
  priorities.sort((a, b) => {
    // 1. priorityScore descending
    if (Math.abs(a.priorityScore - b.priorityScore) > 0.0001) {
      return b.priorityScore - a.priorityScore;
    }
    // 2. importance descending
    const impValues = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    if (impValues[a.importance] !== impValues[b.importance]) {
      return impValues[b.importance] - impValues[a.importance];
    }
    // 3. gap descending
    if (a.gap !== b.gap) {
      return b.gap - a.gap;
    }
    // 4. skill name ascending
    return a.skillName.localeCompare(b.skillName);
  });

  // Clean up sort-only fields
  for (const p of priorities) {
    delete p.skillName;
  }

  // 12. Upsert EmployeeDevelopmentPriority
  const devPriorityRecord = await EmployeeDevelopmentPriority.findOneAndUpdate(
    { employee: employeeId, jobRole: jobRoleId },
    {
      $set: {
        priorities,
        totalRequiredSkills: roleGap.totalRequiredSkills,
        confirmedDevelopmentNeeds,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        insufficientEvidenceCount,
        meetsCount,
        calculatedAt: new Date()
      }
    },
    { returnDocument: 'after', upsert: true }
  );

  return devPriorityRecord;
};
