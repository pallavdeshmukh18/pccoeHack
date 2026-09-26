const fs = require('fs');
const path = require('path');

const applySecurity = (fileName, endpoints) => {
    const p = path.join(__dirname, '../src/routes', fileName);
    let code = fs.readFileSync(p, 'utf8');
    
    if (!code.includes('requireOwnership')) {
        code = code.replace("const { protect, authorize } = require('../middleware/authMiddleware');", "const { protect, authorize, requireOwnership } = require('../middleware/authMiddleware');");
    }
    
    for (const [from, to] of Object.entries(endpoints)) {
        code = code.replace(from, to);
    }
    
    fs.writeFileSync(p, code);
};

applySecurity('evidenceConflictRoutes.js', {
  "router.post('/detect', protect, ctrl.detectConflicts);": "router.post('/detect', protect, requireOwnership, ctrl.detectConflicts);",
  "router.get('/employee/:employeeId', protect, ctrl.getEmployeeConflicts);": "router.get('/employee/:employeeId', protect, requireOwnership, ctrl.getEmployeeConflicts);"
});

applySecurity('explanationRoutes.js', {
  "router.get('/employee/:employeeId/skill/:skillId', protect, ctrl.explainCapability);": "router.get('/employee/:employeeId/skill/:skillId', protect, requireOwnership, ctrl.explainCapability);"
});

applySecurity('careerRoutes.js', {
  "router.post('/simulate', protect, ctrl.simulateCareerPath);": "router.post('/simulate', protect, requireOwnership, ctrl.simulateCareerPath);"
});

applySecurity('aiRoutes.js', {
  "router.post('/explain-capability/:employeeId/:skillId', ctrl.explainCapability);": "router.post('/explain-capability/:employeeId/:skillId', protect, requireOwnership, ctrl.explainCapability);"
});
