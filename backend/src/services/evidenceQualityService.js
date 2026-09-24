/**
 * Phase 4B.1: Evidence Quality Engine
 * Calculates the deterministic quality signals for evidence.
 */

const SOURCE_RELIABILITY_POLICY = {
  INTERNAL_ASSESSMENT: 0.95,
  CERTIFICATION: 0.90,
  MANAGER_FEEDBACK: 0.85,
  EXTERNAL_GITHUB: 0.80,
  EXTERNAL_LEETCODE: 0.80,
  EXTERNAL_HACKERRANK: 0.80,
  PROJECT: 0.75,
  TRAINING: 0.70,
  PEER_FEEDBACK: 0.65,
  EXTERNAL_COURSERA: 0.65,
  EXTERNAL_LINKEDIN: 0.50,
  KPI: 0.75,
  GENERATED_AI_QUIZ: 0.70,
  GENERATED_SKILL_ASSESSMENT: 0.85,
  GENERATED_SIMULATION: 0.85
};

const DEFAULT_RELIABILITY = 0.5;

/**
 * Derives the base reliability of a source.
 * Does not measure employee capability; measures trustworthiness of the origin.
 */
exports.calculateReliability = (sourceType) => {
  return SOURCE_RELIABILITY_POLICY[sourceType] ?? DEFAULT_RELIABILITY;
};

/**
 * Derives relevance based on the precision of the mapping.
 * Evidence mapped directly to a skill is highly relevant to that skill.
 * Evidence mapped only to a broad competency is less immediately relevant.
 */
exports.calculateRelevance = (evidence) => {
  if (evidence.skill) {
    return 1.0;
  }
  if (evidence.competency) {
    return 0.6;
  }
  return 0.5;
};

/**
 * Calculates freshness via an exponential decay function.
 * Decay rate: Half-life of exactly 1 year (365 days).
 */
exports.calculateFreshness = (occurredAt, evaluationDate = new Date()) => {
  if (!occurredAt) return null; // Cannot calculate freshness without an occurrence date

  const ageInMilliseconds = evaluationDate.getTime() - new Date(occurredAt).getTime();
  
  // Future evidence (e.g. timezone mismatch) clamped to now.
  if (ageInMilliseconds < 0) return 1.0; 

  const ageInDays = ageInMilliseconds / (1000 * 60 * 60 * 24);
  const halfLifeDays = 365;
  const lambda = Math.LN2 / halfLifeDays; // Continuous decay rate
  
  const freshness = Math.exp(-lambda * ageInDays);
  return Math.max(0, Math.min(1, freshness));
};

/**
 * Calculates the overall quality of the evidence.
 * quality = reliability x relevance x freshness
 */
exports.calculateQuality = (reliability, relevance, freshness) => {
  if (reliability == null || relevance == null || freshness == null) {
    return null; // Don't invent a quality score if components are missing
  }
  
  const quality = reliability * relevance * freshness;
  return Math.max(0, Math.min(1, quality));
};

/**
 * Full pipeline for enriching an evidence object before save.
 * Honors manual overrides.
 */
exports.enrichEvidenceQuality = (evidencePayload) => {
  // Respect manual overrides or fall back to calculation
  const reliability = evidencePayload.reliability ?? exports.calculateReliability(evidencePayload.sourceType);
  const relevance = evidencePayload.relevance ?? exports.calculateRelevance(evidencePayload);
  
  // Freshness is calculated from occurredAt unless explicitly overridden
  const freshness = evidencePayload.freshness ?? exports.calculateFreshness(evidencePayload.occurredAt);
  
  const quality = exports.calculateQuality(reliability, relevance, freshness);
  
  return {
    ...evidencePayload,
    reliability,
    relevance,
    freshness,
    quality
  };
};
