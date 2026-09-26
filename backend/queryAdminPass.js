const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const admin = await User.findOne({ role: 'ADMIN' }).select('+passwordHash');
  console.log("Admin passwordHash:", admin.passwordHash);
  process.exit(0);
});
