const { protect, authorize } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/managerActionController');

router.post('/generate', protect, authorize('ADMIN'), ctrl.generateActions);
router.get('/', protect, authorize('ADMIN'), ctrl.getActions);
router.patch('/:id/status', protect, authorize('ADMIN'), ctrl.updateActionStatus);

module.exports = router;
