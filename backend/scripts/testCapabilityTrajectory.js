require('dotenv').config();
const mongoose = require('mongoose');
const Evidence = require('../src/models/Evidence');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const capabilityAggregationService = require('../src/services/capabilityAggregationService');

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- RUNNING PHASE 5C TRAJECTORY & VELOCITY TESTS ---\n');

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

    // 1. 0 observations -> INSUFFICIENT_DATA
    await cleanup();
    let cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('0 observations -> INSUFFICIENT_DATA', cap.trajectoryDirection, 'INSUFFICIENT_DATA');
    assertFloat('0 observations -> null slope', cap.trajectorySlope, null);

    // 2. 1-2 observations -> INSUFFICIENT_DATA
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.5, quality: 1.0, occurredAt: new Date('2023-01-01') });
    await insertMockEvidence({ normalizedValue: 0.6, quality: 1.0, occurredAt: new Date('2023-02-01') });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('2 observations -> INSUFFICIENT_DATA', cap.trajectoryDirection, 'INSUFFICIENT_DATA');

    // 3. 3 clearly increasing -> IMPROVING
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.2, quality: 1.0, occurredAt: new Date('2023-01-01') });
    await insertMockEvidence({ normalizedValue: 0.4, quality: 1.0, occurredAt: new Date('2023-02-01') }); // +31 days
    await insertMockEvidence({ normalizedValue: 0.6, quality: 1.0, occurredAt: new Date('2023-03-01') }); // +28 days
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('3 increasing observations -> IMPROVING', cap.trajectoryDirection, 'IMPROVING');
    if (cap.trajectoryVelocity > 0.01) console.log('[PASS] Velocity is positive and > 0.01');
    else console.log(`[FAIL] Velocity ${cap.trajectoryVelocity} is not > 0.01`);
    if (cap.trajectoryR2 > 0.9) console.log('[PASS] R2 is close to perfect (linear increase)');
    else console.log(`[FAIL] R2 ${cap.trajectoryR2} is too low`);

    // 4. 3 clearly decreasing -> DECLINING
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.8, quality: 1.0, occurredAt: new Date('2023-01-01') });
    await insertMockEvidence({ normalizedValue: 0.5, quality: 1.0, occurredAt: new Date('2023-02-01') });
    await insertMockEvidence({ normalizedValue: 0.2, quality: 1.0, occurredAt: new Date('2023-03-01') });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('3 decreasing observations -> DECLINING', cap.trajectoryDirection, 'DECLINING');
    if (cap.trajectoryVelocity < -0.01) console.log('[PASS] Velocity is negative and < -0.01');
    else console.log(`[FAIL] Velocity ${cap.trajectoryVelocity} is not < -0.01`);

    // 5. Flat observations -> STABLE
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.6, quality: 1.0, occurredAt: new Date('2023-01-01') });
    await insertMockEvidence({ normalizedValue: 0.6, quality: 1.0, occurredAt: new Date('2023-02-01') });
    await insertMockEvidence({ normalizedValue: 0.6, quality: 1.0, occurredAt: new Date('2023-03-01') });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('Flat observations -> STABLE', cap.trajectoryDirection, 'STABLE');
    assertFloat('Flat observations -> Velocity is exactly 0', cap.trajectoryVelocity, 0);
    assertFloat('Flat observations -> R2 is 1 (perfect flat line)', cap.trajectoryR2, 1);

    // 8. Same timestamp -> INSUFFICIENT_DATA
    await cleanup();
    const sameDate = new Date('2023-01-01');
    await insertMockEvidence({ normalizedValue: 0.2, quality: 1.0, occurredAt: sameDate });
    await insertMockEvidence({ normalizedValue: 0.4, quality: 1.0, occurredAt: sameDate });
    await insertMockEvidence({ normalizedValue: 0.6, quality: 1.0, occurredAt: sameDate });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('Same timestamp -> INSUFFICIENT_DATA', cap.trajectoryDirection, 'INSUFFICIENT_DATA');

    // 9. High quality influences regression more
    await cleanup();
    // A stable line of low quality at 0.5
    await insertMockEvidence({ normalizedValue: 0.5, quality: 0.1, occurredAt: new Date('2023-01-01') });
    await insertMockEvidence({ normalizedValue: 0.5, quality: 0.1, occurredAt: new Date('2023-02-01') });
    // But a massive HIGH quality spike to 0.9 at the end!
    await insertMockEvidence({ normalizedValue: 0.9, quality: 1.0, occurredAt: new Date('2023-03-01') });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    assertString('High quality outlier heavily skews slope -> IMPROVING', cap.trajectoryDirection, 'IMPROVING');

    // 14/15. Negative/Descriptive evidence ignored
    await cleanup();
    // 2 eligible positive evidence items
    await insertMockEvidence({ normalizedValue: 0.2, quality: 1.0, occurredAt: new Date('2023-01-01') });
    await insertMockEvidence({ normalizedValue: 0.4, quality: 1.0, occurredAt: new Date('2023-02-01') });
    // 1 negative evidence item (ignored)
    await insertMockEvidence({ normalizedValue: 0.9, quality: 1.0, occurredAt: new Date('2023-03-01'), direction: 'NEGATIVE' });
    // 1 descriptive evidence item (ignored)
    await insertMockEvidence({ normalizedValue: null, quality: 1.0, occurredAt: new Date('2023-04-01') });
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    // Since only 2 are eligible, should be INSUFFICIENT_DATA
    assertString('Negative/Descriptive ignored, leaving only 2 -> INSUFFICIENT_DATA', cap.trajectoryDirection, 'INSUFFICIENT_DATA');

    // Check bounds on trajectoryConfidence
    await cleanup();
    await insertMockEvidence({ normalizedValue: 0.2, quality: 1.0, occurredAt: new Date('2023-01-01') });
    await insertMockEvidence({ normalizedValue: 0.5, quality: 1.0, occurredAt: new Date('2023-04-01') }); // + 90 days
    await insertMockEvidence({ normalizedValue: 0.8, quality: 1.0, occurredAt: new Date('2023-07-01') }); // + 91 days
    cap = await capabilityAggregationService.calculateEmployeeSkillCapability(empId, skillId);
    
    // n=3 => quantity=0.5. timespan = ~181 days => 1.0. R2 = ~1.0. => 0.3(0.5)+0.3(1)+0.4(1) = 0.85
    if (cap.trajectoryConfidence > 0 && cap.trajectoryConfidence <= 1) {
       console.log(`[PASS] trajectoryConfidence bounded correctly: ${cap.trajectoryConfidence}`);
    } else {
       console.log(`[FAIL] trajectoryConfidence out of bounds: ${cap.trajectoryConfidence}`);
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
