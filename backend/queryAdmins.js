const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find();
  console.log("All Users:", users.map(u => ({ email: u.email, role: u.role })));
  
  const Employee = require('./src/models/Employee');
  const employees = await Employee.find();
  console.log("All Employees:", employees.map(e => ({ employeeCode: e.employeeCode })));
  process.exit(0);
});
