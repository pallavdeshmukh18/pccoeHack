const Employee = require('../models/Employee');
const JobRole = require('../models/JobRole');

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().populate('manager').populate('role', 'title department');
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('manager').populate('role', 'title department');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Employee code already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['firstName', 'lastName', 'jobTitle', 'department', 'location', 'role'];
    
    if (req.user && req.user.role === 'ADMIN') {
      Object.keys(req.body).forEach(key => updates[key] = req.body[key]);
    } else {
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
    }

    if (updates.role) {
      const jobRole = await JobRole.findById(updates.role);
      if (!jobRole) {
        return res.status(404).json({ success: false, message: 'JobRole not found' });
      }
      if (jobRole.isActive === false) {
        return res.status(400).json({ success: false, message: 'JobRole is inactive' });
      }
    } else if (updates.role === null) {
      // null is allowed (no role assigned)
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('manager').populate('role', 'title department');
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Employee code already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
