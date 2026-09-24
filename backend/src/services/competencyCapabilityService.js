/**
 * Phase 5D: Competency Capability Rollup
 * Rolls up employee-level skill capabilities into a competency capability score
 * weighted by the confidence of each skill estimate.
 */

const Skill = require('../models/Skill');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const EmployeeCompetencyCapability = require('../models/EmployeeCompetencyCapability');

function clamp(value) {
  if (value == null) return null;
  return Math.max(0, Math.min(1, value));
}

function mapScoreToProficiency(score) {
  if (score == null) return null;
  if (score < 0.20) return 1;
  if (score < 0.40) return 2;
  if (score < 0.60) return 3;
  if (score < 0.80) return 4;
  return 5;
}

exports.calculateEmployeeCompetencyCapability = async (employeeId, competencyId) => {
  // 1. Find all skills belonging to this competency
  const skills = await Skill.find({ competency: competencyId, isActive: true }).select('_id');
  const skillIds = skills.map(s => s._id);
  const skillCount = skillIds.length;

  // 2. Find the employee's capability states for those skills
  const skillCapabilities = await EmployeeSkillCapability.find({
    employee: employeeId,
    skill: { $in: skillIds }
  });

  let sumWeightedContribution = 0;
  let sumSkillConfidence = 0;
  let effectiveSkillCount = 0;

  for (const skillCap of skillCapabilities) {
    // 3. Filter to usable capability + confidence
    if (skillCap.capabilityScore == null || skillCap.confidenceScore == null || skillCap.confidenceScore <= 0) {
      continue;
    }

    const weight = skillCap.confidenceScore;
    const contribution = skillCap.capabilityScore * weight;

    sumWeightedContribution += contribution;
    sumSkillConfidence += weight;
    effectiveSkillCount++;
  }

  let capabilityScore = null;
  let proficiencyLevel = null;
  let confidenceScore = null;
  let evidenceSufficiency = 'INSUFFICIENT';

  if (effectiveSkillCount > 0 && sumSkillConfidence > 0) {
    // 4. Calculate weighted competency capability
    capabilityScore = clamp(sumWeightedContribution / sumSkillConfidence);
    
    // 5. Calculate competency confidence (Average of contributing skills' confidence)
    confidenceScore = clamp(sumSkillConfidence / effectiveSkillCount);
    
    // 6. Calculate proficiency level
    proficiencyLevel = mapScoreToProficiency(capabilityScore);

    // 8. Calculate evidence sufficiency
    if (effectiveSkillCount === 1) evidenceSufficiency = 'LIMITED';
    else if (effectiveSkillCount >= 2 && effectiveSkillCount <= 3) evidenceSufficiency = 'MODERATE';
    else if (effectiveSkillCount >= 4) evidenceSufficiency = 'STRONG';
  }

  // 9. Upsert EmployeeCompetencyCapability
  const competencyCapability = await EmployeeCompetencyCapability.findOneAndUpdate(
    { employee: employeeId, competency: competencyId },
    {
      $set: {
        capabilityScore,
        proficiencyLevel,
        confidenceScore,
        evidenceSufficiency,
        skillCount,
        effectiveSkillCount,
        calculatedAt: new Date()
      }
    },
    { returnDocument: 'after', upsert: true }
  );

  return competencyCapability;
};
