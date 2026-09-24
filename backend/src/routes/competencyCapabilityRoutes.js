const express = require('express');
const router = express.Router();
const competencyCapabilityController = require('../controllers/competencyCapabilityController');

router.post('/recalculate', competencyCapabilityController.recalculateCompetencyCapability);
router.get('/employee/:employeeId', competencyCapabilityController.getEmployeeCompetencyCapabilities);
router.get('/employee/:employeeId/competency/:competencyId', competencyCapabilityController.getEmployeeCompetencyCapability);

module.exports = router;
