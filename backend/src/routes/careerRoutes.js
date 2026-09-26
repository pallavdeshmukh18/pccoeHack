const { protect, authorize, requireOwnership } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/careerSimulationController');

router.post('/simulate', protect, requireOwnership, ctrl.simulateCareerPath);

module.exports = router;
