const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');

router.route('/')
  .get(skillController.getAllSkills)
  .post(skillController.createSkill);

router.route('/:id')
  .get(skillController.getSkillById)
  .put(skillController.updateSkill)
  .delete(skillController.deleteSkill);

router.route('/:id/related')
  .get(skillController.getRelatedSkills);

module.exports = router;
