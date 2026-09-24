require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../src/models/Employee');
const Skill = require('../src/models/Skill');
const Competency = require('../src/models/Competency');
const Evidence = require('../src/models/Evidence');
const evidenceQualityService = require('../src/services/evidenceQualityService');
const evidenceNormalizationService = require('../src/services/evidenceNormalizationService');

async function seedEvidence() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Fetch existing records
    const employees = await Employee.find();
    if (employees.length < 3) throw new Error('Need at least 3 employees to seed evidence.');
    
    const [alice, bob, charlie] = employees;
    
    const skills = await Skill.find().populate('competency');
    if (skills.length === 0) throw new Error('No skills found in database.');
    
    // Pick a few skills
    const sysDesignSkill = skills.find(s => s.name.includes('System Design')) || skills[0];
    const programmingSkill = skills.find(s => s.name.includes('Programming')) || skills[1];
    const leadershipSkill = skills.find(s => s.name.includes('Leadership')) || skills[2];
    const dataSkill = skills.find(s => s.name.includes('Data')) || skills[3];

    // Clear old evidence (idempotency)
    await Evidence.deleteMany({});
    console.log('Cleared existing evidence.');

    const seedData = [
      // Alice Evidence
      {
        employee: alice._id,
        sourceType: 'INTERNAL_ASSESSMENT',
        sourceId: new mongoose.Types.ObjectId().toString(),
        title: 'System Design Assessment',
        description: 'Completed adaptive System Design assessment with final estimated level 4.',
        skill: sysDesignSkill._id,
        competency: sysDesignSkill.competency._id,
        rawValue: { score: 88, estimatedLevel: 4 },
        metadata: { questionCount: 6, assessmentId: 'abc1234' },
        direction: 'POSITIVE',
        evidenceKind: 'ASSESSMENT'
      },
      {
        employee: alice._id,
        sourceType: 'PROJECT',
        title: 'Payments Microservice Overhaul',
        description: 'Successfully migrated the monolithic payments processor into microservices.',
        skill: programmingSkill._id,
        competency: programmingSkill.competency._id,
        direction: 'POSITIVE',
        evidenceKind: 'OUTCOME'
      },
      {
        employee: alice._id,
        sourceType: 'EXTERNAL_GITHUB',
        sourceReference: 'https://github.com/alice/payments',
        title: 'GitHub Payments Repository',
        description: 'Contributed 14 pull requests to the payments service.',
        skill: programmingSkill._id,
        competency: programmingSkill.competency._id,
        rawValue: { commits: 142, pullRequests: 14 },
        metadata: { language: 'TypeScript', repoType: 'Enterprise' },
        direction: 'POSITIVE',
        evidenceKind: 'ACTIVITY'
      },
      
      // Bob Evidence
      {
        employee: bob._id,
        sourceType: 'MANAGER_FEEDBACK',
        title: 'Q3 Leadership Feedback',
        description: 'Bob demonstrated strong stakeholder management during the chaotic Q3 planning phase.',
        skill: leadershipSkill._id,
        competency: leadershipSkill.competency._id,
        rawValue: { rating: 4, category: 'stakeholder_management' },
        direction: 'POSITIVE',
        evidenceKind: 'FEEDBACK'
      },
      {
        employee: bob._id,
        sourceType: 'PROJECT',
        title: 'Mentorship Program Kickoff',
        description: 'Bob successfully coached three junior developers over 6 months.',
        competency: leadershipSkill.competency._id, // Notice: Skill is deliberately omitted here!
        direction: 'POSITIVE',
        evidenceKind: 'OUTCOME'
      },
      {
        employee: bob._id,
        sourceType: 'TRAINING',
        title: 'Advanced Conflict Resolution Course',
        description: 'Completed internal training course.',
        skill: leadershipSkill._id,
        competency: leadershipSkill.competency._id,
        rawValue: { completionPercent: 100 },
        direction: 'NEUTRAL', // Neutral observation
        evidenceKind: 'ACTIVITY'
      },

      // Charlie Evidence
      {
        employee: charlie._id,
        sourceType: 'INTERNAL_ASSESSMENT',
        title: 'Data Analysis Assessment',
        description: 'Failed to pass the Level 3 threshold for data manipulation.',
        skill: dataSkill._id,
        competency: dataSkill.competency._id,
        rawValue: { score: 42, estimatedLevel: 2 },
        direction: 'NEGATIVE',
        evidenceKind: 'ASSESSMENT'
      },
      {
        employee: charlie._id,
        sourceType: 'EXTERNAL_LEETCODE',
        title: 'LeetCode Weekly Contest',
        description: 'Ranked top 5% in weekly SQL contest.',
        skill: dataSkill._id,
        competency: dataSkill.competency._id,
        rawValue: { problemsSolved: 120, contestRating: 1850 },
        direction: 'POSITIVE',
        evidenceKind: 'ACTIVITY'
      },
      {
        employee: charlie._id,
        sourceType: 'CERTIFICATION',
        title: 'AWS Certified Big Data - Specialty',
        description: 'Completed AWS big data certification.',
        competency: dataSkill.competency._id,
        metadata: { issuer: 'AWS', credentialId: 'AWS-12345' },
        direction: 'POSITIVE',
        evidenceKind: 'CERTIFICATION'
      }
    ];

    const enrichedSeedData = seedData.map(data => {
      let enriched = evidenceQualityService.enrichEvidenceQuality(data);
      return evidenceNormalizationService.enrichEvidenceNormalization(enriched);
    });

    await Evidence.insertMany(enrichedSeedData);
    console.log(`Successfully seeded ${enrichedSeedData.length} evidence records.`);
    
    // Quick validation test of mismatch
    try {
      const invalidEv = new Evidence({
        employee: alice._id,
        sourceType: 'PROJECT',
        title: 'Invalid mismatch test',
        evidenceKind: 'OBSERVATION',
        skill: skills[0]._id, // Skill 0
        competency: skills[skills.length - 1].competency._id // Last skill's competency
      });
      await invalidEv.save();
      console.error('FAIL: Mismatched competency was saved?!');
    } catch (err) {
      console.log('SUCCESS: Mismatched skill/competency properly rejected by pre-save hook.');
    }
    
  } catch (error) {
    console.error('Error seeding evidence:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedEvidence();
