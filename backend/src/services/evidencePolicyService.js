const EvidenceSourcePolicy = require('../models/EvidenceSourcePolicy');
const { calculateReliability } = require('./evidenceQualityService');

const canonicalSourceTypes = [
  'INTERNAL_ASSESSMENT',
  'PROJECT',
  'KPI',
  'MANAGER_FEEDBACK',
  'PEER_FEEDBACK',
  'TRAINING',
  'CERTIFICATION',
  'EXTERNAL_GITHUB',
  'EXTERNAL_LEETCODE',
  'EXTERNAL_LINKEDIN',
  'EXTERNAL_COURSERA',
  'EXTERNAL_HACKERRANK',
  'GENERATED_AI_QUIZ',
  'GENERATED_SKILL_ASSESSMENT',
  'GENERATED_SIMULATION'
];

exports.seedDefaultPolicies = async () => {
  for (const sourceType of canonicalSourceTypes) {
    const defaultRel = calculateReliability(sourceType);
    await EvidenceSourcePolicy.findOneAndUpdate(
      { sourceType },
      { $setOnInsert: { sourceType, reliability: defaultRel, defaultRelevance: 1.0, isActive: true } },
      { upsert: true }
    );
  }
};

exports.getPolicies = async () => {
  return await EvidenceSourcePolicy.find();
};

exports.getPolicy = async (sourceType) => {
  return await EvidenceSourcePolicy.findOne({ sourceType });
};

exports.updatePolicy = async (id, data) => {
  return await EvidenceSourcePolicy.findByIdAndUpdate(id, data, { new: true });
};
