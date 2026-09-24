const express = require('express');
const router = express.Router();
const capabilityController = require('../controllers/capabilityController');

router.post('/recalculate', capabilityController.recalculateCapability);
router.get('/employee/:employeeId', capabilityController.getEmployeeCapabilities);
router.get('/employee/:employeeId/skill/:skillId', capabilityController.getEmployeeSkillCapability);

module.exports = router;
