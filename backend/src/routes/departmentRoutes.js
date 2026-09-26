const { protect, authorize } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/departmentIntelligenceController');

router.get('/:department/overview', protect, authorize('ADMIN'), ctrl.getDepartmentOverview);

module.exports = router;
