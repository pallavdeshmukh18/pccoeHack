require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function testUserAndApp() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Clean up
    await User.deleteMany({ email: 'test@example.com' });

    // 1. Create a user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'secret123'
    });
    await user.save();

    // 2. Normal query
    const queriedUser = await User.findOne({ email: 'test@example.com' });
    console.log('Normal query has passwordHash?', queriedUser.passwordHash !== undefined);

    // 3. Lean query
    const leanUser = await User.findOne({ email: 'test@example.com' }).lean();
    console.log('Lean query has passwordHash?', leanUser.passwordHash !== undefined);

    // 4. Explicit select
    const explicitUser = await User.findOne({ email: 'test@example.com' }).select('+passwordHash').lean();
    console.log('Explicit select has passwordHash?', explicitUser.passwordHash !== undefined);

    await User.deleteMany({ email: 'test@example.com' });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUserAndApp();
