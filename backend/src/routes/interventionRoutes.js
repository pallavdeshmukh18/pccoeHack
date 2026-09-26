const express = require('express');
const router = express.Router();
const interventionController = require('../controllers/interventionController');

router.post('/', interventionController.createIntervention);
router.get('/:id', interventionController.getIntervention);
router.get('/employee/:employeeId', interventionController.getEmployeeInterventions);
router.put('/:id', interventionController.updateIntervention);
router.post('/:id/complete', interventionController.completeIntervention);

module.exports = router;
