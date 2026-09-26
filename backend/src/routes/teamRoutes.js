const { protect, authorize } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/teamIntelligenceController');

router.get('/', protect, authorize('ADMIN'), ctrl.getTeams);
router.get('/:teamId/capabilities', protect, authorize('ADMIN'), ctrl.getTeamCapabilities);

module.exports = router;
