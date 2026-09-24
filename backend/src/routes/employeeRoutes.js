const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

router.route('/')
  .get(employeeController.getAllEmployees)
  .post(employeeController.createEmployee);

router.route('/:id')
  .get(employeeController.getEmployeeById)
  .patch(employeeController.updateEmployee)
  .delete(employeeController.deleteEmployee);

module.exports = router;
