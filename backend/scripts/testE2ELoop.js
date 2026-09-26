require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Employee = require('../src/models/Employee');
const Skill = require('../src/models/Skill');
const Competency = require('../src/models/Competency');
const JobRole = require('../src/models/JobRole');
const evidenceProcessingService = require('../src/services/evidenceProcessingService');
const capabilityAggregationService = require('../src/services/capabilityAggregationService');
const capabilityConfidenceService = require('../src/services/capabilityConfidenceService');
const capabilityTrajectoryService = require('../src/services/capabilityTrajectoryService');
const roleGapService = require('../src/services/roleGapService');
const developmentPriorityService = require('../src/services/developmentPriorityService');
const developmentCopilotService = require('../src/services/developmentCopilotService');
const interventionService = require('../src/services/interventionService');
const capabilityExplanationService = require('../src/services/capabilityExplanationService');
const evidenceConflictService = require('../src/services/evidenceConflictService');

// Mock groq
const groqService = require('../src/services/groqService');
groqService.generateStructuredResponse = async (prompt, keys) => {
  if (keys.includes('recommendations')) {
    return JSON.stringify({
      summary: { developmentObjective: 'Test Obj', whyThisMatters: 'Matters', estimatedTimeframe: '1 month' },
      recommendations: [{ recommendedActions: ['Action'], practiceActivities: ['Practice'], successIndicators: ['Success'] }]
    });
  }
  return "{}";
};

const genericLevels = [
  { level: 1, name: 'L1', description: 'Desc1' },
  { level: 2, name: 'L2', description: 'Desc2' },
  { level: 3, name: 'L3', description: 'Desc3' },
  { level: 4, name: 'L4', description: 'Desc4' },
  { level: 5, name: 'L5', description: 'Desc5' }
];

async function recalculate(employeeId, skillId, roleId) {
    const cap = await capabilityAggregationService.calculateEmployeeSkillCapability(employeeId, skillId);
    await capabilityConfidenceService.updateCapabilityConfidence(employeeId, skillId, cap.capabilityScore, cap.effectiveEvidenceCount || cap.observationCount);
    await capabilityTrajectoryService.updateCapabilityTrajectory(employeeId, skillId);
    if (roleId) await roleGapService.calculateEmployeeRoleGap(employeeId, roleId);
    await developmentPriorityService.calculateEmployeeDevelopmentPriority(employeeId, roleId);
}

async function runE2E() {
  let mongoServer;
  try {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log('Connected to test DB for E2E Loop');

    const comp = new Competency({ name: 'Core Tech', description: 'Tech', category: 'Technical', proficiencyLevels: genericLevels });
    await comp.save();

    const skill = new Skill({ name: 'System Design', description: 'Desc', category: 'Technical', competency: comp._id, proficiencyLevels: genericLevels });
    await skill.save();

    const role = new JobRole({
      title: 'Senior Engineer', department: 'Engineering',
      competencyRequirements: [{ competency: comp._id, requiredLevel: 4, importance: 'CRITICAL' }],
      skillRequirements: [{ skill: skill._id, requiredLevel: 4, importance: 'CRITICAL' }]
    });
    await role.save();

    const employee = new Employee({
      employeeCode: 'EMP-001', firstName: 'John', lastName: 'Doe', email: 'john@example.com',
      department: 'Engineering', jobTitle: 'Engineer', joiningDate: new Date(),
      role: role._id
    });
    await employee.save();

    // 1. Evidence
    console.log('1. Processing Evidence...');
    const d1 = new Date(); d1.setDate(d1.getDate() - 60);
    const d2 = new Date(); d2.setDate(d2.getDate() - 30);
    
    await evidenceProcessingService.processEvidence({
      employee: employee._id, skill: skill._id, competency: comp._id, sourceType: 'MANAGER_FEEDBACK', evidenceKind: 'FEEDBACK',
      title: 'Project Alpha', occurredAt: d1, rawValue: { rating: 3 }, direction: 'POSITIVE'
    });
    
    await evidenceProcessingService.processEvidence({
      employee: employee._id, skill: skill._id, competency: comp._id, sourceType: 'INTERNAL_ASSESSMENT', evidenceKind: 'ASSESSMENT',
      title: 'Q1 Assessment', occurredAt: d2, rawValue: { score: 60 }, direction: 'POSITIVE'
    });

    console.log('2. Recalculating capabilities...');
    await recalculate(employee._id, skill._id, role._id);

    console.log('3. Detecting conflicts...');
    await evidenceConflictService.detectConflicts(employee._id, skill._id);

    console.log('4. Generating explanation...');
    const expl = await capabilityExplanationService.explainCapability(employee._id, skill._id);
    console.log('Explanation:', expl.conclusion);

    console.log('5. Evaluating Development Priorities...');
    const prio = await developmentPriorityService.calculateEmployeeDevelopmentPriority(employee._id, role._id);
    console.log('Priority generated for skill:', prio && prio.priorities.length ? prio.priorities[0].skill.name : 'None (gap might not be big enough)');

    console.log('6. Generating AI Copilot Plan...');
    const plan = await developmentCopilotService.generateEmployeeDevelopmentPlan(employee._id, role._id);
    console.log('AI Plan generated:', !!plan);

    console.log('7. Creating Intervention...');
    const int = await interventionService.createIntervention({
      employeeId: employee._id, jobRoleId: role._id, skillId: skill._id,
      title: 'Advanced System Design Training', status: 'IN_PROGRESS',
      plannedStartDate: new Date(), plannedEndDate: new Date()
    });

    console.log('8. Processing Post-Intervention Evidence...');
    await evidenceProcessingService.processEvidence({
      employee: employee._id, skill: skill._id, competency: comp._id, sourceType: 'INTERNAL_ASSESSMENT', evidenceKind: 'ASSESSMENT', 
      title: 'Post-Training Assessment', occurredAt: new Date(), rawValue: { score: 90 }, direction: 'POSITIVE'
    });

    console.log('9. Recalculating everything post-intervention...');
    await recalculate(employee._id, skill._id, role._id);

    console.log('10. Completing Intervention...');
    const compInt = await interventionService.completeIntervention(int._id);
    console.log('Intervention impact:', compInt.impact.impactStatus, compInt.impact.impactSummary);
    
    console.log('✅ Full E2E loop executed successfully.');
    
    await mongoose.disconnect();
    await mongoServer.stop();
  } catch (err) {
    console.error('❌ E2E Loop failed:', err);
    if (mongoServer) await mongoServer.stop();
    process.exit(1);
  }
}

runE2E();
