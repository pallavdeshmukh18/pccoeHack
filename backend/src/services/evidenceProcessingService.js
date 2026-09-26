const evidenceNormalizationService = require('./evidenceNormalizationService');
const evidenceQualityService = require('./evidenceQualityService');
const Evidence = require('../models/Evidence');
const evidencePolicyService = require('./evidencePolicyService');

exports.processEvidence = async (evidenceData) => {
  const policy = await evidencePolicyService.getPolicy(evidenceData.sourceType);
  
  // Extract override values if they were provided in metadata, otherwise use policy or fallback
  let overrideReliability = evidenceData.metadata?.reliability;
  if (overrideReliability === undefined && policy) {
    overrideReliability = policy.reliability;
  }
  
  // validation
  if (!evidenceData.sourceType) throw new Error("sourceType is required");
  if (!evidenceData.evidenceKind) throw new Error("evidenceKind is required");
  
  const normResult = evidenceNormalizationService.enrichEvidenceNormalization(evidenceData);
  
  const qualityPayload = {
    ...evidenceData,
    occurredAt: evidenceData.occurredAt || new Date(),
    reliability: overrideReliability,
    // if relevance is omitted, qualityService calculates it based on skill/competency presence
  };

  const qualResult = evidenceQualityService.enrichEvidenceQuality(qualityPayload);
  
  const finalData = {
    ...evidenceData,
    normalizedValue: normResult.normalizedValue,
    quality: qualResult.quality,
    metadata: {
      ...evidenceData.metadata,
      normalizationMethod: normResult.normalizationMethod,
      reliability: qualResult.reliability,
      relevance: qualResult.relevance,
      freshness: qualResult.freshness
    }
  };

  const evidence = new Evidence(finalData);
  await evidence.save();
  return evidence;
};
