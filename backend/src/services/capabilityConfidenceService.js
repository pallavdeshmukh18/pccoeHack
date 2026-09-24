/**
 * Phase 5B: Capability Confidence & Evidence Sufficiency
 */

const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const Evidence = require('../models/Evidence');

function clamp(value) {
  if (value == null) return null;
  return Math.max(0, Math.min(1, value));
}

function getSourceFamily(sourceType) {
  const mapping = {
    'INTERNAL_ASSESSMENT': 'ASSESSMENT',
    'GENERATED_SKILL_ASSESSMENT': 'ASSESSMENT',
    'GENERATED_AI_QUIZ': 'ASSESSMENT',
    'GENERATED_SIMULATION': 'ASSESSMENT',
    'TRAINING': 'LEARNING',
    'CERTIFICATION': 'LEARNING',
    'EXTERNAL_COURSERA': 'LEARNING',
    'EXTERNAL_GITHUB': 'EXTERNAL_ACTIVITY',
    'EXTERNAL_LEETCODE': 'EXTERNAL_ACTIVITY',
    'EXTERNAL_HACKERRANK': 'EXTERNAL_ACTIVITY',
    'PROJECT': 'PROJECT',
    'MANAGER_FEEDBACK': 'FEEDBACK',
    'PEER_FEEDBACK': 'FEEDBACK',
    'KPI': 'PERFORMANCE',
    'EXTERNAL_LINKEDIN': 'SELF_REPORTED'
  };
  return mapping[sourceType] || 'OTHER';
}

exports.calculateConfidence = async (employeeId, skillId, capabilityScore, effectiveEvidenceCount) => {
  // If there is no eligible evidence, confidence falls back completely
  if (effectiveEvidenceCount === 0 || capabilityScore == null) {
    return {
      evidenceSufficiency: 'INSUFFICIENT',
      confidenceScore: null,
      quantityScore: null,
      qualityScore: null,
      diversityScore: null,
      consistencyScore: null
    };
  }

  // Determine Sufficiency tier
  let evidenceSufficiency = 'INSUFFICIENT';
  if (effectiveEvidenceCount === 1) evidenceSufficiency = 'LIMITED';
  else if (effectiveEvidenceCount >= 2 && effectiveEvidenceCount <= 3) evidenceSufficiency = 'MODERATE';
  else if (effectiveEvidenceCount >= 4) evidenceSufficiency = 'STRONG';

  // Fetch only the evidence that WOULD have contributed to Phase 5A
  // Must be active, must have norm/qual, must NOT be negative.
  const contributingEvidence = await Evidence.find({
    employee: employeeId,
    skill: skillId,
    status: 'ACTIVE',
    direction: { $ne: 'NEGATIVE' },
    normalizedValue: { $ne: null },
    quality: { $ne: null }
  });

  const n = contributingEvidence.length;
  if (n === 0) {
    // Should theoretically not happen if effectiveEvidenceCount > 0, but safe guard:
    return {
      evidenceSufficiency: 'INSUFFICIENT',
      confidenceScore: null,
      quantityScore: null,
      qualityScore: null,
      diversityScore: null,
      consistencyScore: null
    };
  }

  // 1. Quantity Score: n / (n + 3)
  const quantityScore = clamp(n / (n + 3));

  // Variables for Quality and Consistency
  let sumQualitySquared = 0;
  let sumQuality = 0;
  let sumWeightedVariance = 0;
  const families = new Set();

  for (const ev of contributingEvidence) {
    sumQuality += ev.quality;
    sumQualitySquared += (ev.quality * ev.quality);
    
    const diff = ev.normalizedValue - capabilityScore;
    sumWeightedVariance += (ev.quality * diff * diff);

    families.add(getSourceFamily(ev.sourceType));
  }

  // 2. Quality Score: SUM(q^2) / SUM(q)
  const qualityScore = sumQuality > 0 ? clamp(sumQualitySquared / sumQuality) : 0;

  // 3. Diversity Score
  const uniqueFamilies = families.size;
  let diversityScore = 0;
  if (uniqueFamilies === 1) diversityScore = 0.33;
  else if (uniqueFamilies === 2) diversityScore = 0.67;
  else if (uniqueFamilies >= 3) diversityScore = 1.00;

  // 4. Consistency Score
  // variance = SUM(quality × (normalizedValue - capabilityScore)^2) / SUM(quality)
  const variance = sumQuality > 0 ? (sumWeightedVariance / sumQuality) : 0;
  const consistencyScore = clamp(1 / (1 + variance * 10));

  // 5. Final Confidence Score
  const confidenceScore = clamp(
    (0.30 * quantityScore) +
    (0.25 * qualityScore) +
    (0.20 * diversityScore) +
    (0.25 * consistencyScore)
  );

  return {
    evidenceSufficiency,
    confidenceScore,
    quantityScore,
    qualityScore,
    diversityScore,
    consistencyScore
  };
};

exports.updateCapabilityConfidence = async (employeeId, skillId, capabilityScore, effectiveEvidenceCount) => {
  const confidenceFields = await exports.calculateConfidence(employeeId, skillId, capabilityScore, effectiveEvidenceCount);
  
  return await EmployeeSkillCapability.findOneAndUpdate(
    { employee: employeeId, skill: skillId },
    { $set: confidenceFields },
    { returnDocument: 'after' }
  );
};
