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

module.exports = app;

