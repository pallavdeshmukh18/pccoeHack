require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const aiIntelligenceService = require('../src/services/aiIntelligenceService');
const Employee = require('../src/models/Employee');
const EmployeeSkillCapability = require('../src/models/EmployeeSkillCapability');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');

// Mock groq
const groqService = require('../src/services/groqService');
groqService.generateNaturalLanguage = async (prompt) => {
  return prompt; // Just return prompt so we can assert the context
};

async function testGrounding() {
  let mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const skill1 = await Skill.create({ name: 'System Design', description: 'Desc', category: 'Technical', competency: new mongoose.Types.ObjectId(), proficiencyLevels: [{level:1, name:'L1', description:'D'},{level:2, name:'L2', description:'D'},{level:3, name:'L3', description:'D'},{level:4, name:'L4', description:'D'},{level:5, name:'L5', description:'D'}] });
  const role = await JobRole.create({ title: 'Architect', department: 'Eng', skillRequirements: [{ skill: skill1._id, requiredLevel: 5, importance: 'HIGH' }] });
  const emp = await Employee.create({ employeeCode: 'EMP-AI', firstName: 'Test', lastName: 'User', department: 'Eng', jobTitle: 'Architect', role: role._id, joiningDate: new Date() });
  
  await EmployeeSkillCapability.create({
      employee: emp._id, skill: skill1._id, capabilityScore: null, proficiencyLevel: null,
      confidenceScore: 0, evidenceSufficiency: 'INSUFFICIENT', trajectoryDirection: 'INSUFFICIENT_DATA'
  });

  const promptStr = await aiIntelligenceService.chat(emp._id, "Why is my capability changing?");
  
  if (!promptStr.includes('System Design')) throw new Error('Skill name missing from context');
  if (!promptStr.includes('capabilityScore":null')) throw new Error('Null capability score not passed correctly');
  if (!promptStr.includes('If capabilityScore or proficiencyLevel is null, state explicitly that evidence is insufficient.')) throw new Error('Instruction for null semantics missing');

  console.log('✅ AI Grounding Context verified.');
  
  await mongoose.disconnect();
  await mongoServer.stop();
}

testGrounding();
