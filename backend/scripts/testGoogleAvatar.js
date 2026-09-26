require('dotenv').config();
const mongoose = require('mongoose');
const { generateToken } = require('../src/utils/jwt');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const app = require('../src/app');
const supertest = require('supertest');
const authService = require('../src/services/authService');

const request = supertest(app);

// Mock global fetch for Google OAuth simulation
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (url === 'https://www.googleapis.com/oauth2/v3/userinfo') {
    const token = options.headers.Authorization.split(' ')[1];
    
    let payload = {};
    if (token === 'valid_with_pic') {
        payload = { email: 'test@example.com', picture: 'http://example.com/pic1.jpg', given_name: 'Test', family_name: 'User' };
    } else if (token === 'valid_new_pic') {
        payload = { email: 'test@example.com', picture: 'http://example.com/pic2.jpg', given_name: 'Test', family_name: 'User' };
    } else if (token === 'valid_no_pic') {
        payload = { email: 'test@example.com', given_name: 'Test', family_name: 'User' };
    } else if (token === 'unknown_email') {
        payload = { email: 'unknown@example.com', given_name: 'Unknown', family_name: 'User' };
    } else if (token === 'unlinked_user') {
        payload = { email: 'unlinked@example.com', picture: 'http://example.com/unlinked.jpg', given_name: 'Unlinked', family_name: 'User' };
    } else {
        return { ok: false }; // trigger fallback / error
    }
    
    return {
      ok: true,
      json: async () => payload
    };
  }
  return originalFetch(url, options);
};

async function runTests() {
  let dbUri = process.env.MONGO_URI;
  if (!dbUri.includes('test')) {
    dbUri = dbUri.replace(/\/[^/?]+(\?|$)/, '/talenttwin_avatar_test$1');
  }
  
  await mongoose.connect(dbUri);
  await mongoose.connection.dropDatabase();

  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`✅ ${msg}`);
      passed++;
    } else {
      console.error(`❌ ${msg}`);
      failed++;
    }
  };

  // Setup basic Employee
  const empA = await Employee.create({
    firstName: 'Test', lastName: 'User',
    employeeCode: 'AV_A', jobTitle: 'Test', joiningDate: new Date(),
    department: 'Test', status: 'ACTIVE'
  });

  const empB = await Employee.create({
    firstName: 'Unknown', lastName: 'User',
    employeeCode: 'AV_B', jobTitle: 'Test', joiningDate: new Date(),
    department: 'Test', status: 'ACTIVE'
  });
  
  const empC = await Employee.create({
    firstName: 'Already', lastName: 'Linked',
    employeeCode: 'AV_C', jobTitle: 'Test', joiningDate: new Date(),
    department: 'Test', status: 'ACTIVE'
  });
  
  await User.create({
    name: 'Already Linked',
    email: 'already@example.com',
    passwordHash: 'fake',
    role: 'EMPLOYEE',
    employeeId: empC._id,
    isActive: true
  });

  // TEST 4 & 5 & 6 (Existing users setup)
  const existingUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'fake',
    role: 'EMPLOYEE',
    employeeId: empA._id,
    isActive: true
  });
  
  const unlinkedUser = await User.create({
    name: 'Unlinked User',
    email: 'unlinked@example.com',
    passwordHash: 'fake',
    role: 'EMPLOYEE',
    employeeId: null,
    isActive: true
  });

  // TEST 1: Google profile contains picture -> avatarUrl stored
  const res1 = await authService.googleAuth('valid_with_pic');
  const userAfterTest1 = await User.findById(existingUser._id);
  assert(userAfterTest1.avatarUrl === 'http://example.com/pic1.jpg', 'TEST 1: Google profile contains picture -> avatarUrl stored');

  // TEST 4: Existing linked user can Google login -> LOGIN_SUCCESS + JWT
  assert(res1.action === 'LOGIN_SUCCESS' && res1.token, 'TEST 4: Existing linked user -> LOGIN_SUCCESS + JWT');

  // TEST 2: Existing Google user logs in again with a different picture
  const res2 = await authService.googleAuth('valid_new_pic');
  const userAfterTest2 = await User.findById(existingUser._id);
  assert(userAfterTest2.avatarUrl === 'http://example.com/pic2.jpg', 'TEST 2: Existing Google user logs in again -> avatarUrl updated');

  // TEST 3: Google profile has no picture -> existing avatarUrl preserved
  const res3 = await authService.googleAuth('valid_no_pic');
  const userAfterTest3 = await User.findById(existingUser._id);
  assert(userAfterTest3.avatarUrl === 'http://example.com/pic2.jpg', 'TEST 3: Google profile has no picture -> existing avatarUrl preserved');

  // TEST 5: Existing user without employeeId -> EMPLOYEE_LINK_REQUIRED
  const res5 = await authService.googleAuth('unlinked_user');
  assert(res5.action === 'EMPLOYEE_LINK_REQUIRED', 'TEST 5: Existing user without employeeId -> EMPLOYEE_LINK_REQUIRED');
  const userAfterTest5 = await User.findById(unlinkedUser._id);
  assert(userAfterTest5.avatarUrl === 'http://example.com/unlinked.jpg', 'TEST 5b: Avatar still syncs even if link required');

  // TEST 6: Unknown Google email -> EMPLOYEE_LINK_REQUIRED + no auto Employee created
  const initialEmployeeCount = await Employee.countDocuments();
  const initialUserCount = await User.countDocuments();
  const res6 = await authService.googleAuth('unknown_email');
  assert(res6.action === 'EMPLOYEE_LINK_REQUIRED', 'TEST 6: Unknown Google email -> EMPLOYEE_LINK_REQUIRED');
  const finalEmployeeCount = await Employee.countDocuments();
  const finalUserCount = await User.countDocuments();
  assert(finalEmployeeCount === initialEmployeeCount, 'TEST 6b: No auto Employee created for unknown Google email');
  assert(finalUserCount === initialUserCount, 'TEST 6c: No auto User created during just googleAuth for unknown email');

  // TEST 7: googleLink with valid existing employee code
  const res7 = await authService.googleLink({ credential: 'unknown_email', employeeCode: 'AV_B' });
  const linkedUser = await User.findOne({ email: 'unknown@example.com' });
  assert(res7.token && linkedUser.employeeId.toString() === empB._id.toString(), 'TEST 7: googleLink links existing Employee to new Google User');

  // TEST 8: googleLink cannot link an Employee already associated with another User
  try {
      await authService.googleLink({ credential: 'valid_with_pic', employeeCode: 'AV_C' });
      assert(false, 'TEST 8: googleLink should have thrown 409');
  } catch (err) {
      assert(err.statusCode === 409, 'TEST 8: googleLink cannot link an Employee already associated with another User (409)');
  }

  // TEST 9 & 10
  const token = generateToken({ id: existingUser._id, role: 'EMPLOYEE' });
  const res9 = await request.get(`/api/auth/me`).set('Authorization', `Bearer ${token}`);
  assert(res9.status === 200 && res9.body.data.avatarUrl === 'http://example.com/pic2.jpg', 'TEST 9: Google avatar appears in GET /api/auth/me');
  assert(!res9.body.data.passwordHash, 'TEST 10: passwordHash never appears in safe response');

  console.log(`\nTests Completed: ${passed} passed, ${failed} failed.`);
  
  global.fetch = originalFetch;
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
