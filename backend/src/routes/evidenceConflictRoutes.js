const { protect, authorize, requireOwnership } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/evidenceConflictController');

router.post('/detect', protect, requireOwnership, ctrl.detectConflicts);
router.get('/employee/:employeeId', protect, requireOwnership, ctrl.getEmployeeConflicts);

module.exports = router;
