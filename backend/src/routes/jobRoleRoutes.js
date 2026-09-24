const express = require('express');
const router = express.Router();
const jobRoleController = require('../controllers/jobRoleController');

router.route('/')
  .get(jobRoleController.getAllJobRoles)
  .post(jobRoleController.createJobRole);

router.route('/:id')
  .get(jobRoleController.getJobRoleById)
  .put(jobRoleController.updateJobRole)
  .delete(jobRoleController.deleteJobRole);

router.route('/:id/requirements')
  .get(jobRoleController.getJobRoleRequirements);

module.exports = router;
