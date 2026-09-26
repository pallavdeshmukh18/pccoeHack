const mongoose = require('mongoose');
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const admin = await User.findOne({ role: 'ADMIN' }).populate('employeeId');
  console.log("Admin email:", admin.email);
  if (admin.employeeId) {
    console.log("Admin Employee Code:", admin.employeeId.employeeCode);
  } else {
    console.log("Admin has no linked Employee document.");
  }
  process.exit(0);
});
