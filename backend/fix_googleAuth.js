const fs = require('fs');
let code = fs.readFileSync('src/services/authService.js', 'utf8');

const regex = /    \/\/ Needs to link employee\s+return \{\s+action: 'LINK_EMPLOYEE',[\s\S]*?\};\s*\}/;

const autoCreateLogic = `    // Auto-create and link an employee profile
    const Employee = require('../models/Employee');
    const newEmployee = new Employee({
      employeeCode: 'EMP_G_' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000),
      firstName: payload.given_name || 'Google',
      lastName: payload.family_name || 'User',
      department: 'General',
      jobTitle: 'Employee',
      joiningDate: new Date()
    });
    await newEmployee.save();

    let finalUser = user;
    if (!finalUser) {
      finalUser = new User({
        name: (payload.given_name || '') + ' ' + (payload.family_name || ''),
        email,
        role: 'EMPLOYEE',
        employeeId: newEmployee._id
      });
      await finalUser.save();
    } else {
      finalUser.employeeId = newEmployee._id;
      await finalUser.save();
    }

    const token = generateToken({ id: finalUser._id, role: finalUser.role });
    return { user: finalUser, token, action: 'LOGIN_SUCCESS' };
  }`;

code = code.replace(regex, autoCreateLogic);
fs.writeFileSync('src/services/authService.js', code);
