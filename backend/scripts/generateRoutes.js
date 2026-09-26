const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../src/routes');

const routes = {
  'evidenceConflictRoutes.js': `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/evidenceConflictController');

router.post('/detect', ctrl.detectConflicts);
router.get('/employee/:employeeId', ctrl.getEmployeeConflicts);

module.exports = router;
`,
  'explanationRoutes.js': `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/capabilityExplanationController');

router.get('/employee/:employeeId/skill/:skillId', ctrl.explainCapability);

module.exports = router;
`,
  'evidencePolicyRoutes.js': `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/evidencePolicyController');

router.get('/', ctrl.getPolicies);
router.put('/:id', ctrl.updatePolicy);

module.exports = router;
`,
  'aiRoutes.js': `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiIntelligenceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze-evidence', ctrl.analyzeEvidence);
router.post('/summarize-feedback', ctrl.summarizeFeedback);
router.post('/explain-capability/:employeeId/:skillId', ctrl.explainCapability);
router.post('/chat', protect, ctrl.chat);

module.exports = router;
`,
  'careerRoutes.js': `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/careerSimulationController');

router.post('/simulate', ctrl.simulateCareerPath);

module.exports = router;
`,
  'teamRoutes.js': `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/teamIntelligenceController');

router.get('/', ctrl.getTeams);
router.get('/:teamId/capabilities', ctrl.getTeamCapabilities);

module.exports = router;
`,
  'skillRiskRoutes.js': `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/skillRiskController');

router.post('/evaluate', ctrl.evaluateSkillRisk);

module.exports = router;
`,
  'organizationRoutes.js': `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/organizationIntelligenceController');

router.get('/overview', ctrl.getOverview);

module.exports = router;
`,
  'departmentRoutes.js': `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/departmentIntelligenceController');

router.get('/:department/overview', ctrl.getDepartmentOverview);

module.exports = router;
`,
  'managerActionRoutes.js': `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/managerActionController');

router.post('/generate', ctrl.generateActions);
router.get('/', ctrl.getActions);
router.patch('/:id/status', ctrl.updateActionStatus);

module.exports = router;
`
};

for (const [filename, content] of Object.entries(routes)) {
  fs.writeFileSync(path.join(routesDir, filename), content);
  console.log('Created', filename);
}
