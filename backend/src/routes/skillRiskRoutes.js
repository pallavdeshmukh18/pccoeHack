const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/skillRiskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/evaluate', protect, authorize('ADMIN'), ctrl.evaluateSkillRisk);
router.get('/skills', protect, authorize('ADMIN'), ctrl.getSkillRisks);

module.exports = router;
