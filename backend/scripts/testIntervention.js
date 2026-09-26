require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const Employee = require('../src/models/Employee');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const DevelopmentRecommendation = require('../src/models/DevelopmentRecommendation');
const DevelopmentIntervention = require('../src/models/DevelopmentIntervention');
const interventionService = require('../src/services/interventionService');

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- RUNNING PHASE 6C INTERVENTION TESTS ---\n');

    const empId = new mongoose.Types.ObjectId();
    const roleId = new mongoose.Types.ObjectId();
    const skillId = new mongoose.Types.ObjectId();

    // Setup Mock Data
    const emp = new Employee({
      _id: empId,
      firstName: 'Test',
      lastName: 'User',
      email: `test${Math.random()}@example.com`,
      employeeCode: `EMP${Math.random()}`,
      department: 'Engineering',
      jobTitle: 'Developer',
      joiningDate: new Date()
    });
    await emp.save();

    const role = new JobRole({
      _id: roleId,
      title: `Test Role ${Math.random()}`,
      department: 'Test',
      description: 'Test Role',
      skillRequirements: [{ skill: skillId, requiredLevel: 3, importance: 'HIGH' }]
    });
    await role.save();

    const skill = new Skill({
      _id: skillId,
      competency: new mongoose.Types.ObjectId(),
      name: `System Design ${Math.random()}`,
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

    const recId = new mongoose.Types.ObjectId();
    const rec = new DevelopmentRecommendation({
      _id: recId,
      employee: empId,
      jobRole: roleId,
      generationStatus: 'GENERATED'
    });
    await rec.save();

    async function cleanup() {
      await EmployeeSkillCapability.deleteMany({ employee: empId });
      await DevelopmentIntervention.deleteMany({ employee: empId });
    }

    function assertCondition(name, condition) {
      if (condition) console.log(`[PASS] ${name}`);
      else console.log(`[FAIL] ${name}`);
    }

    // 1. Intervention Creation & Baseline Snapshot
    await cleanup();
    const cap1 = new EmployeeSkillCapability({
      employee: empId,
      skill: skillId,
      capabilityScore: 0.4,
      proficiencyLevel: 2,
      confidenceScore: 0.8,
      trajectoryDirection: 'STABLE',
      trajectoryVelocity: 0,
      evidenceCount: 3,
      effectiveEvidenceCount: 3
    });
    await cap1.save();

    let inv = await interventionService.createIntervention({
      employeeId: empId,
      jobRoleId: roleId,
      skillId: skillId,
      developmentRecommendationId: recId,
      title: 'Study System Design',
      interventionType: 'LEARNING',
      status: 'IN_PROGRESS'
    });

    assertCondition('Intervention creation succeeds', inv != null);
    assertCondition('Baseline snapshot captured on creation', inv.baselineSnapshot != null);
    assertCondition('Baseline matches current capability', inv.baselineSnapshot.capabilityScore === 0.4);
    assertCondition('Recommendation reference validation works', inv.developmentRecommendation.toString() === recId.toString());
    assertCondition('In-progress intervention -> IN_PROGRESS', inv.impact.impactStatus === 'IN_PROGRESS');

    // 2. Baseline Immutability
    // Change underlying capability
    cap1.capabilityScore = 0.6;
    await cap1.save();
    
    // Fetch intervention again
    inv = await interventionService.getIntervention(inv._id);
    assertCondition('Baseline snapshot does not change after capability changes', inv.baselineSnapshot.capabilityScore === 0.4);
    
    // 3. Completion & Impact Deltas (COMPLETED_IMPROVED)
    // cap1 is now 0.6
    inv = await interventionService.completeIntervention(inv._id);
    assertCondition('Completion captures post-intervention snapshot', inv.postInterventionSnapshot != null);
    assertCondition('Capability delta is correct', Math.abs(inv.impact.capabilityScoreDelta - 0.2) < 0.0001);
    assertCondition('Completed positive capability delta -> COMPLETED_IMPROVED', inv.impact.impactStatus === 'COMPLETED_IMPROVED');
    assertCondition('Causal language is not used in generated impact summaries', !inv.impact.impactSummary.includes('caused') && inv.impact.impactSummary.includes('Observed capability increased'));
    assertCondition('Completion percentage is 100', inv.completionPercentage === 100);

    // 4. Repeated completion doesn't corrupt baseline
    inv = await interventionService.completeIntervention(inv._id);
    assertCondition('Repeated completion does not corrupt the baseline', inv.baselineSnapshot.capabilityScore === 0.4);

    // 5. Completion Negative Delta (COMPLETED_DECLINED)
    await cleanup();
    const cap2 = new EmployeeSkillCapability({
      employee: empId,
      skill: skillId,
      capabilityScore: 0.8
    });
    await cap2.save();
    
    inv = await interventionService.createIntervention({
      employeeId: empId,
      jobRoleId: roleId,
      skillId: skillId,
      title: 'Practice',
      interventionType: 'PRACTICE'
    });
    assertCondition('Intervention can be created without AI recommendation', inv.developmentRecommendation == null);

    cap2.capabilityScore = 0.5; // Decreased
    await cap2.save();

    inv = await interventionService.completeIntervention(inv._id);
    assertCondition('Completed negative capability delta -> COMPLETED_DECLINED', inv.impact.impactStatus === 'COMPLETED_DECLINED');

    // 6. Missing Baseline (COMPLETED_INCONCLUSIVE)
    await cleanup();
    // No capability state exists initially
    inv = await interventionService.createIntervention({
      employeeId: empId,
      jobRoleId: roleId,
      skillId: skillId,
      title: 'Assess',
      interventionType: 'ASSESSMENT'
    });
    
    const cap3 = new EmployeeSkillCapability({
      employee: empId,
      skill: skillId,
      capabilityScore: 0.9
    });
    await cap3.save();

    inv = await interventionService.completeIntervention(inv._id);
    assertCondition('Missing baseline capability -> COMPLETED_INCONCLUSIVE', inv.impact.impactStatus === 'COMPLETED_INCONCLUSIVE');

    // 7. Validation rules
    let failed = false;
    try {
      await interventionService.createIntervention({
        employeeId: new mongoose.Types.ObjectId(), // Invalid
        jobRoleId: roleId,
        skillId: skillId,
        title: 'X',
        interventionType: 'OTHER'
      });
    } catch (e) {
      failed = true;
    }
    assertCondition('Invalid employee is rejected', failed);

    // Update validation
    inv = await interventionService.createIntervention({
      employeeId: empId,
      jobRoleId: roleId,
      skillId: skillId,
      title: 'Y',
      interventionType: 'OTHER'
    });
    
    failed = false;
    try {
      await interventionService.updateIntervention(inv._id, {
        actualStartDate: '2025-01-02',
        actualEndDate: '2025-01-01' // Precedes start
      });
    } catch (e) {
      failed = true;
    }
    assertCondition('actualEndDate cannot precede actualStartDate', failed);
    
    inv = await interventionService.updateIntervention(inv._id, { employeeFeedback: 'Great' });
    assertCondition('Employee feedback does not affect capability', inv.impact.impactStatus === 'NOT_STARTED');

    // Cleanup
    await Employee.deleteMany({ _id: empId });
    await JobRole.deleteMany({ _id: roleId });
    await Skill.deleteMany({ _id: skillId });
    await DevelopmentRecommendation.deleteMany({ _id: recId });
    await cleanup();

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
