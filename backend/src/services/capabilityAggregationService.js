const Evidence = require('../models/Evidence');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const capabilityConfidenceService = require('../services/capabilityConfidenceService');
const capabilityTrajectoryService = require('../services/capabilityTrajectoryService');

/**
 * Phase 5A: Skill Capability Aggregation
 * Calculates the current evidence-based capability estimate for an employee + skill.
 * 
 * Note: capabilityScore is NOT definitive absolute truth; it represents exactly what 
 * the currently eligible, quantitative evidence indicates.
 */

function mapScoreToProficiency(score) {
  if (score == null) return null;
  
  // Deterministic 5-band mapping as requested
  if (score < 0.20) return 1;
  if (score < 0.40) return 2;
  if (score < 0.60) return 3;
  if (score < 0.80) return 4;
  return 5;
}

exports.calculateEmployeeSkillCapability = async (employeeId, skillId) => {
  // 1. Fetch all ACTIVE evidence mapped DIRECTLY to this skill
  const evidenceList = await Evidence.find({
    employee: employeeId,
    skill: skillId,
    status: 'ACTIVE'
  }).sort({ occurredAt: -1 });

  const totalEvidenceCount = evidenceList.length;

  let sumWeightedContribution = 0;
  let sumWeight = 0;
  let effectiveEvidenceCount = 0;
  let excludedEvidenceCount = 0;
  let lastEligibleEvidenceAt = null;

  // Track the most recent occurredAt across ANY active evidence just in case no eligible evidence exists
  const fallbackLastEvidenceAt = totalEvidenceCount > 0 ? evidenceList[0].occurredAt : null;

  for (const ev of evidenceList) {
    // 2. Filter eligible evidence: Must have quantitative signal and quality
    if (ev.normalizedValue == null || ev.quality == null) {
      excludedEvidenceCount++;
      continue;
    }

    // 3. NEGATIVE Evidence Handling
    // POSITIVE and NEUTRAL evidence contribute to the capability estimate.
    // NEGATIVE direction evidence is explicitly EXCLUDED from Phase 5A aggregation.
    // Deferring negative conflict resolution/polarity models to a later capability design.
    if (ev.direction === 'NEGATIVE') {
      excludedEvidenceCount++;
      continue;
    }

    // Capture the latest occurredAt among ELIGIBLE evidence
    if (!lastEligibleEvidenceAt || (ev.occurredAt && ev.occurredAt > lastEligibleEvidenceAt)) {
      lastEligibleEvidenceAt = ev.occurredAt;
    }

    const weight = ev.quality;
    const weightedContribution = ev.normalizedValue * weight;

    sumWeightedContribution += weightedContribution;
    sumWeight += weight;
    effectiveEvidenceCount++;
  }

  let capabilityScore = null;
  let proficiencyLevel = null;

  // 4. Calculate weighted mean if we have eligible evidence
  if (effectiveEvidenceCount > 0 && sumWeight > 0) {
    capabilityScore = sumWeightedContribution / sumWeight;
    // Clamp to 0-1 (though mathematically it shouldn't exceed 1 if inputs are 0-1)
    capabilityScore = Math.max(0, Math.min(1, capabilityScore));
    
    // 5. Map to proficiency
    proficiencyLevel = mapScoreToProficiency(capabilityScore);
  }

  // 6. Upsert the EmployeeSkillCapability document
  const capabilityRecord = await EmployeeSkillCapability.findOneAndUpdate(
    { employee: employeeId, skill: skillId },
    {
      capabilityScore,
      proficiencyLevel,
      evidenceCount: totalEvidenceCount,
      effectiveEvidenceCount,
      excludedEvidenceCount,
      lastEvidenceAt: lastEligibleEvidenceAt || fallbackLastEvidenceAt,
      calculatedAt: new Date()
    },
    { returnDocument: 'after', upsert: true }
  );

  // Phase 5B: Calculate and persist Confidence & Sufficiency immediately after Phase 5A Upsert
  await capabilityConfidenceService.updateCapabilityConfidence(
    employeeId,
    skillId,
    capabilityScore,
    effectiveEvidenceCount
  );

  // Phase 5C: Calculate and persist Trajectory & Velocity
  const finalCapabilityRecord = await capabilityTrajectoryService.updateCapabilityTrajectory(
    employeeId,
    skillId
  );

  return finalCapabilityRecord;
};
