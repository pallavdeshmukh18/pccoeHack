const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/services/evidenceProcessingService.js');
let code = fs.readFileSync(filePath, 'utf8');

// The file currently has:
// const norm = evidenceNormalizationService.normalizeEvidence(evidenceData);
// evidenceData.normalizedValue = norm.normalizedValue;
// That SHOULD work. But wait! The error said: `value "{ normalizedValue: null, normalizationMethod: ... }"`
// Ah, the first replacement in `fixProcessing.js` might have created:
// `evidenceData.normalizedValue = evidenceNormalizationService.normalizeEvidence(evidenceData);`
// Let's rewrite it entirely to be sure.

const correctCode = `const evidenceNormalizationService = require('./evidenceNormalizationService');
const evidenceQualityService = require('./evidenceQualityService');
const Evidence = require('../models/Evidence');
const evidencePolicyService = require('./evidencePolicyService');

exports.processEvidence = async (evidenceData) => {
  const policy = await evidencePolicyService.getPolicy(evidenceData.sourceType);
  
  if (evidenceData.metadata && evidenceData.metadata.reliability === undefined) {
    if (policy) evidenceData.metadata.reliability = policy.reliability;
  } else if (!evidenceData.metadata) {
    evidenceData.metadata = { reliability: policy ? policy.reliability : 0.7, relevance: policy ? policy.defaultRelevance : 0.8 };
  }

  const norm = evidenceNormalizationService.enrichEvidenceNormalization(evidenceData);
  evidenceData.normalizedValue = norm.normalizedValue;
  if (evidenceData.metadata) evidenceData.metadata.normalizationMethod = norm.normalizationMethod;

  const qual = evidenceQualityService.enrichEvidenceQuality(evidenceData);
  evidenceData.quality = qual.quality;
  if (evidenceData.metadata) evidenceData.metadata.qualityMetrics = qual.qualityMetrics;

  const evidence = new Evidence(evidenceData);
  await evidence.save();

  return evidence;
};
`;

fs.writeFileSync(filePath, correctCode);
