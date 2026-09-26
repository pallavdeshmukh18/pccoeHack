const { protect, authorize } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/organizationIntelligenceController');

router.get('/overview', protect, authorize('ADMIN'), ctrl.getOverview);

module.exports = router;
