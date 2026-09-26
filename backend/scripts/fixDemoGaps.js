require('dotenv').config();
const mongoose = require('mongoose');

const Employee = require('../src/models/Employee');
const Skill = require('../src/models/Skill');
const Evidence = require('../src/models/Evidence');

const evidenceProcessingService = require('../src/services/evidenceProcessingService');
const capabilityAggregationService = require('../src/services/capabilityAggregationService');
const evidenceConflictService = require('../src/services/evidenceConflictService');
const capabilityTrajectoryService = require('../src/services/capabilityTrajectoryService');
const competencyCapabilityService = require('../src/services/competencyCapabilityService');
const roleGapService = require('../src/services/roleGapService');
const developmentPriorityService = require('../src/services/developmentPriorityService');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const employee = await Employee.findOne({ firstName: 'Pallav' });
  
  const sysDesign = await Skill.findOne({ name: 'System Design' });
  const swTesting = await Skill.findOne({ name: 'Software Testing' });

  // Delete all existing evidence for these two to recreate them lower
  await Evidence.deleteMany({ employee: employee._id, skill: { $in: [sysDesign._id, swTesting._id] } });

  const getPastDate = (monthsAgo) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    return d;
  };

  const createEvidence = async (skillId, title, sourceType, rawValue, date, isNegative = false) => {
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
  };

  // System Design -> GAP (Required 3, aim for 2 => score ~0.35) -> Improving
  await createEvidence(sysDesign._id, 'Microservices Quiz', 'INTERNAL_ASSESSMENT', { score: 25, maxScore: 100 }, getPastDate(7));
  await createEvidence(sysDesign._id, 'Scaling Architecture', 'PROJECT', { projectScore: 30 }, getPastDate(5));
  await createEvidence(sysDesign._id, 'Manager Feedback H2', 'MANAGER_FEEDBACK', { rating: 2.0, maxRating: 5 }, getPastDate(3));
  await createEvidence(sysDesign._id, 'Sys Design Interview', 'INTERNAL_ASSESSMENT', { score: 38, maxScore: 100 }, getPastDate(1));
  await createEvidence(sysDesign._id, 'Failure Handling Review', 'PROJECT', { projectScore: 15 }, getPastDate(2), true);

  // Software Testing -> GAP (Required 3, aim for 2 => score ~0.30) -> Declining
  await createEvidence(swTesting._id, 'Test Coverage Q2', 'PROJECT', { projectScore: 42 }, getPastDate(8));
  await createEvidence(swTesting._id, 'Testing Assessment', 'INTERNAL_ASSESSMENT', { score: 38, maxScore: 100 }, getPastDate(5));
  await createEvidence(swTesting._id, 'Peer Review Testing', 'PEER_FEEDBACK', { rating: 1.8, maxRating: 5 }, getPastDate(3));
  await createEvidence(swTesting._id, 'Test Coverage Q4', 'PROJECT', { projectScore: 24 }, getPastDate(1), true); // Declining

  for (const s of [sysDesign, swTesting]) {
      await capabilityAggregationService.calculateEmployeeSkillCapability(employee._id, s._id);
      await evidenceConflictService.detectConflicts(employee._id, s._id);
      await capabilityTrajectoryService.calculateTrajectory(employee._id, s._id);
  }

  const Competency = require('../src/models/Competency');
  const comps = await Competency.find();
  for (const c of comps) {
      await competencyCapabilityService.calculateEmployeeCompetencyCapability(employee._id, c._id);
  }

  await roleGapService.calculateEmployeeRoleGap(employee._id, employee.role);
  await developmentPriorityService.calculateEmployeeDevelopmentPriority(employee._id, employee.role);

  console.log('Fixed gaps');
  await mongoose.disconnect();
}

run().catch(console.error);
