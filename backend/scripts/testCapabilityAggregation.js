require('dotenv').config();
const mongoose = require('mongoose');
const Evidence = require('../src/models/Evidence');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const capabilityAggregationService = require('../src/services/capabilityAggregationService');

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- RUNNING PHASE 5A CAPABILITY AGGREGATION TESTS ---\n');

    // Create a dummy employee and skill ID
    const empId = new mongoose.Types.ObjectId();
    const skillId = new mongoose.Types.ObjectId();

    // Helper to insert evidence
    async function insertMockEvidence(overrides) {
      const base = {
        employee: empId,
        skill: skillId,
        sourceType: 'INTERNAL_ASSESSMENT',
        title: 'Mock Evidence',
        evidenceKind: 'ASSESSMENT',
        status: 'ACTIVE',
        direction: 'POSITIVE',
        occurredAt: new Date()
      };
      const ev = new Evidence({ ...base, ...overrides });
      return await ev.save();
    }

    async function cleanup() {
      await Evidence.deleteMany({ employee: empId });
      await EmployeeSkillCapability.deleteMany({ employee: empId });
    }

    function assertFloat(name, actual, expected) {
      if (actual == null && expected == null) {
         console.log(`[PASS] ${name}`);
         return;
      }
      if (actual == null || expected == null) {
         console.log(`[FAIL] ${name} -> Expected ${expected}, got ${actual}`);
         return;
      }
      if (Math.abs(actual - expected) < 0.0001) {
        console.log(`[PASS] ${name}`);
      } else {
        console.log(`[FAIL] ${name} -> Expected ${expected}, got ${actual}`);
      }
    }

    // ---------------------------------------------------------
    // TEST A: Single strong assessment
    // ---------------------------------------------------------
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.9, quality: 0.9 });
    let cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertFloat('Test A: Single strong assessment -> capabilityScore 0.9', cap.capabilityScore, 0.9);
    assertFloat('Test A: Single strong assessment -> proficiencyLevel 5', cap.proficiencyLevel, 5);
    
    // ---------------------------------------------------------
    // TEST B/C: Multiple evidence + Quality weights
    // ---------------------------------------------------------
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.9, quality: 0.9 }); // weight 0.9 * 0.9 = 0.81
    await insertMockEvidence({ normalizedValue: 0.4, quality: 0.5 }); // weight 0.5 * 0.4 = 0.20
    // Total contribution = 1.01. Total weight = 1.4. Score = 1.01 / 1.4 = ~0.721428
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertFloat('Test B/C: Weighted mean correctly balances quality', cap.capabilityScore, 1.01 / 1.4);
    assertFloat('Test B/C: Proficiency mapping to level 4 (0.6 - 0.79)', cap.proficiencyLevel, 4);

    // ---------------------------------------------------------
    // TEST D/E: Null values do not contribute
    // ---------------------------------------------------------
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.8, quality: 1.0 });
    await insertMockEvidence({ normalizedValue: null, quality: 1.0 });
    await insertMockEvidence({ normalizedValue: 0.2, quality: null });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertFloat('Test D/E: Nulls are ignored safely', cap.capabilityScore, 0.8);
    assertFloat('Test D/E: effectiveEvidenceCount is 1', cap.effectiveEvidenceCount, 1);
    assertFloat('Test D/E: excludedEvidenceCount is 2', cap.excludedEvidenceCount, 2);
    assertFloat('Test D/E: total evidenceCount is 3', cap.evidenceCount, 3);

    // ---------------------------------------------------------
    // TEST F/G: REVOKED/ARCHIVED do not contribute
    // ---------------------------------------------------------
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.2, quality: 1.0, status: 'REVOKED' });
    await insertMockEvidence({ normalizedValue: 0.2, quality: 1.0, status: 'ARCHIVED' });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertFloat('Test F/G: Revoked/Archived produce null score', cap.capabilityScore, null);

    // ---------------------------------------------------------
    // TEST H: Neutral Contributes, Negative Excluded
    // ---------------------------------------------------------
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.8, quality: 1.0, direction: 'POSITIVE' });
    await insertMockEvidence({ normalizedValue: 0.8, quality: 1.0, direction: 'NEUTRAL' });
    await insertMockEvidence({ normalizedValue: 0.1, quality: 1.0, direction: 'NEGATIVE' });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertFloat('Test H: Positive + Neutral are averaged', cap.capabilityScore, 0.8);
    assertFloat('Test H: effectiveEvidenceCount is 2', cap.effectiveEvidenceCount, 2);
    assertFloat('Test H: excludedEvidenceCount is 1 (negative)', cap.excludedEvidenceCount, 1);
    assertFloat('Test H: total evidenceCount is 3', cap.evidenceCount, 3);

    // ---------------------------------------------------------
    // TEST J: No Quantitative Evidence -> null, not zero
    // ---------------------------------------------------------
    await cleanup();
    await insertMockEvidence({ normalizedValue: null, quality: 0.5 });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertFloat('Test J: No eligible evidence yields null score', cap.capabilityScore, null);
    assertFloat('Test J: No eligible evidence yields null proficiency', cap.proficiencyLevel, null);
    assertFloat('Test J: effectiveEvidenceCount is 0', cap.effectiveEvidenceCount, 0);
    assertFloat('Test J: excludedEvidenceCount is 1', cap.excludedEvidenceCount, 1);

    // ---------------------------------------------------------
    // TEST K: Boundary Tests
    // ---------------------------------------------------------
    const boundaries = [
      { score: 0.19, level: 1 },
      { score: 0.20, level: 2 },
      { score: 0.39, level: 2 },
      { score: 0.40, level: 3 },
      { score: 0.59, level: 3 },
      { score: 0.60, level: 4 },
      { score: 0.79, level: 4 },
      { score: 0.80, level: 5 }
    ];
    for (const b of boundaries) {
      await cleanup();
      await insertMockEvidence({ normalizedValue: b.score, quality: 1.0 });
      cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
      assertFloat(`Test K: Boundary ${b.score} -> Level ${b.level}`, cap.proficiencyLevel, b.level);
    }

    // ---------------------------------------------------------
    // TEST L: Upsert behavior avoids duplication
    // ---------------------------------------------------------
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.5, quality: 1.0 });
    await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    const docs = await EmployeeSkillCapability.find({ employee: empId, skill: skillId });
    assertFloat('Test L: Upsert guarantees exactly 1 state document', docs.length, 1);

    // ---------------------------------------------------------
    // TEST M: lastEvidenceAt maps correctly
    // ---------------------------------------------------------
    await cleanup();
    const oldDate = new Date('2020-01-01');
    const newDate = new Date('2026-01-01');
    await insertMockEvidence({ normalizedValue: 0.5, quality: 1.0, occurredAt: oldDate });
    await insertMockEvidence({ normalizedValue: null, quality: null, occurredAt: newDate });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    // lastEvidenceAt should be the latest ELIGIBLE evidence, which is oldDate!
    // Wait, requirement: "lastEvidenceAt: Use the latest occurredAt among eligible ACTIVE evidence. If no eligible evidence exists... latest relevant evidence date if available"
    if (cap.lastEvidenceAt.getTime() === oldDate.getTime()) {
       console.log('[PASS] Test M: lastEvidenceAt selects highest ELIGIBLE date');
    } else {
       console.log(`[FAIL] Test M: Expected ${oldDate}, got ${cap.lastEvidenceAt}`);
    }

    await cleanup();
    await insertMockEvidence({ normalizedValue: null, quality: null, occurredAt: newDate });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    if (cap.lastEvidenceAt.getTime() === newDate.getTime()) {
       console.log('[PASS] Test M: lastEvidenceAt falls back to ANY date if no eligible evidence');
    } else {
       console.log(`[FAIL] Test M: Expected ${newDate}, got ${cap.lastEvidenceAt}`);
    }

    await cleanup();

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
