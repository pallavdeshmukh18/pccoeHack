require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const Employee = require('../src/models/Employee');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const EmployeeRoleGap = require('../src/models/EmployeeRoleGap');
const EmployeeDevelopmentPriority = require('../src/models/EmployeeDevelopmentPriority');
const DevelopmentRecommendation = require('../src/models/DevelopmentRecommendation');
const roleGapService = require('../src/services/roleGapService');
const developmentPriorityService = require('../src/services/developmentPriorityService');
const developmentCopilotService = require('../src/services/developmentCopilotService');
const groqService = require('../src/services/groqService');

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- RUNNING PHASE 6B DEVELOPMENT COPILOT TESTS ---\n');

    const empId = new mongoose.Types.ObjectId();
    const roleId = new mongoose.Types.ObjectId();
    let globalSkillIds = [];

    // Setup Employee
    const emp = new Employee({ 
      _id: empId, 
      firstName: 'Test', 
      lastName: 'User', 
      email: 'test@example.com',
      employeeCode: 'EMP123',
      department: 'Engineering',
      jobTitle: 'Developer',
      joiningDate: new Date()
    });
    await emp.save();

    // Mocking Groq Service
    let mockGroqResponse = null;
    const originalGenerate = groqService.generateDevelopmentRecommendations;
    groqService.generateDevelopmentRecommendations = async (context) => {
      if (mockGroqResponse === 'THROW') throw new Error('Network error');
      return mockGroqResponse;
    };

    async function cleanup() {
      await Skill.deleteMany({ _id: { $in: globalSkillIds || [] } });
      await JobRole.deleteMany({ _id: roleId });
      await EmployeeSkillCapability.deleteMany({ employee: empId });
      await EmployeeRoleGap.deleteMany({ employee: empId });
      await EmployeeDevelopmentPriority.deleteMany({ employee: empId });
      await DevelopmentRecommendation.deleteMany({ employee: empId });
    }

    async function setupScenario(scenarios) {
      globalSkillIds = [];
      const skillRequirements = [];

      for (let i = 0; i < scenarios.length; i++) {
        const s = scenarios[i];
        const skill = new Skill({
          competency: new mongoose.Types.ObjectId(),
          name: s.skillName || `Skill ${i}`,
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
        title: 'Test Role',
        department: 'Test',
        description: 'Test Role',
        skillRequirements
      });
      await role.save();

      // Ensure Phase 5E and 6A run
      await roleGapService.calculateEmployeeRoleGap(empId, roleId);
      await developmentPriorityService.calculateEmployeeDevelopmentPriority(empId, roleId);
    }

    function assertCondition(name, condition) {
      if (condition) console.log(`[PASS] ${name}`);
      else console.log(`[FAIL] ${name}`);
    }

    // 1. Successful Mock Response
    await cleanup();
    await setupScenario([
      { skillName: 'React', requiredLevel: 4, currentLevel: 3, importance: 'HIGH' }
    ]);
    mockGroqResponse = {
      overallSummary: 'Good plan',
      developmentPlan: 'Focus on React.',
      recommendations: [
        {
          skillName: 'React',
          developmentObjective: 'Learn React deeply',
          whyThisMatters: 'Important for frontend',
          recommendedActions: ['Read docs'],
          practiceActivities: ['Build app'],
          suggestedProjects: ['Dashboard'],
          successIndicators: ['Pass assessment'],
          estimatedTimeframe: '2 weeks',
          cautions: ['Take time']
        }
      ]
    };
    let plan = await developmentCopilotService.generateEmployeeDevelopmentPlan(empId, roleId);
    assertCondition('Valid AI response is accepted', plan.generationStatus === 'GENERATED');
    assertCondition('Valid AI response is persisted', plan.priorities.length === 1);
    assertCondition('AI cannot modify priorityScore', plan.priorities[0].priorityScore > 0);
    assertCondition('AI cannot modify requiredLevel', plan.priorities[0].requiredLevel === 4);
    assertCondition('AI provides developmentObjective', plan.priorities[0].developmentObjective === 'Learn React deeply');

    // 2. Empty priorities do not call Groq
    await cleanup();
    await setupScenario([
      { skillName: 'React', requiredLevel: 3, currentLevel: 4, importance: 'HIGH' } // MEETS
    ]);
    mockGroqResponse = 'THROW'; // If Groq is called, it will throw
    plan = await developmentCopilotService.generateEmployeeDevelopmentPlan(empId, roleId);
    assertCondition('Empty development priority list does not call Groq', plan.generationStatus === 'GENERATED' && plan.priorities.length === 0);

    // 3. Validation: Array size mismatch
    await cleanup();
    await setupScenario([
      { skillName: 'React', requiredLevel: 4, currentLevel: 3, importance: 'HIGH' }
    ]);
    mockGroqResponse = {
      overallSummary: 'Good plan',
      developmentPlan: 'Focus.',
      recommendations: [] // Missing the skill
    };
    plan = await developmentCopilotService.generateEmployeeDevelopmentPlan(empId, roleId);
    assertCondition('Invalid array length is rejected', plan.generationStatus === 'FAILED');
    assertCondition('Failed generation is safely recorded', plan.errorMessage.includes('Expected 1'));

    // 4. Validation: Duplicate skill
    await cleanup();
    await setupScenario([
      { skillName: 'React', requiredLevel: 4, currentLevel: 3, importance: 'HIGH' },
      { skillName: 'Node', requiredLevel: 4, currentLevel: 3, importance: 'HIGH' }
    ]);
    mockGroqResponse = {
      recommendations: [
        { skillName: 'Node', developmentObjective: '...', whyThisMatters: '...', recommendedActions: [], practiceActivities: [], suggestedProjects: [], successIndicators: [], cautions: [], estimatedTimeframe: '1w' },
        { skillName: 'Node', developmentObjective: '...', whyThisMatters: '...', recommendedActions: [], practiceActivities: [], suggestedProjects: [], successIndicators: [], cautions: [], estimatedTimeframe: '1w' }
      ]
    };
    plan = await developmentCopilotService.generateEmployeeDevelopmentPlan(empId, roleId);
    assertCondition('Order mismatch or unknown skill is rejected', plan.generationStatus === 'FAILED');
    assertCondition('Error message mentions order mismatch', plan.errorMessage.includes('Priority order mismatch'));

    // 5. Schema validation check
    await cleanup();
    await setupScenario([
      { skillName: 'React', requiredLevel: 4, currentLevel: 3, importance: 'HIGH' }
    ]);
    mockGroqResponse = {
      recommendations: [
        {
          skillName: 'React',
          developmentObjective: 123, // Should be string
          whyThisMatters: 'Important for frontend',
          recommendedActions: ['Read docs'],
          practiceActivities: ['Build app'],
          suggestedProjects: ['Dashboard'],
          successIndicators: ['Pass assessment'],
          estimatedTimeframe: '2 weeks',
          cautions: ['Take time']
        }
      ]
    };
    plan = await developmentCopilotService.generateEmployeeDevelopmentPlan(empId, roleId);
    assertCondition('Missing/invalid fields are rejected', plan.generationStatus === 'FAILED');

    // 6. Repeated generation upserts instead of creating duplicates
    await cleanup();
    await setupScenario([{ skillName: 'React', requiredLevel: 4, currentLevel: 3, importance: 'HIGH' }]);
    mockGroqResponse = {
      overallSummary: 'Good plan',
      developmentPlan: 'Focus on React.',
      recommendations: [
        { skillName: 'React', developmentObjective: 'A', whyThisMatters: 'B', recommendedActions: [], practiceActivities: [], suggestedProjects: [], successIndicators: [], cautions: [], estimatedTimeframe: '2w' }
      ]
    };
    await developmentCopilotService.generateEmployeeDevelopmentPlan(empId, roleId);
    await developmentCopilotService.generateEmployeeDevelopmentPlan(empId, roleId);
    const docs = await DevelopmentRecommendation.find({ employee: empId, jobRole: roleId });
    assertCondition('Repeated generation does not create duplicates', docs.length === 1);
    
    // Restore
    groqService.generateDevelopmentRecommendations = originalGenerate;
    await Employee.deleteMany({ _id: empId });
    await cleanup();

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
