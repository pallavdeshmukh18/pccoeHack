require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const evidenceNormalizationService = require('../src/services/evidenceNormalizationService');
const evidenceConflictService = require('../src/services/evidenceConflictService');
const Employee = require('../src/models/Employee');
const Skill = require('../src/models/Skill');
const Evidence = require('../src/models/Evidence');

async function testNormalization() {
  console.log('--- Testing Normalization Contracts ---');
  
  const m1 = evidenceNormalizationService.normalizeEvidence({ sourceType: 'MANAGER_FEEDBACK', rawValue: { rating: 5 } });
  if (m1.normalizedValue !== 1) throw new Error("MANAGER_FEEDBACK rating 5 should be 1.0");

  const m2 = evidenceNormalizationService.normalizeEvidence({ sourceType: 'MANAGER_FEEDBACK', rawValue: { rating: 1 } });
  if (m2.normalizedValue !== 0) throw new Error("MANAGER_FEEDBACK rating 1 should be 0.0");

  const t1 = evidenceNormalizationService.normalizeEvidence({ sourceType: 'TRAINING', rawValue: { completionPercent: 50 } });
  if (t1.normalizedValue !== 0.5) throw new Error("TRAINING 50% should be 0.5");

  const c1 = evidenceNormalizationService.normalizeEvidence({ sourceType: 'CERTIFICATION', rawValue: {} });
  if (c1.normalizedValue !== null) throw new Error("CERTIFICATION without score should be null");

  const z1 = evidenceNormalizationService.normalizeEvidence({ sourceType: 'INTERNAL_ASSESSMENT', rawValue: { score: 0 } });
  if (z1.normalizedValue !== 0) throw new Error("INTERNAL_ASSESSMENT 0 score should be 0");

  const p1 = evidenceNormalizationService.normalizeEvidence({ sourceType: 'PROJECT', rawValue: { projectScore: 85 } });
  if (p1.normalizedValue !== 0.85) throw new Error("PROJECT score 85 should be 0.85");

  const l1 = evidenceNormalizationService.normalizeEvidence({ sourceType: 'EXTERNAL_LEETCODE', rawValue: { contestRating: 1700 } });
  if (Math.abs(l1.normalizedValue - 0.5) > 0.01) throw new Error("LEETCODE 1700 should be 0.5");

  console.log('✅ Normalization verified.');
}

async function testConflictDetection() {
  console.log('--- Testing Conflict Detection ---');
  let mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const empId = new mongoose.Types.ObjectId();
  const skillId = new mongoose.Types.ObjectId();

  await Evidence.insertMany([
    { employee: empId, skill: skillId, evidenceKind: 'ASSESSMENT', sourceType: 'INTERNAL_ASSESSMENT', rawValue: { score: 90 }, normalizedValue: 0.9, quality: 0.9, direction: 'POSITIVE', title: 'Test', status: 'ACTIVE' },
    { employee: empId, skill: skillId, evidenceKind: 'ASSESSMENT', sourceType: 'INTERNAL_ASSESSMENT', rawValue: { score: 85 }, normalizedValue: 0.85, quality: 0.9, direction: 'POSITIVE', title: 'Test', status: 'ACTIVE' },
    { employee: empId, skill: skillId, evidenceKind: 'ASSESSMENT', sourceType: 'INTERNAL_ASSESSMENT', rawValue: { score: 10 }, normalizedValue: 0.1, quality: 0.3, direction: 'NEGATIVE', title: 'Test', status: 'ACTIVE' }
  ]);

  const c = await evidenceConflictService.detectConflicts(empId, skillId);
  // High quality 0.9 and 0.85 vs Low quality 0.1
  // Weighted mean: (0.9*0.9 + 0.85*0.9 + 0.1*0.3) / 2.1 = 1.605 / 2.1 = 0.764
  // We expect it NOT to be CONFLICTING because the negative evidence is low quality (<0.5).
  // Wait, let's just log it to see if it behaves smartly.
  console.log(`Conflict Status (High positive vs Low negative): ${c.conflictStatus} | Score: ${c.conflictScore}`);
  
  if (c.conflictStatus === 'CONFLICTING') {
      throw new Error("A single low quality outlier dominated the conflict score!");
  }

  // Add high quality negative evidence
  await Evidence.create({ employee: empId, skill: skillId, evidenceKind: 'ASSESSMENT', sourceType: 'INTERNAL_ASSESSMENT', rawValue: { score: 20 }, normalizedValue: 0.2, quality: 0.9, direction: 'NEGATIVE', title: 'Test', status: 'ACTIVE' });
  const c2 = await evidenceConflictService.detectConflicts(empId, skillId);
  console.log(`Conflict Status (Added High negative): ${c2.conflictStatus} | Score: ${c2.conflictScore}`);
  
  if (c2.conflictStatus !== 'CONFLICTING') {
      throw new Error("High quality negative evidence did not trigger CONFLICTING!");
  }

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('✅ Conflict logic verified.');
}

async function runTests() {
  await testNormalization();
  await testConflictDetection();
  console.log('All additional tests passed!');
  process.exit(0);
}

runTests();
