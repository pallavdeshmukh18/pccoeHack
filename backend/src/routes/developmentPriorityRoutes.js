const express = require('express');
const router = express.Router();
const developmentPriorityController = require('../controllers/developmentPriorityController');

router.post('/recalculate', developmentPriorityController.recalculateDevelopmentPriority);
router.get('/employee/:employeeId', developmentPriorityController.getEmployeeDevelopmentPriorities);
router.get('/employee/:employeeId/role/:jobRoleId', developmentPriorityController.getEmployeeDevelopmentPriority);

module.exports = router;
