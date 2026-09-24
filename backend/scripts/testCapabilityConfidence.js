require('dotenv').config();
const mongoose = require('mongoose');
const Evidence = require('../src/models/Evidence');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const capabilityAggregationService = require('../src/services/capabilityAggregationService');

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- RUNNING PHASE 5B CONFIDENCE & SUFFICIENCY TESTS ---\n');

    const empId = new mongoose.Types.ObjectId();
    const skillId = new mongoose.Types.ObjectId();

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

    function assertString(name, actual, expected) {
      if (actual === expected) console.log(`[PASS] ${name}`);
      else console.log(`[FAIL] ${name} -> Expected ${expected}, got ${actual}`);
    }

    // 1. Zero Usable Evidence
    await cleanup();
    await insertMockEvidence({ normalizedValue: null, quality: null }); // Unusable
    let cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('Zero Evidence -> INSUFFICIENT sufficiency', cap.evidenceSufficiency, 'INSUFFICIENT');
    assertFloat('Zero Evidence -> confidenceScore null', cap.confidenceScore, null);
    
    // 2. One Observation -> LIMITED
    await cleanup();
    await insertMockEvidence({ sourceType: 'INTERNAL_ASSESSMENT', normalizedValue: 0.8, quality: 0.9 });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('One Evidence -> LIMITED sufficiency', cap.evidenceSufficiency, 'LIMITED');
    // quantityScore = 1 / (1 + 3) = 0.25
    assertFloat('One Evidence -> quantityScore 0.25', cap.quantityScore, 0.25);
    // qualityScore = (0.9^2)/(0.9) = 0.9
    assertFloat('One Evidence -> qualityScore 0.9', cap.qualityScore, 0.9);
    // diversityScore = 0.33 (1 family)
    assertFloat('One Evidence -> diversityScore 0.33', cap.diversityScore, 0.33);
    // consistencyScore = variance=0 -> 1 / 1 = 1.0
    assertFloat('One Evidence -> consistencyScore 1.0', cap.consistencyScore, 1.0);
    // Confidence = 0.3(0.25) + 0.25(0.9) + 0.2(0.33) + 0.25(1.0) = 0.075 + 0.225 + 0.066 + 0.25 = 0.616
    assertFloat('One Evidence -> confidenceScore 0.616', cap.confidenceScore, 0.616);

    // 3. 2-3 Observations -> MODERATE
    await cleanup();
    await insertMockEvidence({ sourceType: 'INTERNAL_ASSESSMENT', normalizedValue: 0.8, quality: 0.9 });
    await insertMockEvidence({ sourceType: 'TRAINING', normalizedValue: 0.8, quality: 0.8 });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('Two Evidence -> MODERATE sufficiency', cap.evidenceSufficiency, 'MODERATE');
    // Diversity = 2 families -> 0.67
    assertFloat('Two Evidence -> diversityScore 0.67', cap.diversityScore, 0.67);

    // 4. 4+ Observations -> STRONG
    await cleanup();
    await insertMockEvidence({ sourceType: 'INTERNAL_ASSESSMENT', normalizedValue: 0.8, quality: 0.9 });
    await insertMockEvidence({ sourceType: 'INTERNAL_ASSESSMENT', normalizedValue: 0.8, quality: 0.9 });
    await insertMockEvidence({ sourceType: 'TRAINING', normalizedValue: 0.8, quality: 0.9 });
    await insertMockEvidence({ sourceType: 'EXTERNAL_GITHUB', normalizedValue: 0.8, quality: 0.9 });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('Four Evidence -> STRONG sufficiency', cap.evidenceSufficiency, 'STRONG');
    // Diversity = 3 families -> 1.0
    assertFloat('Four Evidence (3 families) -> diversityScore 1.0', cap.diversityScore, 1.0);

    // 5. Conflicting observations lower consistency
    await cleanup();
    await insertMockEvidence({ sourceType: 'INTERNAL_ASSESSMENT', normalizedValue: 0.2, quality: 0.9 });
    await insertMockEvidence({ sourceType: 'INTERNAL_ASSESSMENT', normalizedValue: 0.9, quality: 0.9 });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    // mean = 0.55
    // variance = 0.9 * (0.2-0.55)^2 + 0.9 * (0.9-0.55)^2 / 1.8 
    // var = 0.1225
    // consist = 1 / (1 + 1.225) = ~0.449
    if (cap.consistencyScore < 0.5) {
      console.log('[PASS] Conflicting observations produced lower consistency');
    } else {
      console.log(`[FAIL] Expected low consistency, got ${cap.consistencyScore}`);
    }

    // 6. Negative Evidence Exclusion Test
    await cleanup();
    await insertMockEvidence({ sourceType: 'INTERNAL_ASSESSMENT', normalizedValue: 0.8, quality: 0.9 });
    // This negative should be ignored entirely from aggregation AND confidence math
    await insertMockEvidence({ sourceType: 'EXTERNAL_GITHUB', normalizedValue: 0.1, quality: 0.9, direction: 'NEGATIVE' });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    // Since negative is ignored, diversity should only be 1 family, not 2.
    assertFloat('Negative Evidence excluded from diversity scoring', cap.diversityScore, 0.33);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
