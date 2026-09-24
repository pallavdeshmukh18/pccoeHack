const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');

router.route('/start')
  .post(assessmentController.startAssessment);

router.route('/:id/answer')
  .post(assessmentController.submitAnswer);

router.route('/:id/complete')
  .post(assessmentController.completeAssessment);

router.route('/:id')
  .get(assessmentController.getAssessmentById);

module.exports = router;
