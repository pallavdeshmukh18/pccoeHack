require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Competency = require('../src/models/Competency');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');

const MONGO_URI = process.env.MONGO_URI;

// Helper to generate generic proficiency levels for Competencies (Phase 2 requirement preserved)
const genericLevels = [
  { level: 1, name: 'Foundational', description: 'Basic understanding and ability' },
  { level: 2, name: 'Developing', description: 'Working knowledge and application' },
  { level: 3, name: 'Proficient', description: 'Solid practical experience and execution' },
  { level: 4, name: 'Advanced', description: 'Deep expertise and ability to guide others' },
  { level: 5, name: 'Expert', description: 'Industry-leading mastery and strategic vision' }
];

const seedCompetenciesData = [
  { name: 'Technical Expertise', description: 'Mastery of technical and engineering disciplines', category: 'Technical' },
  { name: 'Problem Solving', description: 'Ability to analyze and solve problems efficiently', category: 'Cognitive' },
  { name: 'Communication', description: 'Effective information sharing and articulation', category: 'Interpersonal' },
  { name: 'Leadership', description: 'Guiding, mentoring, and inspiring others', category: 'Leadership' },
  { name: 'Collaboration', description: 'Working seamlessly across teams', category: 'Interpersonal' },
  { name: 'Data & Analytical Thinking', description: 'Extracting and interpreting insights from data', category: 'Cognitive' },
  { name: 'Adaptability', description: 'Adjusting to new challenges and environments', category: 'Personal' },
  { name: 'Execution & Ownership', description: 'Delivering results and taking responsibility', category: 'Execution' }
].map(c => ({ ...c, proficiencyLevels: genericLevels }));

const seedEmployees = [
  { employeeCode: 'EMP001', firstName: 'Alice', lastName: 'Smith', department: 'Engineering', jobTitle: 'Software Engineer', joiningDate: new Date('2022-01-15') },
  { employeeCode: 'EMP002', firstName: 'Bob', lastName: 'Johnson', department: 'Engineering', jobTitle: 'Senior Software Engineer', joiningDate: new Date('2020-06-01') },
  { employeeCode: 'EMP003', firstName: 'Charlie', lastName: 'Davis', department: 'Data Science', jobTitle: 'Data Scientist', joiningDate: new Date('2021-03-10') },
  { employeeCode: 'EMP004', firstName: 'Diana', lastName: 'Miller', department: 'Product', jobTitle: 'Product Manager', joiningDate: new Date('2019-11-20') },
  { employeeCode: 'EMP005', firstName: 'Eve', lastName: 'Wilson', department: 'Design', jobTitle: 'UX Designer', joiningDate: new Date('2023-05-05') }
];

async function runSeed() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is not defined in .env file');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Competency.deleteMany({}),
      Skill.deleteMany({}),
      JobRole.deleteMany({})
    ]);

    // Insert Competencies
    console.log('Inserting competencies...');
    const insertedCompetencies = await Competency.insertMany(seedCompetenciesData);
    
    const getCompId = (name) => insertedCompetencies.find(c => c.name === name)._id;

    // Build skills data
    const skillsData = [
      // Technical Expertise
      {
        name: 'Programming',
        description: 'Writing efficient, clean, and maintainable code',
        competency: getCompId('Technical Expertise'),
        category: 'Engineering',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Can read and write basic code syntax.' },
          { level: 2, name: 'Developing', description: 'Writes functional code for simple features.' },
          { level: 3, name: 'Proficient', description: 'Writes clean, tested code for complex features.' },
          { level: 4, name: 'Advanced', description: 'Establishes coding standards and optimizes performance.' },
          { level: 5, name: 'Expert', description: 'Architects core frameworks and solves critical low-level issues.' }
        ]
      },
      {
        name: 'System Design',
        description: 'Architecting scalable software systems',
        competency: getCompId('Technical Expertise'),
        category: 'Engineering',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Understands basic architectural concepts and common system components.' },
          { level: 2, name: 'Developing', description: 'Can design simple systems with guidance and explain basic architectural choices.' },
          { level: 3, name: 'Proficient', description: 'Can independently design moderately complex systems and explain major trade-offs.' },
          { level: 4, name: 'Advanced', description: 'Can design complex scalable systems and evaluate architecture, reliability, and performance trade-offs.' },
          { level: 5, name: 'Expert', description: 'Can architect highly complex distributed systems and establish architectural practices for others.' }
        ]
      },
      {
        name: 'Database Management',
        description: 'Designing and optimizing databases',
        competency: getCompId('Technical Expertise'),
        category: 'Engineering',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Knows basic SQL/NoSQL queries.' },
          { level: 2, name: 'Developing', description: 'Designs simple schemas and writes standard queries.' },
          { level: 3, name: 'Proficient', description: 'Optimizes queries and designs complex normalized schemas.' },
          { level: 4, name: 'Advanced', description: 'Manages database scaling, replication, and indexing strategies.' },
          { level: 5, name: 'Expert', description: 'Architects multi-region database topologies and designs custom data engines.' }
        ]
      },
      {
        name: 'API Development',
        description: 'Creating robust and secure APIs',
        competency: getCompId('Technical Expertise'),
        category: 'Engineering',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Understands HTTP methods and status codes.' },
          { level: 2, name: 'Developing', description: 'Builds basic RESTful endpoints.' },
          { level: 3, name: 'Proficient', description: 'Designs well-structured, secure, and documented APIs.' },
          { level: 4, name: 'Advanced', description: 'Implements rate limiting, caching, and advanced security.' },
          { level: 5, name: 'Expert', description: 'Architects API gateways and sets organizational API standards.' }
        ]
      },
      {
        name: 'Software Testing',
        description: 'Ensuring software quality and reliability',
        competency: getCompId('Technical Expertise'),
        category: 'Engineering',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Can write simple unit tests.' },
          { level: 2, name: 'Developing', description: 'Writes integration tests and understands mocking.' },
          { level: 3, name: 'Proficient', description: 'Implements comprehensive test suites and TDD methodologies.' },
          { level: 4, name: 'Advanced', description: 'Builds automated CI/CD testing pipelines and performance tests.' },
          { level: 5, name: 'Expert', description: 'Designs organization-wide testing frameworks and chaos engineering strategies.' }
        ]
      },
      
      // Problem Solving
      {
        name: 'Critical Thinking',
        description: 'Objectively analyzing information to form a judgment',
        competency: getCompId('Problem Solving'),
        category: 'Cognitive',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Questions surface-level assumptions.' },
          { level: 2, name: 'Developing', description: 'Identifies biases and logical fallacies in standard situations.' },
          { level: 3, name: 'Proficient', description: 'Deconstructs complex arguments and synthesizes multiple perspectives.' },
          { level: 4, name: 'Advanced', description: 'Applies rigorous logic to highly ambiguous problems.' },
          { level: 5, name: 'Expert', description: 'Establishes frameworks that elevate the critical thinking of the entire organization.' }
        ]
      },
      {
        name: 'Analytical Thinking',
        description: 'Breaking down complex problems into manageable parts',
        competency: getCompId('Problem Solving'),
        category: 'Cognitive',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Can break down simple tasks.' },
          { level: 2, name: 'Developing', description: 'Identifies root causes of basic issues.' },
          { level: 3, name: 'Proficient', description: 'Analyzes multi-faceted problems systematically.' },
          { level: 4, name: 'Advanced', description: 'Models complex scenarios to forecast outcomes.' },
          { level: 5, name: 'Expert', description: 'Pioneers new analytical methodologies for the industry.' }
        ]
      },
      {
        name: 'Decision Making',
        description: 'Making informed choices effectively',
        competency: getCompId('Problem Solving'),
        category: 'Leadership',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Makes routine decisions based on rules.' },
          { level: 2, name: 'Developing', description: 'Makes operational decisions considering basic trade-offs.' },
          { level: 3, name: 'Proficient', description: 'Makes strategic decisions under time pressure.' },
          { level: 4, name: 'Advanced', description: 'Makes high-stakes decisions with incomplete information.' },
          { level: 5, name: 'Expert', description: 'Navigates existential business decisions and defines decision-making culture.' }
        ]
      },

      // Communication
      {
        name: 'Written Communication',
        description: 'Conveying information clearly through text',
        competency: getCompId('Communication'),
        category: 'Interpersonal',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Writes clear emails and messages.' },
          { level: 2, name: 'Developing', description: 'Drafts coherent project updates and basic documentation.' },
          { level: 3, name: 'Proficient', description: 'Creates comprehensive technical docs and persuasive proposals.' },
          { level: 4, name: 'Advanced', description: 'Authors strategic communications and policy documents.' },
          { level: 5, name: 'Expert', description: 'Shapes organizational voice and writes industry-leading publications.' }
        ]
      },
      {
        name: 'Verbal Communication',
        description: 'Expressing ideas clearly through speech',
        competency: getCompId('Communication'),
        category: 'Interpersonal',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Speaks clearly in 1:1 settings.' },
          { level: 2, name: 'Developing', description: 'Contributes effectively in team meetings.' },
          { level: 3, name: 'Proficient', description: 'Leads meetings and articulates complex ideas succinctly.' },
          { level: 4, name: 'Advanced', description: 'Facilitates difficult conversations and negotiations.' },
          { level: 5, name: 'Expert', description: 'Inspires large audiences and represents the company externally.' }
        ]
      },
      {
        name: 'Presentation',
        description: 'Delivering compelling presentations',
        competency: getCompId('Communication'),
        category: 'Interpersonal',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Presents basic information to peers.' },
          { level: 2, name: 'Developing', description: 'Delivers structured presentations to the team.' },
          { level: 3, name: 'Proficient', description: 'Engages cross-functional audiences with compelling narratives.' },
          { level: 4, name: 'Advanced', description: 'Delivers high-stakes pitches to executives or clients.' },
          { level: 5, name: 'Expert', description: 'Keynotes major conferences and masterfully handles Q&A.' }
        ]
      },

      // Leadership
      {
        name: 'Delegation',
        description: 'Assigning responsibility effectively',
        competency: getCompId('Leadership'),
        category: 'Management',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Can hand off simple tasks.' },
          { level: 2, name: 'Developing', description: 'Delegates routine workflows with clear instructions.' },
          { level: 3, name: 'Proficient', description: 'Matches complex tasks to individual strengths.' },
          { level: 4, name: 'Advanced', description: 'Delegates entire project ownership while maintaining accountability.' },
          { level: 5, name: 'Expert', description: 'Builds self-sustaining organizations through extreme delegation.' }
        ]
      },
      {
        name: 'Coaching',
        description: 'Developing others abilities',
        competency: getCompId('Leadership'),
        category: 'Management',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Provides basic feedback.' },
          { level: 2, name: 'Developing', description: 'Mentors juniors on specific technical skills.' },
          { level: 3, name: 'Proficient', description: 'Helps peers navigate career growth and behavioral challenges.' },
          { level: 4, name: 'Advanced', description: 'Transforms underperformers and grooms future leaders.' },
          { level: 5, name: 'Expert', description: 'Cultivates a coaching culture across the entire enterprise.' }
        ]
      },
      {
        name: 'Strategic Thinking',
        description: 'Planning for the long-term future',
        competency: getCompId('Leadership'),
        category: 'Leadership',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Understands the immediate team goals.' },
          { level: 2, name: 'Developing', description: 'Aligns daily work with broader company objectives.' },
          { level: 3, name: 'Proficient', description: 'Develops quarterly strategies for a department.' },
          { level: 4, name: 'Advanced', description: 'Anticipates market trends and pivots multi-year strategies.' },
          { level: 5, name: 'Expert', description: 'Redefines industry paradigms and creates new market spaces.' }
        ]
      },

      // Collaboration
      {
        name: 'Teamwork',
        description: 'Working cooperatively with others',
        competency: getCompId('Collaboration'),
        category: 'Interpersonal',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Completes individual tasks reliably.' },
          { level: 2, name: 'Developing', description: 'Actively supports teammates and shares knowledge.' },
          { level: 3, name: 'Proficient', description: 'Fosters an inclusive environment and elevates team morale.' },
          { level: 4, name: 'Advanced', description: 'Unites fragmented teams and builds high-performing units.' },
          { level: 5, name: 'Expert', description: 'Designs organizational structures that naturally breed extreme teamwork.' }
        ]
      },
      {
        name: 'Conflict Resolution',
        description: 'Resolving disagreements constructively',
        competency: getCompId('Collaboration'),
        category: 'Interpersonal',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Avoids escalating basic disagreements.' },
          { level: 2, name: 'Developing', description: 'Addresses interpersonal issues directly and professionally.' },
          { level: 3, name: 'Proficient', description: 'Mediates disputes between peers to find win-win solutions.' },
          { level: 4, name: 'Advanced', description: 'Resolves deeply entrenched inter-departmental conflicts.' },
          { level: 5, name: 'Expert', description: 'Transforms toxic environments into highly collaborative cultures.' }
        ]
      },
      {
        name: 'Stakeholder Collaboration',
        description: 'Managing and collaborating with stakeholders',
        competency: getCompId('Collaboration'),
        category: 'Business',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Identifies immediate stakeholders.' },
          { level: 2, name: 'Developing', description: 'Keeps stakeholders informed of progress.' },
          { level: 3, name: 'Proficient', description: 'Manages stakeholder expectations and aligns competing priorities.' },
          { level: 4, name: 'Advanced', description: 'Builds strategic alliances with critical external partners.' },
          { level: 5, name: 'Expert', description: 'Navigates complex political landscapes to secure massive organizational buy-in.' }
        ]
      },

      // Data & Analytical Thinking
      {
        name: 'Data Analysis',
        description: 'Processing and analyzing data sets',
        competency: getCompId('Data & Analytical Thinking'),
        category: 'Data',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Can read basic charts and metrics.' },
          { level: 2, name: 'Developing', description: 'Performs basic aggregations and data cleaning.' },
          { level: 3, name: 'Proficient', description: 'Executes complex exploratory data analysis using advanced tools.' },
          { level: 4, name: 'Advanced', description: 'Develops predictive models and sophisticated segmentations.' },
          { level: 5, name: 'Expert', description: 'Pioneers novel analytical algorithms and data science methodologies.' }
        ]
      },
      {
        name: 'Data Interpretation',
        description: 'Deriving actionable meaning from data',
        competency: getCompId('Data & Analytical Thinking'),
        category: 'Data',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Understands what a specific metric means.' },
          { level: 2, name: 'Developing', description: 'Identifies trends and anomalies in data.' },
          { level: 3, name: 'Proficient', description: 'Translates data findings into actionable business recommendations.' },
          { level: 4, name: 'Advanced', description: 'Synthesizes disparate data sources to uncover hidden strategic opportunities.' },
          { level: 5, name: 'Expert', description: 'Transforms company strategy based on visionary interpretations of macro-data.' }
        ]
      },
      {
        name: 'Statistical Reasoning',
        description: 'Applying statistics to solve problems',
        competency: getCompId('Data & Analytical Thinking'),
        category: 'Data',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Understands mean, median, and mode.' },
          { level: 2, name: 'Developing', description: 'Applies basic probability and variance concepts.' },
          { level: 3, name: 'Proficient', description: 'Designs and analyzes rigorous A/B tests.' },
          { level: 4, name: 'Advanced', description: 'Utilizes advanced causal inference and multivariate statistics.' },
          { level: 5, name: 'Expert', description: 'Invents custom statistical models for unique industry problems.' }
        ]
      },

      // Adaptability
      {
        name: 'Learning Agility',
        description: 'Rapidly learning and applying new skills',
        competency: getCompId('Adaptability'),
        category: 'Personal',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Can learn new tools with step-by-step guidance.' },
          { level: 2, name: 'Developing', description: 'Self-teaches standard skills using available documentation.' },
          { level: 3, name: 'Proficient', description: 'Quickly masters complex new paradigms and applies them immediately.' },
          { level: 4, name: 'Advanced', description: 'Readily discards outdated expertise to pioneer cutting-edge domains.' },
          { level: 5, name: 'Expert', description: 'Defines the learning curve for the industry on emerging technologies.' }
        ]
      },
      {
        name: 'Change Management',
        description: 'Navigating and driving change',
        competency: getCompId('Adaptability'),
        category: 'Leadership',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Adapts to process changes without disruption.' },
          { level: 2, name: 'Developing', description: 'Helps peers adjust to new workflows.' },
          { level: 3, name: 'Proficient', description: 'Successfully drives adoption of new tools across a team.' },
          { level: 4, name: 'Advanced', description: 'Orchestrates major organizational restructurings.' },
          { level: 5, name: 'Expert', description: 'Instills a permanent culture of continuous, frictionless evolution.' }
        ]
      },
      {
        name: 'Technical Adaptability',
        description: 'Flexing across different technical stacks',
        competency: getCompId('Adaptability'),
        category: 'Engineering',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Works within a single familiar framework.' },
          { level: 2, name: 'Developing', description: 'Can contribute to adjacent codebases with ramp-up time.' },
          { level: 3, name: 'Proficient', description: 'Seamlessly switches between entirely different tech stacks.' },
          { level: 4, name: 'Advanced', description: 'Architects agnostic systems that can hot-swap underlying technologies.' },
          { level: 5, name: 'Expert', description: 'Foresees technological shifts and pre-emptively adapts the entire company stack.' }
        ]
      },

      // Execution & Ownership
      {
        name: 'Project Planning',
        description: 'Structuring work to achieve goals',
        competency: getCompId('Execution & Ownership'),
        category: 'Execution',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Follows a provided task list.' },
          { level: 2, name: 'Developing', description: 'Breaks down personal work into timelines.' },
          { level: 3, name: 'Proficient', description: 'Creates comprehensive project plans with risk mitigations.' },
          { level: 4, name: 'Advanced', description: 'Orchestrates multi-team portfolios and resolves critical path blockers.' },
          { level: 5, name: 'Expert', description: 'Designs organizational frameworks for flawless global execution.' }
        ]
      },
      {
        name: 'Time Management',
        description: 'Optimizing time to maximize output',
        competency: getCompId('Execution & Ownership'),
        category: 'Execution',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Meets basic deadlines.' },
          { level: 2, name: 'Developing', description: 'Prioritizes daily tasks effectively.' },
          { level: 3, name: 'Proficient', description: 'Consistently delivers complex milestones on time despite interruptions.' },
          { level: 4, name: 'Advanced', description: 'Optimizes entire team workflows to drastically reduce time-to-market.' },
          { level: 5, name: 'Expert', description: 'Pioneers efficiency paradigms that become industry standards.' }
        ]
      },
      {
        name: 'Accountability',
        description: 'Taking ownership of outcomes',
        competency: getCompId('Execution & Ownership'),
        category: 'Personal',
        proficiencyLevels: [
          { level: 1, name: 'Foundational', description: 'Owns mistakes when pointed out.' },
          { level: 2, name: 'Developing', description: 'Proactively reports issues and takes responsibility for personal tasks.' },
          { level: 3, name: 'Proficient', description: 'Takes extreme ownership of team failures and implements systemic fixes.' },
          { level: 4, name: 'Advanced', description: 'Holds cross-functional leaders accountable to organizational commitments.' },
          { level: 5, name: 'Expert', description: 'Fosters a blameless, high-accountability culture across the enterprise.' }
        ]
      }
    ];

    console.log('Inserting skills...');
    const insertedSkills = await Skill.insertMany(skillsData);

    const getSkillId = (name) => insertedSkills.find(s => s.name === name)._id;

    // Add Related Skills mapping
    console.log('Mapping related skills...');
    const relationships = [
      ['Programming', 'Software Testing'],
      ['Programming', 'API Development'],
      ['System Design', 'API Development'],
      ['System Design', 'Database Management'],
      ['Critical Thinking', 'Analytical Thinking'],
      ['Analytical Thinking', 'Data Analysis'],
      ['Verbal Communication', 'Stakeholder Collaboration'],
      ['Delegation', 'Project Planning'],
      ['Coaching', 'Strategic Thinking']
    ];

    for (const [s1, s2] of relationships) {
      const id1 = getSkillId(s1);
      const id2 = getSkillId(s2);
      await Skill.findByIdAndUpdate(id1, { $addToSet: { relatedSkills: id2 } });
      await Skill.findByIdAndUpdate(id2, { $addToSet: { relatedSkills: id1 } });
    }

    // Insert Job Roles
    console.log('Inserting job roles...');
    const jobRolesData = [
      {
        title: 'Software Engineer',
        department: 'Engineering',
        competencyRequirements: [
          { competency: getCompId('Technical Expertise'), requiredLevel: 4, importance: 'HIGH' },
          { competency: getCompId('Problem Solving'), requiredLevel: 4, importance: 'HIGH' },
          { competency: getCompId('Communication'), requiredLevel: 3, importance: 'MEDIUM' },
          { competency: getCompId('Execution & Ownership'), requiredLevel: 3, importance: 'HIGH' }
        ],
        skillRequirements: [
          { skill: getSkillId('Programming'), requiredLevel: 4, importance: 'CRITICAL' },
          { skill: getSkillId('System Design'), requiredLevel: 3, importance: 'HIGH' },
          { skill: getSkillId('Database Management'), requiredLevel: 3, importance: 'MEDIUM' },
          { skill: getSkillId('API Development'), requiredLevel: 3, importance: 'HIGH' },
          { skill: getSkillId('Software Testing'), requiredLevel: 3, importance: 'MEDIUM' }
        ]
      },
      {
        title: 'Data Analyst',
        department: 'Data',
        competencyRequirements: [
          { competency: getCompId('Data & Analytical Thinking'), requiredLevel: 4, importance: 'CRITICAL' },
          { competency: getCompId('Problem Solving'), requiredLevel: 3, importance: 'HIGH' },
          { competency: getCompId('Communication'), requiredLevel: 3, importance: 'HIGH' },
          { competency: getCompId('Execution & Ownership'), requiredLevel: 3, importance: 'MEDIUM' }
        ],
        skillRequirements: [
          { skill: getSkillId('Data Analysis'), requiredLevel: 4, importance: 'CRITICAL' },
          { skill: getSkillId('Data Interpretation'), requiredLevel: 4, importance: 'HIGH' },
          { skill: getSkillId('Statistical Reasoning'), requiredLevel: 3, importance: 'HIGH' },
          { skill: getSkillId('Analytical Thinking'), requiredLevel: 4, importance: 'HIGH' },
          { skill: getSkillId('Presentation'), requiredLevel: 3, importance: 'MEDIUM' }
        ]
      },
      {
        title: 'Product Manager',
        department: 'Product',
        competencyRequirements: [
          { competency: getCompId('Communication'), requiredLevel: 4, importance: 'CRITICAL' },
          { competency: getCompId('Problem Solving'), requiredLevel: 4, importance: 'HIGH' },
          { competency: getCompId('Leadership'), requiredLevel: 3, importance: 'HIGH' },
          { competency: getCompId('Collaboration'), requiredLevel: 4, importance: 'HIGH' },
          { competency: getCompId('Execution & Ownership'), requiredLevel: 4, importance: 'CRITICAL' }
        ],
        skillRequirements: [
          { skill: getSkillId('Verbal Communication'), requiredLevel: 4, importance: 'HIGH' },
          { skill: getSkillId('Presentation'), requiredLevel: 4, importance: 'HIGH' },
          { skill: getSkillId('Stakeholder Collaboration'), requiredLevel: 4, importance: 'CRITICAL' },
          { skill: getSkillId('Decision Making'), requiredLevel: 4, importance: 'HIGH' },
          { skill: getSkillId('Project Planning'), requiredLevel: 4, importance: 'CRITICAL' }
        ]
      },
      {
        title: 'Engineering Manager',
        department: 'Engineering',
        competencyRequirements: [
          { competency: getCompId('Technical Expertise'), requiredLevel: 4, importance: 'HIGH' },
          { competency: getCompId('Leadership'), requiredLevel: 4, importance: 'CRITICAL' },
          { competency: getCompId('Communication'), requiredLevel: 4, importance: 'CRITICAL' },
          { competency: getCompId('Collaboration'), requiredLevel: 4, importance: 'HIGH' },
          { competency: getCompId('Execution & Ownership'), requiredLevel: 4, importance: 'CRITICAL' }
        ],
        skillRequirements: [
          { skill: getSkillId('System Design'), requiredLevel: 4, importance: 'HIGH' },
          { skill: getSkillId('Strategic Thinking'), requiredLevel: 4, importance: 'CRITICAL' },
          { skill: getSkillId('Delegation'), requiredLevel: 4, importance: 'CRITICAL' },
          { skill: getSkillId('Coaching'), requiredLevel: 4, importance: 'HIGH' },
          { skill: getSkillId('Stakeholder Collaboration'), requiredLevel: 4, importance: 'HIGH' }
        ]
      },
      {
        title: 'UI/UX Designer',
        department: 'Design',
        competencyRequirements: [
          { competency: getCompId('Communication'), requiredLevel: 3, importance: 'HIGH' },
          { competency: getCompId('Problem Solving'), requiredLevel: 3, importance: 'HIGH' },
          { competency: getCompId('Collaboration'), requiredLevel: 4, importance: 'HIGH' },
          { competency: getCompId('Data & Analytical Thinking'), requiredLevel: 3, importance: 'MEDIUM' },
          { competency: getCompId('Adaptability'), requiredLevel: 3, importance: 'MEDIUM' }
        ],
        skillRequirements: [
          { skill: getSkillId('Presentation'), requiredLevel: 3, importance: 'MEDIUM' },
          { skill: getSkillId('Critical Thinking'), requiredLevel: 3, importance: 'HIGH' },
          { skill: getSkillId('Teamwork'), requiredLevel: 4, importance: 'HIGH' },
          { skill: getSkillId('Data Interpretation'), requiredLevel: 3, importance: 'MEDIUM' },
          { skill: getSkillId('Learning Agility'), requiredLevel: 3, importance: 'MEDIUM' }
        ]
      }
    ];

    const insertedJobRoles = await JobRole.insertMany(jobRolesData);
    const getRoleId = (title) => insertedJobRoles.find(r => r.title === title)._id;

    // Update seed Employees to include JobRole IDs
    seedEmployees[0].role = getRoleId('Software Engineer'); // Alice
    seedEmployees[1].role = getRoleId('Engineering Manager'); // Bob
    seedEmployees[2].role = getRoleId('Data Analyst'); // Charlie
    seedEmployees[3].role = getRoleId('Product Manager'); // Diana
    seedEmployees[4].role = getRoleId('UI/UX Designer'); // Eve

    // Insert Employees
    console.log('Inserting employees...');
    const insertedEmployees = await Employee.insertMany(seedEmployees);

    // Set Manager (Bob manages Alice)
    const bob = insertedEmployees.find(e => e.firstName === 'Bob');
    const alice = insertedEmployees.find(e => e.firstName === 'Alice');
    await Employee.findByIdAndUpdate(alice._id, { manager: bob._id });

    // Insert Users (2 EMPLOYEE, 1 ADMIN)
    console.log('Inserting users...');
    const users = [
      {
        name: 'Alice User',
        email: 'alice@example.com',
        passwordHash: 'dummyhash123',
        role: 'EMPLOYEE',
        employeeId: alice._id
      },
      {
        name: 'Bob User',
        email: 'bob@example.com',
        passwordHash: 'dummyhash123',
        role: 'EMPLOYEE',
        employeeId: bob._id
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: 'dummyhash123',
        role: 'ADMIN'
      }
    ];

    await User.insertMany(users);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

runSeed();
