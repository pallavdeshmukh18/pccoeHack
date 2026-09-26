const mongoose = require('mongoose');
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({ employeeId: { $ne: null } });
  const linkedEmployeeIds = users.map(u => u.employeeId.toString());
  
  const employees = await Employee.find();
  const availableEmployees = employees.filter(e => !linkedEmployeeIds.includes(e._id.toString()));
  
  console.log("Available Employee Codes:");
  availableEmployees.forEach(e => console.log(e.employeeCode, "-", e.firstName, e.lastName));
  process.exit(0);
});
