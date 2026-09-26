require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const EmployeeRoleGap = require('../src/models/EmployeeRoleGap');
const EmployeeDevelopmentPriority = require('../src/models/EmployeeDevelopmentPriority');
const roleGapService = require('../src/services/roleGapService');
const developmentPriorityService = require('../src/services/developmentPriorityService');

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- RUNNING PHASE 6A DEVELOPMENT PRIORITY TESTS ---\n');

    const empId = new mongoose.Types.ObjectId();
    const roleId = new mongoose.Types.ObjectId();
    let globalSkillIds = [];

    async function cleanup() {
      await Skill.deleteMany({ _id: { $in: globalSkillIds || [] } });
      await JobRole.deleteMany({ _id: roleId });
      await EmployeeSkillCapability.deleteMany({ employee: empId });
      await EmployeeRoleGap.deleteMany({ employee: empId });
      await EmployeeDevelopmentPriority.deleteMany({ employee: empId });
    }

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

        if (s.hasCapability !== false) {
          const cap = new EmployeeSkillCapability({
            employee: empId,
            skill: skill._id,
            proficiencyLevel: s.currentLevel,
            confidenceScore: s.confidence || 0.9,
            trajectoryDirection: s.trajectory || 'STABLE',
            trajectoryVelocity: 0.05,
            evidenceSufficiency: s.evidenceSufficiency || 'STRONG'
          });
          await cap.save();
        }
      }

      const role = new JobRole({
        _id: roleId,
        title: `Test Role ${Math.random()}`,
        department: 'Test',
        description: 'Test Role',
        skillRequirements
      });
      await role.save();

      // Ensure Phase 5E gap is populated
      await roleGapService.calculateEmployeeRoleGap(empId, roleId);
    }

    function assertFloat(name, actual, expected) {
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

    // 1. MEETS / INSUFFICIENT excluded. NEAR_GAP / GAP included.
    await cleanup();
    await setupScenario([
      { requiredLevel: 3, currentLevel: 3, importance: 'HIGH' }, // MEETS -> Excluded
      { requiredLevel: 3, hasCapability: false, importance: 'HIGH' }, // INSUFFICIENT -> Excluded
      { requiredLevel: 3, currentLevel: 2, importance: 'HIGH' }, // NEAR_GAP -> Included
      { requiredLevel: 4, currentLevel: 2, importance: 'HIGH' }  // GAP -> Included
    ]);
    let dp = await developmentPriorityService.calculateEmployeeDevelopmentPriority(empId, roleId);
    assertFloat('MEETS and INSUFFICIENT excluded', dp.priorities.length, 2);
    assertFloat('Summary counts exclude INSUFFICIENT from needs', dp.confirmedDevelopmentNeeds, 2);
    assertFloat('Summary tracks INSUFFICIENT separately', dp.insufficientEvidenceCount, 1);
    assertFloat('Summary tracks MEETS separately', dp.meetsCount, 1);

    // 2. Score mapping tests
    await cleanup();
    await setupScenario([
      { 
        requiredLevel: 5, currentLevel: 1, importance: 'CRITICAL', 
        confidence: 1.0, trajectory: 'DECLINING', evidenceSufficiency: 'STRONG' 
      }
    ]);
    dp = await developmentPriorityService.calculateEmployeeDevelopmentPriority(empId, roleId);
    const p = dp.priorities[0];
    assertFloat('Gap Severity maps to 1.0 (gap = 4)', p.priorityFactors.gapSeverity, 1.0);
    assertFloat('Importance maps to 1.0 (CRITICAL)', p.priorityFactors.importance, 1.0);
    assertFloat('Confidence maps to 1.0', p.priorityFactors.confidence, 1.0);
    assertFloat('Trajectory maps to 1.0 (DECLINING)', p.priorityFactors.trajectory, 1.0);
    assertFloat('Sufficiency maps to 1.0 (STRONG)', p.priorityFactors.evidenceSufficiency, 1.0);
    
    // priority = 0.3(1) + 0.25(1) + 0.2(1) + 0.15(1) + 0.10(1) = 1.0
    assertFloat('Final priority score calculates perfectly', p.priorityScore, 1.0);
    assertString('Level maps to CRITICAL', p.priorityLevel, 'CRITICAL');
    assertString('Priority Reason generates correctly', p.priorityReason, 'Current capability is 4 level(s) below the required level of 5. This is a critical-priority role requirement. We have high confidence in this capability gap. The skill is currently declining, making intervention urgent.');

    // 3. Sorting tests
    await cleanup();
    await setupScenario([
      { requiredLevel: 4, currentLevel: 3, importance: 'LOW', confidence: 0.1, trajectory: 'IMPROVING', evidenceSufficiency: 'LIMITED' },
      { requiredLevel: 5, currentLevel: 2, importance: 'HIGH', confidence: 0.9, trajectory: 'STABLE', evidenceSufficiency: 'STRONG' }
    ]);
    dp = await developmentPriorityService.calculateEmployeeDevelopmentPriority(empId, roleId);
    assertFloat('Sorts highest priority score to top', dp.priorities.length, 2);
    if (dp.priorities[0].priorityScore > dp.priorities[1].priorityScore) {
      console.log(`[PASS] Sorting correct`);
    } else {
      console.log(`[FAIL] Sorting failed`);
    }
    
    // 4. Upsert avoids duplicates
    await developmentPriorityService.calculateEmployeeDevelopmentPriority(empId, roleId);
    const docs = await EmployeeDevelopmentPriority.find({ employee: empId, jobRole: roleId });
    assertFloat('Upsert avoids duplicates (count = 1)', docs.length, 1);

    await cleanup();
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
