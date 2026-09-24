const evidenceNormalizationService = require('../src/services/evidenceNormalizationService');

console.log('--- RUNNING PHASE 4B.2 EVIDENCE NORMALIZATION TESTS ---\n');

function runTest(name, input, expectedValue, expectedMethod) {
  const result = evidenceNormalizationService.normalizeEvidence(input);
  
  // Safe comparison for floating point math
  let isValueMatch = false;
  if (result.normalizedValue === expectedValue) {
    isValueMatch = true;
  } else if (result.normalizedValue !== null && expectedValue !== null) {
    isValueMatch = Math.abs(result.normalizedValue - expectedValue) < 0.0001;
  }

  const isMethodMatch = result.normalizationMethod === expectedMethod;
  
  if (isValueMatch && isMethodMatch) {
    console.log(`[PASS] ${name}`);
  } else {
    console.log(`[FAIL] ${name}`);
    if (!isValueMatch) console.error(`  -> Value: expected ${expectedValue}, got ${result.normalizedValue}`);
    if (!isMethodMatch) console.error(`  -> Method: expected ${expectedMethod}, got ${result.normalizationMethod}`);
  }
}

// 1. Assessment 82/100 → 0.82
runTest('Assessment 82/100', 
  { sourceType: 'INTERNAL_ASSESSMENT', rawValue: { score: 82 } }, 
  0.82, 'ASSESSMENT_SCORE_0_100'
);

// 2. Quiz 8/10 → 0.80
runTest('Quiz 8/10', 
  { sourceType: 'GENERATED_AI_QUIZ', rawValue: { correctAnswers: 8, totalQuestions: 10 } }, 
  0.80, 'QUIZ_ACCURACY'
);

// 3. Training completion 100% → 1.0
runTest('Training completion 100%', 
  { sourceType: 'TRAINING', rawValue: { completionPercent: 100 } }, 
  1.0, 'TRAINING_COMPLETION'
);

// 4. Training completion 60% → 0.60
runTest('Training completion 60%', 
  { sourceType: 'TRAINING', rawValue: { completionPercent: 60 } }, 
  0.60, 'TRAINING_COMPLETION'
);

// 5. KPI achievement 125% → clamped to 1.0
runTest('KPI achievement 125% (clamped to 1.0)', 
  { sourceType: 'KPI', rawValue: { achievementPercent: 125 } }, 
  1.0, 'KPI_ACHIEVEMENT'
);

// 6. Feedback rating 5/5 → 1.0
runTest('Feedback rating 5/5', 
  { sourceType: 'MANAGER_FEEDBACK', rawValue: { rating: 5 } }, 
  1.0, 'FEEDBACK_RATING_1_5'
);

// 7. Feedback rating 3/5 → 0.5
runTest('Feedback rating 3/5', 
  { sourceType: 'MANAGER_FEEDBACK', rawValue: { rating: 3 } }, 
  0.5, 'FEEDBACK_RATING_1_5'
);

// 8. Project with score 85 → 0.85
runTest('Project with score 85', 
  { sourceType: 'PROJECT', rawValue: { projectScore: 85 } }, 
  0.85, 'PROJECT_SCORE_0_100'
);

// 9. Project with only description → null
runTest('Project with only description (no quantitative score)', 
  { sourceType: 'PROJECT', rawValue: { description: 'Good project' } }, 
  null, 'NO_QUANTITATIVE_SIGNAL_NULL'
);

// 10. GitHub with only commits → null
runTest('GitHub with only commits', 
  { sourceType: 'EXTERNAL_GITHUB', rawValue: { commits: 400 } }, 
  null, 'NO_QUANTITATIVE_SIGNAL_NULL'
);

// 11. GitHub with moderate activity
runTest('GitHub with moderate activity (15 weighted pts)', 
  { sourceType: 'EXTERNAL_GITHUB', rawValue: { pullRequests: 5, reviewActivity: 1 } }, 
  13 / (13 + 25), 'GITHUB_ACTIVITY_SATURATING_K25' 
  // Wait PR=5 * 2 = 10, review=1 * 3 = 3 => 13
);

runTest('GitHub with high activity (100 weighted pts)', 
  { sourceType: 'EXTERNAL_GITHUB', rawValue: { pullRequests: 35, mergedPullRequests: 5, reviewActivity: 1 } }, 
  98 / (98 + 25), 'GITHUB_ACTIVITY_SATURATING_K25' // 35*2 + 5*5 + 1*3 = 98 -> 98/123 = 0.796
);

// 12. LeetCode rating logistic tests
runTest('LeetCode rating (Beginner ~1000)', 
  { sourceType: 'EXTERNAL_LEETCODE', rawValue: { contestRating: 1000 } }, 
  1 / (1 + Math.exp(-0.003 * (1000 - 1700))), 'LEETCODE_RATING_LOGISTIC_M1700'
);

runTest('LeetCode rating (Average ~1700)', 
  { sourceType: 'EXTERNAL_LEETCODE', rawValue: { contestRating: 1700 } }, 
  0.5, 'LEETCODE_RATING_LOGISTIC_M1700'
);

runTest('LeetCode rating (Elite ~3000)', 
  { sourceType: 'EXTERNAL_LEETCODE', rawValue: { contestRating: 3000 } }, 
  1 / (1 + Math.exp(-0.003 * (3000 - 1700))), 'LEETCODE_RATING_LOGISTIC_M1700'
);

// 13. LeetCode activity with saturation
runTest('LeetCode moderate activity', 
  { sourceType: 'EXTERNAL_LEETCODE', rawValue: { mediumSolved: 50 } }, 
  100 / (100 + 100), 'LEETCODE_ACTIVITY_SATURATING_K100' // 50 * 2 = 100 => 0.5
);

// 14. LeetCode with insufficient information → null
runTest('LeetCode with insufficient info', 
  { sourceType: 'EXTERNAL_LEETCODE', rawValue: { profileUrl: '...' } }, 
  null, 'NO_QUANTITATIVE_SIGNAL_NULL'
);

// 15. LinkedIn self-reported skill → null
runTest('LinkedIn self-reported skill', 
  { sourceType: 'EXTERNAL_LINKEDIN', rawValue: { skillLevel: 'Expert' } }, 
  null, 'LINKEDIN_SELF_REPORTED_SKILL_NULL'
);

// 16. Certification with no quantitative score → conservative/documented handling (null)
runTest('Certification with no quantitative score', 
  { sourceType: 'CERTIFICATION', rawValue: { issuer: 'AWS' } }, 
  null, 'CERTIFICATION_NO_SCORE_NULL'
);

// 17. Ensure clamping limits boundary for insanely high numbers
runTest('GitHub with insane activity (10000 weighted pts)', 
  { sourceType: 'EXTERNAL_GITHUB', rawValue: { pullRequests: 5000 } }, 
  10000 / (10000 + 25), 'GITHUB_ACTIVITY_SATURATING_K25' 
);

// 18. Silent bypass test
const maliciousPayload = {
  sourceType: 'INTERNAL_ASSESSMENT',
  rawValue: { score: 10 },
  normalizedValue: 0.99,
  normalizationMethod: 'HACKED'
};
const intercepted = evidenceNormalizationService.enrichEvidenceNormalization(maliciousPayload);

if (intercepted.normalizedValue === 0.10 && intercepted.normalizationMethod === 'ASSESSMENT_SCORE_0_100') {
  console.log('[PASS] Enrichment prevents silent bypass');
} else {
  console.log('[FAIL] Enrichment prevents silent bypass');
}

const overridePayload = {
  sourceType: 'INTERNAL_ASSESSMENT',
  rawValue: { score: 10 },
  normalizedValue: 0.99,
  normalizationMethod: 'MANUAL_OVERRIDE',
  normalizationOverride: true
};
const allowedOverride = evidenceNormalizationService.enrichEvidenceNormalization(overridePayload);

if (allowedOverride.normalizedValue === 0.99 && allowedOverride.normalizationMethod === 'MANUAL_OVERRIDE') {
  console.log('[PASS] Enrichment permits explicit override flag');
} else {
  console.log('[FAIL] Enrichment permits explicit override flag');
}

console.log('\nAll Normalization tests finished.');
