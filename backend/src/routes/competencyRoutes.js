const express = require('express');
const router = express.Router();
const competencyController = require('../controllers/competencyController');

router.route('/')
  .get(competencyController.getAllCompetencies)
  .post(competencyController.createCompetency);

router.route('/:id')
  .get(competencyController.getCompetencyById)
  .patch(competencyController.updateCompetency)
  .delete(competencyController.deleteCompetency);

router.route('/:id/skills')
  .get(competencyController.getCompetencySkills);

router.route('/:id/graph')
  .get(competencyController.getCompetencyGraph);

module.exports = router;
