require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const EmployeeRoleGap = require('../src/models/EmployeeRoleGap');
const roleGapService = require('../src/services/roleGapService');

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- RUNNING PHASE 5E ROLE GAP TESTS ---\n');

    const empId = new mongoose.Types.ObjectId();
    const roleId = new mongoose.Types.ObjectId();
    
    // Cleanup helper
    async function cleanup() {
      await Skill.deleteMany({ _id: { $in: globalSkillIds || [] } });
      await JobRole.deleteMany({ _id: roleId });
      await EmployeeSkillCapability.deleteMany({ employee: empId });
      await EmployeeRoleGap.deleteMany({ employee: empId });
    }

    let globalSkillIds = [];

    // Helper to insert skill, map to role, and create state
    async function setupScenario(scenarios) {
      globalSkillIds = [];
      const skillRequirements = [];

      for (const s of scenarios) {
        const skill = new Skill({
          competency: new mongoose.Types.ObjectId(),
          name: `Skill ${Math.random()}`,
          description: 'Test',
          category: 'TECHNICAL',
          isActive: true,
          proficiencyLevels: [
            { level: 1, name: 'L1', description: 'L1' },
            { level: 2, name: 'L2', description: 'L2' },
            { level: 3, name: 'L3', description: 'L3' },
            { level: 4, name: 'L4', description: 'L4' },
            { level: 5, name: 'L5', description: 'L5' }
          ]
        });
        await skill.save();
        globalSkillIds.push(skill._id);

        skillRequirements.push({
          skill: skill._id,
          requiredLevel: s.requiredLevel,
          importance: s.importance
        });

        if (s.hasCapability) {
          const cap = new EmployeeSkillCapability({
            employee: empId,
            skill: skill._id,
            proficiencyLevel: s.currentLevel,
            confidenceScore: 0.9,
            trajectoryDirection: s.trajectory || 'STABLE',
            trajectoryVelocity: 0.05
          });
          await cap.save();
        }
      }

      const role = new JobRole({
        _id: roleId,
        title: 'Test Role',
        department: 'Test',
        description: 'Test Role',
        skillRequirements
      });
      await role.save();
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

    // 1. Employee meets all requirements
    await cleanup();
    await setupScenario([
      { requiredLevel: 3, importance: 'HIGH', hasCapability: true, currentLevel: 3 },
      { requiredLevel: 2, importance: 'LOW', hasCapability: true, currentLevel: 5 } // Exceeds
    ]);
    let gap = await roleGapService.calculateEmployeeRoleGap(empId, roleId);
    assertString('All met -> MEETS_REQUIREMENTS', gap.roleStatus, 'MEETS_REQUIREMENTS');
    assertFloat('Meets exact -> gap 0', gap.skills[0].gap, 0);
    assertString('Meets exact -> status MEETS', gap.skills[0].status, 'MEETS');
    assertFloat('Exceeds -> gap -3', gap.skills[1].gap, -3);
    assertString('Exceeds -> status MEETS', gap.skills[1].status, 'MEETS');

    // 2/3. One skill is one level below (NEAR_GAP), one is two below (GAP)
    await cleanup();
    await setupScenario([
      { requiredLevel: 4, importance: 'CRITICAL', hasCapability: true, currentLevel: 3 }, // Gap = 1
      { requiredLevel: 4, importance: 'MEDIUM', hasCapability: true, currentLevel: 2 }  // Gap = 2
    ]);
    gap = await roleGapService.calculateEmployeeRoleGap(empId, roleId);
    assertString('Gaps exist -> HAS_GAPS', gap.roleStatus, 'HAS_GAPS');
    assertFloat('One level below -> gap 1', gap.skills[0].gap, 1);
    assertString('One level below -> NEAR_GAP', gap.skills[0].status, 'NEAR_GAP');
    assertFloat('Two levels below -> gap 2', gap.skills[1].gap, 2);
    assertString('Two levels below -> GAP', gap.skills[1].status, 'GAP');

    // 6/7. Missing capability -> INSUFFICIENT_EVIDENCE (NOT zero!)
    await cleanup();
    await setupScenario([
      { requiredLevel: 3, importance: 'HIGH', hasCapability: false } // No capability state exists
    ]);
    gap = await roleGapService.calculateEmployeeRoleGap(empId, roleId);
    assertString('Missing -> roleStatus INSUFFICIENT_EVIDENCE', gap.roleStatus, 'INSUFFICIENT_EVIDENCE');
    assertString('Missing -> skill status INSUFFICIENT_EVIDENCE', gap.skills[0].status, 'INSUFFICIENT_EVIDENCE');
    assertFloat('Missing -> gap null', gap.skills[0].gap, null);

    // 8. GAP takes precedence over INSUFFICIENT_EVIDENCE
    await cleanup();
    await setupScenario([
      { requiredLevel: 4, importance: 'HIGH', hasCapability: true, currentLevel: 2 }, // GAP
      { requiredLevel: 3, importance: 'LOW', hasCapability: false } // INSUFFICIENT
    ]);
    gap = await roleGapService.calculateEmployeeRoleGap(empId, roleId);
    assertString('Gap + Missing -> roleStatus HAS_GAPS (Precedence)', gap.roleStatus, 'HAS_GAPS');

    // Context preservation
    await cleanup();
    await setupScenario([
      { requiredLevel: 3, importance: 'CRITICAL', hasCapability: true, currentLevel: 2, trajectory: 'IMPROVING' }
    ]);
    gap = await roleGapService.calculateEmployeeRoleGap(empId, roleId);
    assertString('Importance preserved', gap.skills[0].importance, 'CRITICAL');
    assertFloat('Confidence preserved', gap.skills[0].currentConfidenceScore, 0.9);
    assertString('Trajectory direction preserved', gap.skills[0].currentTrajectoryDirection, 'IMPROVING');
    assertFloat('Trajectory velocity preserved', gap.skills[0].currentTrajectoryVelocity, 0.05);

    // Summary counts
    assertFloat('Summary -> totalRequiredSkills', gap.totalRequiredSkills, 1);
    assertFloat('Summary -> nearGapCount', gap.nearGapCount, 1);
    assertFloat('Summary -> gapCount', gap.gapCount, 0);

    // Recalculation -> Upserts rather than duplicates
    await roleGapService.calculateEmployeeRoleGap(empId, roleId);
    const docs = await EmployeeRoleGap.find({ employee: empId, jobRole: roleId });
    assertFloat('Upsert avoids duplicates (count = 1)', docs.length, 1);

    await cleanup();
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
