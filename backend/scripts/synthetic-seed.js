require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

const Employee = require('../src/models/Employee');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Competency = require('../src/models/Competency');
const JobRole = require('../src/models/JobRole');
const Evidence = require('../src/models/Evidence');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const Team = require('../src/models/Team');
const Intervention = require('../src/models/DevelopmentIntervention');

const evidenceProcessingService = require('../src/services/evidenceProcessingService');
const capabilityAggregationService = require('../src/services/capabilityAggregationService');
const capabilityConfidenceService = require('../src/services/capabilityConfidenceService');
const capabilityTrajectoryService = require('../src/services/capabilityTrajectoryService');
const roleGapService = require('../src/services/roleGapService');
const developmentPriorityService = require('../src/services/developmentPriorityService');
const interventionService = require('../src/services/interventionService');

// Seeded PRNG
let seed = 12345;
function prng() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

const genericLevels = [
  { level: 1, name: 'L1', description: 'Desc1' },
  { level: 2, name: 'L2', description: 'Desc2' },
  { level: 3, name: 'L3', description: 'Desc3' },
  { level: 4, name: 'L4', description: 'Desc4' },
  { level: 5, name: 'L5', description: 'Desc5' }
];

async function generate() {
  const NUM_EMPLOYEES = parseInt(process.argv.includes('--employees') ? process.argv[process.argv.indexOf('--employees') + 1] : 50); 
  
  let mongoServer;
  try {
    const defaultUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/talenttwin';
    try {
        await mongoose.connect(defaultUri, { serverSelectionTimeoutMS: 2000 });
        console.log('Connected to target MongoDB for Synthetic Seeding');
    } catch(err) {
        console.log('Target MongoDB unavailable, using MongoMemoryServer for seed testing');
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    }
    
    await mongoose.connection.db.dropDatabase();
    
    const departments = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing'];
    const roleTitles = ['Junior', 'Mid-Level', 'Senior', 'Lead'];
    
    console.log('Creating Competencies...');
    const comps = [];
    for(let i=0; i<10; i++) comps.push(new Competency({ name: `Competency ${i}`, description: 'Desc', category: 'Technical', proficiencyLevels: genericLevels }));
    const insertedComps = await Competency.insertMany(comps);

    console.log('Creating skills...');
    const skills = [];
    for(let i=0; i<50; i++) skills.push(new Skill({ name: `Skill ${i}`, description: 'Desc', category: 'Technical', competency: insertedComps[i % 10]._id, proficiencyLevels: genericLevels }));
    const insertedSkills = await Skill.insertMany(skills);
    
    console.log('Creating JobRoles...');
    const jobRoles = [];
    for(let i=0; i<20; i++) {
      const dept = departments[i % departments.length];
      const level = roleTitles[i % roleTitles.length];
      
      const reqSkills = [];
      const sIds = new Set();
      while(sIds.size < 5) sIds.add(Math.floor(prng() * 50));
      for (const idx of sIds) reqSkills.push({ skill: insertedSkills[idx]._id, requiredLevel: (i%3)+2, importance: 'HIGH' });
      
      const reqComps = [];
      const cIds = new Set();
      while(cIds.size < 2) cIds.add(Math.floor(prng() * 10));
      for (const idx of cIds) reqComps.push({ competency: insertedComps[idx]._id, requiredLevel: (i%3)+2, importance: 'HIGH' });

      jobRoles.push(new JobRole({ title: `${level} ${dept} Specialist ${i}`, department: dept, skillRequirements: reqSkills, competencyRequirements: reqComps }));
    }
    const insertedRoles = await JobRole.insertMany(jobRoles);
    
    console.log(`Creating ${NUM_EMPLOYEES} employees...`);
    const employees = [];
    const hashedPass = await bcrypt.hash('password123', 10);
    const users = [];

    const teams = await Team.insertMany([
        { name: 'Alpha Team', department: 'Engineering' },
        { name: 'Beta Team', department: 'Product' }
    ]);

    for(let i=0; i<NUM_EMPLOYEES; i++) {
      const role = insertedRoles[i % 20];
      const empId = new mongoose.Types.ObjectId();
      employees.push({
        _id: empId,
        employeeCode: `SYN-${i}`, firstName: `First${i}`, lastName: `Last${i}`,
        department: role.department, jobTitle: role.title, joiningDate: new Date(), role: role._id, team: teams[i%2]._id
      });
      users.push({
        name: `First${i} Last${i}`, email: `user${i}@example.com`, passwordHash: hashedPass, role: 'EMPLOYEE', employeeId: empId
      });
    }
    const insertedEmployees = await Employee.insertMany(employees);
    await User.insertMany(users);
    
    console.log('Generating Evidence...');
    const now = new Date();
    
    for (let i=0; i<insertedEmployees.length; i++) {
      const emp = insertedEmployees[i];
      const scenario = i % 10; // Distribute deliberate scenarios
      
      // We'll pick one main skill for the scenario
      const mainSkill = insertedSkills[i % 50];

      // Generate 1-5 pieces of evidence for the main skill based on scenario
      let records = [];
      
      if (scenario === 0) {
        // 0. IMPROVING (trajectory positive)
        records.push({ offset: 120, val: 0.3 });
        records.push({ offset: 60, val: 0.6 });
        records.push({ offset: 10, val: 0.9 });
      } else if (scenario === 1) {
        // 1. DECLINING (trajectory negative)
        records.push({ offset: 120, val: 0.9 });
        records.push({ offset: 60, val: 0.6 });
        records.push({ offset: 10, val: 0.3 });
      } else if (scenario === 2) {
        // 2. STABLE
        records.push({ offset: 120, val: 0.7 });
        records.push({ offset: 60, val: 0.72 });
        records.push({ offset: 10, val: 0.68 });
      } else if (scenario === 3) {
        // 3. CONFLICTING
        records.push({ offset: 30, val: 0.9, dir: 'POSITIVE' });
        records.push({ offset: 25, val: 0.2, dir: 'NEGATIVE' });
      } else if (scenario === 4) {
        // 4. INSUFFICIENT_EVIDENCE
        records.push({ offset: 30, val: 0.5 }); // Only 1 piece
      } else if (scenario === 5) {
        // 5. SUCCESSFUL_INTERVENTION (Simulated by inserting later)
        records.push({ offset: 120, val: 0.4 });
      } else if (scenario === 6) {
        // 6. MULTI-SOURCE_EVIDENCE
        records.push({ offset: 90, val: 0.8, src: 'MANAGER_FEEDBACK' });
        records.push({ offset: 80, val: 0.85, src: 'PEER_FEEDBACK' });
        records.push({ offset: 70, val: 0.75, src: 'PROJECT' });
      } else if (scenario === 7) {
        // 7. ZERO_NORMALIZED_VALUE (explicitly 0)
        records.push({ offset: 30, val: 0 });
      } else if (scenario === 8) {
        // 8. NULL (NO_QUANTITATIVE_SIGNAL)
        // Handled by omitting rawValue
      } else if (scenario === 9) {
        // 9. HIGH_CONFIDENCE (lots of recent high quality)
        for(let k=0;k<8;k++) records.push({ offset: 10 + k*5, val: 0.8 });
      }

      for(const rec of records) {
         const d = new Date(now); d.setDate(d.getDate() - rec.offset);
         const src = rec.src || 'INTERNAL_ASSESSMENT';
         
         const payload = {
           employee: emp._id, skill: mainSkill._id, competency: mainSkill.competency, 
           sourceType: src, evidenceKind: 'ASSESSMENT', title: `Project ${prng().toFixed(2)}`,
           occurredAt: d, direction: rec.dir || 'POSITIVE', metadata: { reliability: 0.8, relevance: 0.9 }
         };
         
         
         if (rec.val !== undefined) {
           // We are converting a 0-1 rec.val into the correct rawValue shape for the chosen source
           if (src === 'MANAGER_FEEDBACK' || src === 'PEER_FEEDBACK') {
             payload.rawValue = { rating: (rec.val * 4) + 1 };
           } else if (src === 'TRAINING') {
             payload.rawValue = { completionPercent: rec.val * 100 };
           } else if (src === 'KPI') {
             payload.rawValue = { achievementPercent: rec.val * 100 };
           } else if (src === 'INTERNAL_ASSESSMENT' || src === 'ASSESSMENT') {
             payload.rawValue = { score: rec.val * 100 };
           } else if (src === 'PROJECT') {
             payload.rawValue = { projectScore: rec.val * 100 };
           } else {
             payload.rawValue = { score: rec.val * 100 }; // fallback
           }
         }

         
         await evidenceProcessingService.processEvidence(payload);
      }
      
      // Also calculate everything for this employee
      const evs = await Evidence.find({ employee: emp._id });
      const uniqueSkills = [...new Set(evs.map(e => e.skill.toString()))];
      
      for(const sId of uniqueSkills) {
         const cap = await capabilityAggregationService.calculateEmployeeSkillCapability(emp._id, sId);
         await capabilityConfidenceService.updateCapabilityConfidence(emp._id, sId, cap.capabilityScore, cap.effectiveEvidenceCount || cap.observationCount);
         await capabilityTrajectoryService.updateCapabilityTrajectory(emp._id, sId);
      }
      
      await roleGapService.calculateEmployeeRoleGap(emp._id, emp.role);
      await developmentPriorityService.calculateEmployeeDevelopmentPriority(emp._id, emp.role);
      
      // If scenario 5 (SUCCESSFUL_INTERVENTION), create one, process new evidence, complete it
      if (scenario === 5) {
         const int = await interventionService.createIntervention({
            employeeId: emp._id, jobRoleId: emp.role, skillId: mainSkill._id,
            title: 'Upskilling', status: 'IN_PROGRESS', plannedStartDate: new Date(), plannedEndDate: new Date()
         });
         await evidenceProcessingService.processEvidence({
           employee: emp._id, skill: mainSkill._id, competency: mainSkill.competency, sourceType: 'TRAINING', evidenceKind: 'ASSESSMENT', title: `Post Training`,
           occurredAt: now, rawValue: { completionPercent: 90 }, direction: 'POSITIVE'
         });
         const cap = await capabilityAggregationService.calculateEmployeeSkillCapability(emp._id, mainSkill._id);
         await capabilityConfidenceService.updateCapabilityConfidence(emp._id, mainSkill._id, cap.capabilityScore, cap.effectiveEvidenceCount || cap.observationCount);
         await capabilityTrajectoryService.updateCapabilityTrajectory(emp._id, mainSkill._id);
         await interventionService.completeIntervention(int._id);
      }
    }
    
    console.log('✅ Synthetic seeding completed successfully!');
    if (mongoServer) await mongoServer.stop();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

generate();
