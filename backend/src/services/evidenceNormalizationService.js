/**
 * Phase 4B.2: Evidence Normalization Engine
 * Converts source-specific raw observations into a normalized 0-1 scale.
 * IMPORTANT LIMITATIONS:
 * - normalizedValue is NOT capability.
 * - activity is NOT mastery.
 * - certification is NOT mastery.
 * - self-reported skills are NOT demonstrated capability.
 * - null normalization means insufficient quantitative evidence.
 */

function clamp(value) {
  if (value == null) return null;
  return Math.max(0, Math.min(1, value));
}

exports.normalizeEvidence = (evidence) => {
  const { sourceType, rawValue } = evidence;
  
  if (rawValue == null) {
    return { normalizedValue: null, normalizationMethod: null };
  }

  let normalizedValue = null;
  let normalizationMethod = null;

  switch (sourceType) {
    case 'INTERNAL_ASSESSMENT':
    case 'GENERATED_SKILL_ASSESSMENT':
      if (typeof rawValue.score === 'number') {
        normalizedValue = rawValue.score / 100;
        normalizationMethod = 'ASSESSMENT_SCORE_0_100';
      }
      break;

    case 'GENERATED_AI_QUIZ':
      if (typeof rawValue.correctAnswers === 'number' && typeof rawValue.totalQuestions === 'number' && rawValue.totalQuestions > 0) {
        normalizedValue = rawValue.correctAnswers / rawValue.totalQuestions;
        normalizationMethod = 'QUIZ_ACCURACY';
      } else if (typeof rawValue.score === 'number') {
        normalizedValue = rawValue.score / 100;
        normalizationMethod = 'QUIZ_ACCURACY';
      }
      break;

    case 'TRAINING':
      if (typeof rawValue.completionPercent === 'number') {
        normalizedValue = rawValue.completionPercent / 100;
        normalizationMethod = 'TRAINING_COMPLETION';
      }
      break;

    case 'KPI':
      if (typeof rawValue.achievementPercent === 'number') {
        normalizedValue = rawValue.achievementPercent / 100;
        normalizationMethod = 'KPI_ACHIEVEMENT';
      }
      break;

    case 'MANAGER_FEEDBACK':
    case 'PEER_FEEDBACK':
      if (typeof rawValue.rating === 'number' && rawValue.rating >= 1 && rawValue.rating <= 5) {
        normalizedValue = (rawValue.rating - 1) / 4;
        normalizationMethod = 'FEEDBACK_RATING_1_5';
      }
      break;

    case 'PROJECT':
      if (typeof rawValue.projectScore === 'number') {
        normalizedValue = rawValue.projectScore / 100;
        normalizationMethod = 'PROJECT_SCORE_0_100';
      } else if (typeof rawValue.completionPercent === 'number') {
        normalizedValue = rawValue.completionPercent / 100;
        normalizationMethod = 'PROJECT_COMPLETION';
      }
      break;

    case 'EXTERNAL_GITHUB':
      // Only commit count is not enough. Need structured activity.
      if (rawValue.pullRequests !== undefined || rawValue.issuesClosed !== undefined) {
        const prs = rawValue.pullRequests || 0;
        const merged = rawValue.mergedPullRequests || 0;
        const issues = rawValue.issuesClosed || 0;
        const reviews = rawValue.reviewActivity || 0;
        
        // Simple heuristic for activity mapping.
        const weightedActivity = (prs * 2) + (merged * 5) + (issues * 1) + (reviews * 3);
        
        if (weightedActivity > 0) {
          // Rational saturation function: y = x / (x + k). Half-max at k=25
          normalizedValue = weightedActivity / (weightedActivity + 25);
          normalizationMethod = 'GITHUB_ACTIVITY_SATURATING_K25';
        }
      }
      break;

    case 'EXTERNAL_LEETCODE':
      if (typeof rawValue.contestRating === 'number') {
        // Logistic function for ELO-style ratings: y = 1 / (1 + e^(-k(R - R0)))
        // Center (0.5) at R0 = 1700, steepness k = 0.003
        normalizedValue = 1 / (1 + Math.exp(-0.003 * (rawValue.contestRating - 1700)));
        normalizationMethod = 'LEETCODE_RATING_LOGISTIC_M1700';
      } else if (rawValue.hardSolved !== undefined || rawValue.mediumSolved !== undefined) {
        const hard = rawValue.hardSolved || 0;
        const medium = rawValue.mediumSolved || 0;
        const easy = rawValue.easySolved || 0;
        
        const weighted = (hard * 4) + (medium * 2) + (easy * 1);
        if (weighted > 0) {
          // Rational saturation function: y = x / (x + k). Half-max at k=100
          normalizedValue = weighted / (weighted + 100);
          normalizationMethod = 'LEETCODE_ACTIVITY_SATURATING_K100';
        }
      }
      break;

    case 'EXTERNAL_LINKEDIN':
      // Self-reported skills alone do not demonstrate mastery.
      normalizedValue = null;
      normalizationMethod = 'LINKEDIN_SELF_REPORTED_SKILL_NULL';
      break;

    case 'CERTIFICATION':
      if (typeof rawValue.score === 'number') {
        normalizedValue = rawValue.score / 100;
        normalizationMethod = 'CERTIFICATION_SCORE';
      } else {
        // Without an explicit score, certification proves achievement but we do not inflate it to 1.0.
        // Returning null forces the engine to recognize we lack quantitative precision.
        normalizedValue = null;
        normalizationMethod = 'CERTIFICATION_NO_SCORE_NULL';
      }
      break;

    default:
      break;
  }

  // Ensure value is strictly bounded between 0 and 1
  return {
    normalizedValue: clamp(normalizedValue),
    normalizationMethod: normalizedValue !== null ? normalizationMethod : (normalizationMethod || 'NO_QUANTITATIVE_SIGNAL_NULL')
  };
};

/**
 * Orchestrates the full normalization pass.
 */
exports.enrichEvidenceNormalization = (evidencePayload) => {
  // Respect explicit manual overrides if explicitly requested
  if (evidencePayload.normalizationOverride === true) {
    return evidencePayload;
  }

  const { normalizedValue, normalizationMethod } = exports.normalizeEvidence(evidencePayload);

  return {
    ...evidencePayload,
    normalizedValue,
    normalizationMethod
  };
};
