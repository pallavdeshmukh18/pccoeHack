const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const admin = await User.findOne({ role: 'ADMIN' });
  const hash = await bcrypt.hash('password123', 10);
  admin.passwordHash = hash;
  await admin.save();
  console.log("Admin password updated to 'password123'. Email is admin@example.com");
  process.exit(0);
});
