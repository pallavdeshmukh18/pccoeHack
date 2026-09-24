require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../src/models/Skill');
const Competency = require('../src/models/Competency');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const EmployeeCompetencyCapability = require('../src/models/EmployeeCompetencyCapability');
const competencyCapabilityService = require('../src/services/competencyCapabilityService');

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- RUNNING PHASE 5D COMPETENCY CAPABILITY TESTS ---\n');

    const empId = new mongoose.Types.ObjectId();
    const compId = new mongoose.Types.ObjectId();
    
    // Cleanup helper
    async function cleanup() {
      await Skill.deleteMany({ competency: compId });
      await EmployeeSkillCapability.deleteMany({ employee: empId });
      await EmployeeCompetencyCapability.deleteMany({ employee: empId });
    }

    // Helper to insert skill and state
    async function insertMockSkillState(overrides) {
      const skill = new Skill({
        competency: compId,
        name: `Skill ${Math.random()}`,
        description: 'Test',
        category: 'TECHNICAL',
        isActive: true,
        proficiencyLevels: [
          { level: 1, name: 'Novice', description: 'L1' },
          { level: 2, name: 'Beginner', description: 'L2' },
          { level: 3, name: 'Intermediate', description: 'L3' },
          { level: 4, name: 'Advanced', description: 'L4' },
          { level: 5, name: 'Expert', description: 'L5' }
        ]
      });
      await skill.save();

      const cap = new EmployeeSkillCapability({
        employee: empId,
        skill: skill._id,
        ...overrides
      });
      return await cap.save();
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

    // 1. No eligible skill capabilities -> INSUFFICIENT + null
    await cleanup();
    await insertMockSkillState({ capabilityScore: null, confidenceScore: null });
    let compCap = await competencyCapabilityService.calculateEmployeeCompetencyCapability(empId, compId);
    assertString('No eligible skills -> INSUFFICIENT sufficiency', compCap.evidenceSufficiency, 'INSUFFICIENT');
    assertFloat('No eligible skills -> null score', compCap.capabilityScore, null);

    // 2. One eligible skill -> capability equals that skill's capability
    await cleanup();
    await insertMockSkillState({ capabilityScore: 0.8, confidenceScore: 0.9 });
    compCap = await competencyCapabilityService.calculateEmployeeCompetencyCapability(empId, compId);
    assertFloat('One skill -> matches capability score', compCap.capabilityScore, 0.8);
    assertFloat('One skill -> matches confidence score', compCap.confidenceScore, 0.9);
    assertString('One skill -> LIMITED sufficiency', compCap.evidenceSufficiency, 'LIMITED');

    // 3. Multiple skills with equal confidence -> normal average
    await cleanup();
    await insertMockSkillState({ capabilityScore: 0.2, confidenceScore: 0.5 });
    await insertMockSkillState({ capabilityScore: 0.8, confidenceScore: 0.5 });
    compCap = await competencyCapabilityService.calculateEmployeeCompetencyCapability(empId, compId);
    assertFloat('Multiple skills equal confidence -> normal average (0.5)', compCap.capabilityScore, 0.5);
    assertFloat('Multiple skills equal confidence -> confidence (0.5)', compCap.confidenceScore, 0.5);
    assertString('Two skills -> MODERATE sufficiency', compCap.evidenceSufficiency, 'MODERATE');

    // 4. Multiple skills with different confidence -> confidence-weighted average
    await cleanup();
    await insertMockSkillState({ capabilityScore: 0.1, confidenceScore: 0.1 }); // low confidence
    await insertMockSkillState({ capabilityScore: 0.9, confidenceScore: 0.9 }); // high confidence
    compCap = await competencyCapabilityService.calculateEmployeeCompetencyCapability(empId, compId);
    // Weighted mean: (0.1*0.1 + 0.9*0.9) / (0.1 + 0.9) = (0.01 + 0.81) / 1.0 = 0.82
    assertFloat('Different confidences -> weighted average correctly skews high (0.82)', compCap.capabilityScore, 0.82);
    // Confidence mean: (0.1 + 0.9) / 2 = 0.5
    assertFloat('Different confidences -> confidence is average (0.5)', compCap.confidenceScore, 0.5);

    // 5/6. Missing / Zero confidence skill is ignored
    await cleanup();
    await insertMockSkillState({ capabilityScore: 0.5, confidenceScore: 1.0 });
    await insertMockSkillState({ capabilityScore: 0.9, confidenceScore: 0.0 }); // zero conf
    await insertMockSkillState({ capabilityScore: null, confidenceScore: 1.0 }); // null cap
    compCap = await competencyCapabilityService.calculateEmployeeCompetencyCapability(empId, compId);
    assertFloat('Missing/Zero-conf skills ignored -> score (0.5)', compCap.capabilityScore, 0.5);
    assertFloat('Missing/Zero-conf skills ignored -> effectiveCount (1)', compCap.effectiveSkillCount, 1);
    assertFloat('Missing/Zero-conf skills ignored -> total skillCount (3)', compCap.skillCount, 3);

    // 8. Proficiency boundaries
    await cleanup();
    await insertMockSkillState({ capabilityScore: 0.20, confidenceScore: 1.0 });
    compCap = await competencyCapabilityService.calculateEmployeeCompetencyCapability(empId, compId);
    assertFloat('Boundary 0.20 -> Level 2', compCap.proficiencyLevel, 2);
    
    await cleanup();
    await insertMockSkillState({ capabilityScore: 0.60, confidenceScore: 1.0 });
    compCap = await competencyCapabilityService.calculateEmployeeCompetencyCapability(empId, compId);
    assertFloat('Boundary 0.60 -> Level 4', compCap.proficiencyLevel, 4);

    // 9. Sufficiency (4+ -> STRONG)
    await cleanup();
    await insertMockSkillState({ capabilityScore: 0.5, confidenceScore: 1.0 });
    await insertMockSkillState({ capabilityScore: 0.5, confidenceScore: 1.0 });
    await insertMockSkillState({ capabilityScore: 0.5, confidenceScore: 1.0 });
    await insertMockSkillState({ capabilityScore: 0.5, confidenceScore: 1.0 });
    compCap = await competencyCapabilityService.calculateEmployeeCompetencyCapability(empId, compId);
    assertString('Four skills -> STRONG sufficiency', compCap.evidenceSufficiency, 'STRONG');

    // 11/12. Recalculation updates same document
    await cleanup();
    await insertMockSkillState({ capabilityScore: 0.5, confidenceScore: 1.0 });
    await competencyCapabilityService.calculateEmployeeCompetencyCapability(empId, compId);
    await competencyCapabilityService.calculateEmployeeCompetencyCapability(empId, compId);
    const docs = await EmployeeCompetencyCapability.find({ employee: empId, competency: compId });
    assertFloat('Upsert avoids duplicates (count = 1)', docs.length, 1);

    await cleanup();

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
