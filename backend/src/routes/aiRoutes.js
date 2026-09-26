const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiIntelligenceController');
const { protect, requireOwnership } = require('../middleware/authMiddleware');

router.post('/analyze-evidence', ctrl.analyzeEvidence);
router.post('/summarize-feedback', ctrl.summarizeFeedback);
router.post('/explain-capability/:employeeId/:skillId', protect, requireOwnership, ctrl.explainCapability);
router.post('/chat', protect, ctrl.chat);

module.exports = router;
