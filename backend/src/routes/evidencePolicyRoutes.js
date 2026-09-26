const { protect, authorize } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/evidencePolicyController');

router.get('/', protect, authorize('ADMIN'), ctrl.getPolicies);
router.put('/:id', protect, authorize('ADMIN'), ctrl.updatePolicy);

module.exports = router;
