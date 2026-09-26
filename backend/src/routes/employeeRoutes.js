const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Custom ownership middleware specifically for /api/employees/:id routes
const requireEmployeeOwnership = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  const targetId = req.params.id;
  if (req.user && req.user.employeeId && req.user.employeeId.toString() === targetId) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Not authorized to access this resource' });
};

router.route('/')
  .get(protect, authorize('ADMIN'), employeeController.getAllEmployees)
  .post(protect, authorize('ADMIN'), employeeController.createEmployee);

router.route('/:id')
  .get(protect, requireEmployeeOwnership, employeeController.getEmployeeById)
  .patch(protect, requireEmployeeOwnership, employeeController.updateEmployee)
  .delete(protect, authorize('ADMIN'), employeeController.deleteEmployee);

module.exports = router;
