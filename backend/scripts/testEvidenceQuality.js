const evidenceQualityService = require('../src/services/evidenceQualityService');

console.log('--- RUNNING PHASE 4B.1 EVIDENCE QUALITY TESTS ---\n');

function runTest(name, result, expectedStr, evalFn) {
  const isPass = evalFn(result);
  console.log(`[${isPass ? 'PASS' : 'FAIL'}] ${name}`);
  if (!isPass) {
    console.error(`  -> Expected: ${expectedStr}`);
    console.error(`  -> Got:`, result);
  }
}

// 1. Reliability policy returns expected values
runTest('Reliability policy for INTERNAL_ASSESSMENT', 
  evidenceQualityService.calculateReliability('INTERNAL_ASSESSMENT'), 
  '0.95', 
  v => v === 0.95
);

runTest('Reliability policy for EXTERNAL_GITHUB', 
  evidenceQualityService.calculateReliability('EXTERNAL_GITHUB'), 
  '0.8', 
  v => v === 0.8
);

runTest('Reliability default fallback', 
  evidenceQualityService.calculateReliability('UNKNOWN_SOURCE'), 
  '0.5', 
  v => v === 0.5
);

// 2. Relevance mapping logic
runTest('Relevance for skill-mapped evidence', 
  evidenceQualityService.calculateRelevance({ skill: 'some_id', competency: 'some_id' }), 
  '1.0', 
  v => v === 1.0
);

runTest('Relevance for competency-only evidence', 
  evidenceQualityService.calculateRelevance({ competency: 'some_id' }), 
  '0.6', 
  v => v === 0.6
);

// 3. Freshness decay logic
const now = new Date('2026-09-23T12:00:00Z');
runTest('Freshness for brand new evidence', 
  evidenceQualityService.calculateFreshness('2026-09-23T12:00:00Z', now), 
  '1.0', 
  v => v === 1.0
);

const halfYearAgo = new Date(now.getTime() - (182.5 * 24 * 60 * 60 * 1000)).toISOString();
runTest('Freshness for 6 month old evidence (should be ~0.707)', 
  evidenceQualityService.calculateFreshness(halfYearAgo, now), 
  '~0.707', 
  v => v > 0.7 && v < 0.71
);

const yearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)).toISOString();
runTest('Freshness for 1 year old evidence (should be 0.5)', 
  evidenceQualityService.calculateFreshness(yearAgo, now), 
  '0.5', 
  v => v === 0.5
);

runTest('Freshness missing occurredAt is handled safely', 
  evidenceQualityService.calculateFreshness(null, now), 
  'null', 
  v => v === null
);

// 4. Quality calculation clamping
runTest('Quality calculation matches reliability * relevance * freshness', 
  evidenceQualityService.calculateQuality(0.9, 0.95, 0.9), 
  '0.7695', 
  v => Math.abs(v - 0.7695) < 0.0001
);

runTest('Quality handles clamping gracefully', 
  evidenceQualityService.calculateQuality(1.5, 1.2, 1.0), 
  '1.0', 
  v => v === 1.0
);

// 5. Enrichment payload correctly honors overrides
const mockPayload = {
  sourceType: 'EXTERNAL_GITHUB',
  skill: 'some_id',
  occurredAt: yearAgo
};
const enriched = evidenceQualityService.enrichEvidenceQuality(mockPayload);

runTest('Enrichment calculates defaults automatically', 
  enriched, 
  'reliability=0.8, relevance=1.0, freshness=0.5, quality=0.4', 
  v => v.reliability === 0.8 && v.relevance === 1.0 && Math.abs(v.freshness - 0.5) < 0.05 && Math.abs(v.quality - 0.4) < 0.05
);

const overridePayload = {
  ...mockPayload,
  reliability: 1.0 // manual override
};
const enrichedOverride = evidenceQualityService.enrichEvidenceQuality(overridePayload);

runTest('Enrichment honors explicit overrides', 
  enrichedOverride, 
  'reliability=1.0, quality=0.5', 
  v => v.reliability === 1.0 && Math.abs(v.quality - 0.5) < 0.05
);

console.log('\nAll Evidence Quality math tests finished.');
