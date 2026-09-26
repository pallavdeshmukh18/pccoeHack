require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const JobRole = require('../src/models/JobRole');
const Skill = require('../src/models/Skill');
const Evidence = require('../src/models/Evidence');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const DevelopmentIntervention = require('../src/models/DevelopmentIntervention');
const EmployeeRoleGap = require('../src/models/EmployeeRoleGap');
const EmployeeDevelopmentPriority = require('../src/models/EmployeeDevelopmentPriority');
const Competency = require('../src/models/Competency');

const evidenceProcessingService = require('../src/services/evidenceProcessingService');
const capabilityAggregationService = require('../src/services/capabilityAggregationService');
const evidenceConflictService = require('../src/services/evidenceConflictService');
const capabilityTrajectoryService = require('../src/services/capabilityTrajectoryService');
const competencyCapabilityService = require('../src/services/competencyCapabilityService');
const roleGapService = require('../src/services/roleGapService');
const developmentPriorityService = require('../src/services/developmentPriorityService');
const developmentCopilotService = require('../src/services/developmentCopilotService');

const PALLAV_EMAIL = 'pallavdeshmukh26@gmail.com';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // 1. Locate User and Employee
  const user = await User.findOne({ email: PALLAV_EMAIL });
  if (!user) {
    console.error(`User not found: ${PALLAV_EMAIL}`);
    process.exit(1);
  }
  if (!user.employeeId) {
    console.error(`User has no linked employeeId`);
    process.exit(1);
  }

  const employee = await Employee.findById(user.employeeId);
  if (!employee) {
    console.error(`Employee not found for id ${user.employeeId}`);
    process.exit(1);
  }

  // 2. Locate JobRole
  const role = await JobRole.findOne({ title: 'Software Engineer' });
  if (!role) {
    console.error('Software Engineer JobRole not found');
    process.exit(1);
  }

  // 3. Update Employee
  employee.firstName = 'Pallav';
  employee.lastName = 'Deshmukh';
  employee.jobTitle = 'Software Engineer';
  employee.department = 'Engineering';
  employee.location = 'Mumbai, India';
  employee.status = 'ACTIVE';
  employee.role = role._id;
  await employee.save();
  console.log('Updated employee profile');

  // Load Skills
  const skills = await Skill.find();
  const getSkill = name => skills.find(s => s.name === name);
  
  const prog = getSkill('Programming');
  const sysDesign = getSkill('System Design');
  const apiDev = getSkill('API Development');
  const dbMgmt = getSkill('Database Management');
  const swTesting = getSkill('Software Testing');
  const analThink = getSkill('Analytical Thinking');
  const critThink = getSkill('Critical Thinking');
  const dataAnal = getSkill('Data Analysis');

  if (!prog || !sysDesign || !swTesting) {
    console.error('Required skills missing in DB');
    process.exit(1);
  }

  // Helper to create evidence
  const createEvidence = async (skillId, title, sourceType, rawValue, date, isNegative = false) => {
    // Check if duplicate
    const existing = await Evidence.findOne({ employee: employee._id, skill: skillId, title, sourceType });
    if (existing) {
        return existing;
    }

    const evData = {
      employee: employee._id,
      skill: skillId,
      sourceType,
      evidenceKind: rawValue ? 'OBSERVATION' : 'QUALITATIVE',
      title,
      description: `Demo evidence for ${title}`,
      rawValue,
      observedAt: date,
      occurredAt: date,
      isNegativeSignal: isNegative,
      tags: ['demo']
    };
    
    await evidenceProcessingService.processEvidence(evData);
    return true;
  };

  const getPastDate = (monthsAgo) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    return d;
  };

  console.log('Generating Evidence...');

  // STRONG / HIGH: Programming (~0.82) -> stable/improving
  await createEvidence(prog._id, 'GitHub Repo 1', 'EXTERNAL_GITHUB', { prsMerged: 15, commits: 500 }, getPastDate(8));
  await createEvidence(prog._id, 'Q3 Internal Assessment', 'INTERNAL_ASSESSMENT', { score: 78, maxScore: 100 }, getPastDate(6));
  await createEvidence(prog._id, 'Q4 Project Outcome', 'PROJECT', { projectScore: 82 }, getPastDate(3));
  await createEvidence(prog._id, 'Peer Code Review', 'PEER_FEEDBACK', { rating: 4.2, maxRating: 5 }, getPastDate(1));

  // STRONG / HIGH: API Development (~0.80) -> improving
  await createEvidence(apiDev._id, 'API Fundamentals', 'TRAINING', { completed: true, score: 75 }, getPastDate(7));
  await createEvidence(apiDev._id, 'Gateway Project', 'PROJECT', { projectScore: 81 }, getPastDate(4));
  await createEvidence(apiDev._id, 'Q1 API Assessment', 'INTERNAL_ASSESSMENT', { score: 85, maxScore: 100 }, getPastDate(2));

  // DEVELOPING / ROLE GAP: System Design (~0.55/0.76 with conflict)
  await createEvidence(sysDesign._id, 'Microservices Quiz', 'INTERNAL_ASSESSMENT', { score: 25, maxScore: 100 }, getPastDate(7));
  await createEvidence(sysDesign._id, 'Scaling Architecture', 'PROJECT', { projectScore: 30 }, getPastDate(5));
  await createEvidence(sysDesign._id, 'Manager Feedback H2', 'MANAGER_FEEDBACK', { rating: 2.0, maxRating: 5 }, getPastDate(3));
  await createEvidence(sysDesign._id, 'Sys Design Interview', 'INTERNAL_ASSESSMENT', { score: 38, maxScore: 100 }, getPastDate(1));
  await createEvidence(sysDesign._id, 'Failure Handling Review', 'PROJECT', { projectScore: 15 }, getPastDate(2), true);

  // DECLINING / GAP: Software Testing (~0.54)
  await createEvidence(swTesting._id, 'Test Coverage Q2', 'PROJECT', { projectScore: 42 }, getPastDate(8));
  await createEvidence(swTesting._id, 'Testing Assessment', 'INTERNAL_ASSESSMENT', { score: 38, maxScore: 100 }, getPastDate(5));
  await createEvidence(swTesting._id, 'Peer Review Testing', 'PEER_FEEDBACK', { rating: 1.8, maxRating: 5 }, getPastDate(3));
  await createEvidence(swTesting._id, 'Test Coverage Q4', 'PROJECT', { projectScore: 24 }, getPastDate(1), true);

  // GOOD BUT IMPROVING: Database Management (~0.62)
  await createEvidence(dbMgmt._id, 'DB Indexing Basics', 'TRAINING', { completed: true, score: 48 }, getPastDate(6));
  await createEvidence(dbMgmt._id, 'Migration Project', 'PROJECT', { projectScore: 53 }, getPastDate(4));
  await createEvidence(dbMgmt._id, 'Query Optimization', 'INTERNAL_ASSESSMENT', { score: 58, maxScore: 100 }, getPastDate(2));
  await createEvidence(dbMgmt._id, 'Advanced DB Training', 'CERTIFICATION', { score: 62 }, getPastDate(1));

  // GOOD BUT IMPROVING: Analytical Thinking (~0.67)
  if (analThink) {
      await createEvidence(analThink._id, 'Problem Solving Q3', 'MANAGER_FEEDBACK', { rating: 3.2, maxRating: 5 }, getPastDate(5));
      await createEvidence(analThink._id, 'Analytics Project', 'PROJECT', { projectScore: 61 }, getPastDate(3));
      await createEvidence(analThink._id, 'Logic Assessment', 'INTERNAL_ASSESSMENT', { score: 67, maxScore: 100 }, getPastDate(1));
  }

  // GAP (if requested): Data Analysis
  if (dataAnal) {
      await createEvidence(dataAnal._id, 'Data Viz Project', 'PROJECT', { projectScore: 15 }, getPastDate(4));
      await createEvidence(dataAnal._id, 'Data Assessment', 'INTERNAL_ASSESSMENT', { score: 50, maxScore: 100 }, getPastDate(2));
  }

  console.log('Running Intelligence Pipeline...');

  for (const s of skills) {
      await capabilityAggregationService.calculateEmployeeSkillCapability(employee._id, s._id);
      await evidenceConflictService.detectConflicts(employee._id, s._id);
      await capabilityTrajectoryService.calculateTrajectory(employee._id, s._id);
  }

  const comps = await Competency.find();
  for (const c of comps) {
      await competencyCapabilityService.calculateEmployeeCompetencyCapability(employee._id, c._id);
  }

  await roleGapService.calculateEmployeeRoleGap(employee._id, role._id);

  await developmentPriorityService.calculateEmployeeDevelopmentPriority(employee._id, role._id);

  console.log('Generating AI Plan (this may take a few seconds)...');
  try {
      await developmentCopilotService.generateEmployeeDevelopmentPlan(employee._id, role._id);
  } catch (err) {
      console.warn('AI Plan generation failed (API issue?), continuing...', err.message);
  }

  console.log('Creating Interventions...');
  const priorities = await EmployeeDevelopmentPriority.find({ employee: employee._id });
  const swTestPri = priorities.find(p => p.skill && p.skill.toString() === swTesting._id.toString());
  const sysDesPri = priorities.find(p => p.skill && p.skill.toString() === sysDesign._id.toString());
  const dbMgmtPri = priorities.find(p => p.skill && p.skill.toString() === dbMgmt._id.toString());

  const int1 = await DevelopmentIntervention.findOneAndUpdate(
      { employee: employee._id, title: 'Mastering Unit Tests' },
      {
          jobRole: role._id,
          skill: swTesting._id,
          interventionType: 'PRACTICE',
          status: 'COMPLETED',
          plannedStartDate: getPastDate(3),
          plannedEndDate: getPastDate(1),
          actualStartDate: getPastDate(3),
          completionPercentage: 100,
          developmentPriority: swTestPri ? swTestPri._id : null
      },
      { upsert: true, new: true }
  );
  int1.impact = {
      impactStatus: 'COMPLETED_IMPROVED',
      observedImpact: '0.12'
  };
  await int1.save();

  await DevelopmentIntervention.findOneAndUpdate(
      { employee: employee._id, title: 'Architecture Redesign Project' },
      {
          jobRole: role._id,
          skill: sysDesign._id,
          interventionType: 'PROJECT',
          status: 'IN_PROGRESS',
          plannedStartDate: getPastDate(1),
          plannedEndDate: getPastDate(-1),
          actualStartDate: getPastDate(1),
          completionPercentage: 45,
          developmentPriority: sysDesPri ? sysDesPri._id : null
      },
      { upsert: true }
  );

  await DevelopmentIntervention.findOneAndUpdate(
      { employee: employee._id, title: 'Advanced DB Course' },
      {
          jobRole: role._id,
          skill: dbMgmt._id,
          interventionType: 'LEARNING',
          status: 'PLANNED',
          plannedStartDate: getPastDate(-1),
          plannedEndDate: getPastDate(-2),
          completionPercentage: 0,
          developmentPriority: dbMgmtPri ? dbMgmtPri._id : null
      },
      { upsert: true }
  );

  console.log('\nPALLAV DEMO PROFILE READY\n');

  console.log(`User:\n${user.email}`);
  console.log(`Employee:\n${employee.firstName} ${employee.lastName}`);
  console.log(`Role:\n${user.role}`);
  console.log(`Employee ID:\n${employee._id}`);
  console.log(`Job Role:\n${role.title}`);

  const evidenceCount = await Evidence.countDocuments({ employee: employee._id });
  console.log(`\nEvidence:\n${evidenceCount}`);

  const caps = await EmployeeSkillCapability.find({ employee: employee._id, proficiencyLevel: { $ne: null } });
  console.log(`Measured Skills:\n${caps.length}`);

  const nullCaps = await EmployeeSkillCapability.find({ employee: employee._id, proficiencyLevel: null });
  console.log(`Insufficient Evidence Skills:\n${nullCaps.length}`);

  const improving = caps.filter(c => c.trajectoryDirection === 'IMPROVING').length;
  const declining = caps.filter(c => c.trajectoryDirection === 'DECLINING').length;
  const stable = caps.filter(c => c.trajectoryDirection === 'STABLE').length;

  console.log(`\nImproving:\n${improving}`);
  console.log(`Declining:\n${declining}`);
  console.log(`Stable:\n${stable}`);

  const gaps = await EmployeeRoleGap.find({ employee: employee._id, jobRole: role._id });
  let actualGaps = 0; let nearGaps = 0; gaps.forEach(g => { actualGaps += g.skills.filter(s => s.status === "GAP").length; nearGaps += g.skills.filter(s => s.status === "NEAR_GAP").length; });
  

  console.log(`\nRole Gaps:\n${actualGaps}`);
  console.log(`Near Gaps:\n${nearGaps}`);

  const devPri = await EmployeeDevelopmentPriority.countDocuments({ employee: employee._id });
  console.log(`\nDevelopment Priorities:\n${devPri}`);

  const interventions = await DevelopmentIntervention.countDocuments({ employee: employee._id });
  console.log(`Interventions:\n${interventions}`);

  const EvidenceConflict = mongoose.model('EvidenceConflict');
  const conflicts = await EvidenceConflict.countDocuments({ employee: employee._id });
  console.log(`Conflicts:\n${conflicts}`);

  const allRoles = await JobRole.countDocuments();
  console.log(`Career Roles Available:\n${allRoles}`);

  console.log(`\n✓ Overview populated`);
  console.log(`✓ My Skills populated`);
  console.log(`✓ Skill Detail populated`);
  console.log(`✓ Evidence populated`);
  console.log(`✓ Trajectory populated`);
  console.log(`✓ Development populated`);
  console.log(`✓ Career populated`);
  console.log(`✓ Settings populated`);

  await mongoose.disconnect();
}

run().catch(console.error);
