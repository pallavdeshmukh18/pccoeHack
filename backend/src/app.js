const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const competencyRoutes = require('./routes/competencyRoutes');
const skillRoutes = require('./routes/skillRoutes');
const jobRoleRoutes = require('./routes/jobRoleRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const capabilityRoutes = require('./routes/capabilityRoutes');
const competencyCapabilityRoutes = require('./routes/competencyCapabilityRoutes');
const roleGapRoutes = require('./routes/roleGapRoutes');
const developmentPriorityRoutes = require('./routes/developmentPriorityRoutes');
const developmentCopilotRoutes = require('./routes/developmentCopilotRoutes');
const interventionRoutes = require('./routes/interventionRoutes');
const authRoutes = require('./routes/authRoutes');
const evidenceConflictRoutes = require('./routes/evidenceConflictRoutes');
const explanationRoutes = require('./routes/explanationRoutes');
const evidencePolicyRoutes = require('./routes/evidencePolicyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const careerRoutes = require('./routes/careerRoutes');
const teamRoutes = require('./routes/teamRoutes');
const skillRiskRoutes = require('./routes/skillRiskRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const managerActionRoutes = require('./routes/managerActionRoutes');


const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Health-check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TalentTwin backend is running'
  });
});

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/competencies', competencyRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/job-roles', jobRoleRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/capabilities', capabilityRoutes);
app.use('/api/competency-capabilities', competencyCapabilityRoutes);
app.use('/api/role-gaps', roleGapRoutes);
app.use('/api/development-priorities', developmentPriorityRoutes);
app.use('/api/development-copilot', developmentCopilotRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/evidence-conflicts', evidenceConflictRoutes);
app.use('/api/explanations', explanationRoutes);
app.use('/api/evidence-policies', evidencePolicyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/risks', skillRiskRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/manager-actions', managerActionRoutes);


// JSON 404 Handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);

  let statusCode = 500;
  let message = 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error: A resource with this unique value already exists.';
  }

  res.status(statusCode).json({
    success: false,
    message
  });
});

const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);

module.exports = app;

