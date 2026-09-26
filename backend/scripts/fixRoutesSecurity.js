const fs = require('fs');
const path = require('path');

const applySecurity = (fileName, endpoints) => {
    const p = path.join(__dirname, '../src/routes', fileName);
    let code = fs.readFileSync(p, 'utf8');
    
    if (!code.includes('authMiddleware')) {
        code = "const { protect, authorize } = require('../middleware/authMiddleware');\n" + code;
    }
    
    // Replace specific unprotected endpoints with protected ones
    for (const [from, to] of Object.entries(endpoints)) {
        code = code.replace(from, to);
    }
    
    fs.writeFileSync(p, code);
};

// Admin endpoints
applySecurity('evidencePolicyRoutes.js', {
  "router.get('/', ctrl.getPolicies);": "router.get('/', protect, authorize('ADMIN'), ctrl.getPolicies);",
  "router.put('/:id', ctrl.updatePolicy);": "router.put('/:id', protect, authorize('ADMIN'), ctrl.updatePolicy);"
});

applySecurity('skillRiskRoutes.js', {
  "router.post('/evaluate', ctrl.evaluateSkillRisk);": "router.post('/evaluate', protect, authorize('ADMIN'), ctrl.evaluateSkillRisk);",
  "router.get('/skills', ctrl.getSkillRisks);": "router.get('/skills', protect, authorize('ADMIN'), ctrl.getSkillRisks);" // if implemented
});

applySecurity('organizationRoutes.js', {
  "router.get('/overview', ctrl.getOverview);": "router.get('/overview', protect, authorize('ADMIN'), ctrl.getOverview);"
});

applySecurity('departmentRoutes.js', {
  "router.get('/:department/overview', ctrl.getDepartmentOverview);": "router.get('/:department/overview', protect, authorize('ADMIN'), ctrl.getDepartmentOverview);"
});

applySecurity('managerActionRoutes.js', {
  "router.post('/generate', ctrl.generateActions);": "router.post('/generate', protect, authorize('ADMIN'), ctrl.generateActions);",
  "router.get('/', ctrl.getActions);": "router.get('/', protect, authorize('ADMIN'), ctrl.getActions);",
  "router.patch('/:id/status', ctrl.updateActionStatus);": "router.patch('/:id/status', protect, authorize('ADMIN'), ctrl.updateActionStatus);"
});

applySecurity('teamRoutes.js', {
  "router.get('/', ctrl.getTeams);": "router.get('/', protect, authorize('ADMIN'), ctrl.getTeams);",
  "router.get('/:teamId/capabilities', ctrl.getTeamCapabilities);": "router.get('/:teamId/capabilities', protect, authorize('ADMIN'), ctrl.getTeamCapabilities);"
});

// Employee protected endpoints (should verify ownership in controller or middleware, but at least require protect)
applySecurity('evidenceConflictRoutes.js', {
  "router.post('/detect', ctrl.detectConflicts);": "router.post('/detect', protect, ctrl.detectConflicts);",
  "router.get('/employee/:employeeId', ctrl.getEmployeeConflicts);": "router.get('/employee/:employeeId', protect, ctrl.getEmployeeConflicts);"
});

applySecurity('explanationRoutes.js', {
  "router.get('/employee/:employeeId/skill/:skillId', ctrl.explainCapability);": "router.get('/employee/:employeeId/skill/:skillId', protect, ctrl.explainCapability);"
});

applySecurity('careerRoutes.js', {
  "router.post('/simulate', ctrl.simulateCareerPath);": "router.post('/simulate', protect, ctrl.simulateCareerPath);"
});

console.log('Security applied to routes');
