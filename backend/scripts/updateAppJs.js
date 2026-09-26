const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '../src/app.js');
let code = fs.readFileSync(appJsPath, 'utf8');

const newImports = `
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
`;

const newMounts = `
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
`;

code = code.replace("const authRoutes = require('./routes/authRoutes');", "const authRoutes = require('./routes/authRoutes');" + newImports);
code = code.replace("app.use('/api/interventions', interventionRoutes);", "app.use('/api/interventions', interventionRoutes);" + newMounts);

fs.writeFileSync(appJsPath, code);
console.log("Updated app.js");
