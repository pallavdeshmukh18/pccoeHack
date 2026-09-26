const express = require('express');
const router = express.Router();
const developmentCopilotController = require('../controllers/developmentCopilotController');

router.post('/generate', developmentCopilotController.generateCopilotPlan);
router.get('/employee/:employeeId', developmentCopilotController.getEmployeeCopilotPlans);
router.get('/employee/:employeeId/role/:jobRoleId', developmentCopilotController.getEmployeeCopilotPlan);

module.exports = router;
