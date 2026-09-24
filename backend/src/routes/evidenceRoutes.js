const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidenceController');

router.post('/', evidenceController.createEvidence);
router.get('/', evidenceController.getEvidence);
router.get('/:id', evidenceController.getEvidenceById);
router.put('/:id', evidenceController.updateEvidence);
router.delete('/:id', evidenceController.archiveEvidence);

module.exports = router;
