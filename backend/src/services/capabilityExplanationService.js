const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');
const Evidence = require('../models/Evidence');

exports.explainCapability = async (employeeId, skillId) => {
  const cap = await EmployeeSkillCapability.findOne({ employee: employeeId, skill: skillId }).populate('skill');
  const ev = await Evidence.find({ employee: employeeId, skill: skillId, status: 'ACTIVE' }).sort({ quality: -1 });

  if (!cap) return { employee: employeeId, skill: skillId, explanation: "No capability record found." };

  const isForming = cap.capabilityScore === null;
  let conclusion = isForming ? `${cap.skill.name} is currently a developing profile with insufficient quantitative evidence.` : `${cap.skill.name} is currently at Level ${cap.proficiencyLevel} (score: ${(cap.capabilityScore*100).toFixed(0)}%).`;

  const sources = new Set(ev.map(e => e.sourceType));
  const diversity = sources.size;

  let explanation = conclusion;
  if (!isForming) {
    explanation += ` This capability estimate uses ${cap.effectiveEvidenceCount} effective quantitative observations from ${diversity} source families.`;
    if (cap.excludedEvidenceCount > 0) {
      explanation += ` ${cap.excludedEvidenceCount} additional evidence records were excluded because they were non-quantitative or negative.`;
    }
    explanation += ` The system has ${cap.evidenceSufficiency.toLowerCase()} confidence in this assessment.`;
    if (cap.trajectoryDirection !== 'INSUFFICIENT_DATA') {
      explanation += ` The capability trajectory is ${cap.trajectoryDirection.toLowerCase()}.`;
    }
  } else {
    explanation = "TalentTwin does not have enough quantitative evidence to establish a reliable capability estimate.";
  }

  return {
    employee: employeeId,
    skill: skillId,
    conclusion,
    capabilityScore: cap.capabilityScore,
    proficiencyLevel: cap.proficiencyLevel,
    confidenceScore: cap.confidenceScore,
    trajectoryDirection: cap.trajectoryDirection,
    trajectoryVelocity: cap.trajectoryVelocity,
    evidenceSummary: ev.map(e => ({ id: e._id, title: e.title, quality: e.quality, value: e.normalizedValue, direction: e.direction })),
    strongestSupportingEvidence: ev.filter(e => e.direction === 'POSITIVE').slice(0,3),
    conflictingEvidence: ev.filter(e => e.direction === 'NEGATIVE'),
    contributingFactors: [],
    explanation
  };
};
