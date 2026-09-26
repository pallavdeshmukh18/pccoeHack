const { protect, authorize, requireOwnership } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/capabilityExplanationController');

router.get('/employee/:employeeId/skill/:skillId', protect, requireOwnership, ctrl.explainCapability);

module.exports = router;
