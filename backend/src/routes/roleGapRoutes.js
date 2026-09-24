const express = require('express');
const router = express.Router();
const roleGapController = require('../controllers/roleGapController');

router.post('/recalculate', roleGapController.recalculateRoleGap);
router.get('/employee/:employeeId', roleGapController.getEmployeeRoleGaps);
router.get('/employee/:employeeId/role/:jobRoleId', roleGapController.getEmployeeRoleGap);

module.exports = router;
