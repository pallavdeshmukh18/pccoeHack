require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/talenttwin_dev';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE AUTHENTICATION TESTS ---\n');
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clean up test data
    await User.deleteMany({ email: /@test\.com$/ });
    await Employee.deleteMany({ employeeCode: /^TEST_AUTH_/ });

    console.log('\n--- SIGNUP TESTS ---');
    
    // 1. Create a mock employee
    const activeEmployee = await Employee.create({
      employeeCode: 'TEST_AUTH_ACTIVE',
      firstName: 'Alice',
      lastName: 'Smith',
      department: 'Engineering',
      jobTitle: 'Developer',
      joiningDate: new Date(),
      status: 'ACTIVE'
    });

    const inactiveEmployee = await Employee.create({
      employeeCode: 'TEST_AUTH_INACTIVE',
      firstName: 'Bob',
      lastName: 'Jones',
      department: 'Engineering',
      jobTitle: 'Developer',
      joiningDate: new Date(),
      status: 'INACTIVE'
    });

    // Test: Successful Signup
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@test.com',
        password: 'StrongPassword123!',
        employeeCode: 'TEST_AUTH_ACTIVE',
        role: 'ADMIN' // Malicious attempt
      });
    
    if (signupRes.status !== 201) throw new Error(`Expected 201, got ${signupRes.status}`);
    if (!signupRes.body.data.token) throw new Error('No token returned');
    if (signupRes.body.data.user.passwordHash) throw new Error('passwordHash leaked in response');
    if (signupRes.body.data.user.role !== 'EMPLOYEE') throw new Error('Role is not EMPLOYEE');
    
    // Verify bcrypt hash is stored in DB
    const dbUser = await User.findOne({ email: 'alice@test.com' }).select('+passwordHash');
    const isMatch = await bcrypt.compare('StrongPassword123!', dbUser.passwordHash);
    if (!isMatch) throw new Error('Password hash does not match');
    console.log('✅ Successful signup');
    
    const activeEmployee2 = await Employee.create({
      employeeCode: 'TEST_AUTH_ACTIVE2',
      firstName: 'Charlie',
      lastName: 'Brown',
      department: 'Engineering',
      jobTitle: 'Developer',
      joiningDate: new Date(),
      status: 'ACTIVE'
    });

    // Test: Duplicate email
    const dupEmailRes = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'alice@test.com',
        password: 'Password123!',
        employeeCode: 'TEST_AUTH_ACTIVE2'
      });
    if (dupEmailRes.status !== 409) throw new Error(`Expected 409 for duplicate email, got ${dupEmailRes.status}`);
    console.log('✅ Duplicate email rejected (409)');

    // Test: Duplicate employee mapping
    const dupEmpRes = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Alice2',
        lastName: 'Smith2',
        email: 'alice2@test.com',
        password: 'Password123!',
        employeeCode: 'TEST_AUTH_ACTIVE'
      });
    if (dupEmpRes.status !== 409) throw new Error(`Expected 409 for duplicate employee, got ${dupEmpRes.status}`);
    console.log('✅ Duplicate employee linked rejected (409)');

    // Test: Inactive employee
    const inactiveRes = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@test.com',
        password: 'Password123!',
        employeeCode: 'TEST_AUTH_INACTIVE'
      });
    if (inactiveRes.status !== 400) throw new Error(`Expected 400 for inactive employee, got ${inactiveRes.status}`);
    console.log('✅ Inactive employee rejected (400)');

    // Test: Nonexistent employee
    const noEmpRes = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Ghost',
        lastName: 'Man',
        email: 'ghost@test.com',
        password: 'Password123!',
        employeeCode: 'NO_SUCH_EMPLOYEE'
      });
    if (noEmpRes.status !== 404) throw new Error(`Expected 404 for nonexistent employee, got ${noEmpRes.status}`);
    console.log('✅ Nonexistent employee rejected (404)');


    console.log('\n--- LOGIN TESTS ---');

    // Test: Successful login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@test.com',
        password: 'StrongPassword123!'
      });
    if (loginRes.status !== 200) throw new Error(`Expected 200, got ${loginRes.status}`);
    if (!loginRes.body.data.token) throw new Error('No token returned');
    if (loginRes.body.data.user.passwordHash) throw new Error('passwordHash leaked in response');
    const validToken = loginRes.body.data.token;
    console.log('✅ Successful login');

    // Test: Wrong password
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@test.com',
        password: 'WrongPassword'
      });
    if (wrongPassRes.status !== 401) throw new Error(`Expected 401 for wrong password, got ${wrongPassRes.status}`);
    console.log('✅ Wrong password rejected (401)');

    // Test: Nonexistent email
    const noEmailRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@test.com',
        password: 'StrongPassword123!'
      });
    if (noEmailRes.status !== 401) throw new Error(`Expected 401 for nonexistent email, got ${noEmailRes.status}`);
    console.log('✅ Nonexistent email rejected (401)');

    // Test: Inactive user
    await User.updateOne({ email: 'alice@test.com' }, { isActive: false });
    const inactiveUserRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@test.com',
        password: 'StrongPassword123!'
      });
    if (inactiveUserRes.status !== 403) throw new Error(`Expected 403 for inactive user, got ${inactiveUserRes.status}`);
    console.log('✅ Inactive user rejected (403)');
    await User.updateOne({ email: 'alice@test.com' }, { isActive: true }); // restore


    console.log('\n--- ME ENDPOINT TESTS ---');

    // Test: Successful /me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`);
    if (meRes.status !== 200) throw new Error(`Expected 200, got ${meRes.status}`);
    if (meRes.body.data.email !== 'alice@test.com') throw new Error('Wrong user returned');
    if (meRes.body.data.passwordHash) throw new Error('passwordHash leaked in response');
    console.log('✅ Successful /me fetch');

    // Test: Missing token
    const missingTokenRes = await request(app)
      .get('/api/auth/me');
    if (missingTokenRes.status !== 401) throw new Error(`Expected 401 for missing token, got ${missingTokenRes.status}`);
    console.log('✅ Missing token rejected (401)');

    // Test: Invalid token
    const invalidTokenRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.string');
    if (invalidTokenRes.status !== 401) throw new Error(`Expected 401 for invalid token, got ${invalidTokenRes.status}`);
    console.log('✅ Invalid token rejected (401)');

    // Test: Inactive user via token
    await User.updateOne({ email: 'alice@test.com' }, { isActive: false });
    const inactiveMeRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`);
    if (inactiveMeRes.status !== 401) throw new Error(`Expected 401 for inactive user via token, got ${inactiveMeRes.status}`);
    console.log('✅ Inactive user via token rejected (401)');
    await User.updateOne({ email: 'alice@test.com' }, { isActive: true }); // restore


    console.log('\n--- RBAC TESTS ---');

    // Mount temporary routes for RBAC testing on a new Express instance
    const express = require('express');
    const rbacApp = express();
    const { protect } = require('../src/middleware/authMiddleware');
    const { requireRole } = require('../src/middleware/roleMiddleware');
    
    rbacApp.use(express.json());
    rbacApp.get('/api/test-admin', protect, requireRole('ADMIN'), (req, res) => res.json({ success: true }));
    rbacApp.get('/api/test-employee', protect, requireRole('EMPLOYEE'), (req, res) => res.json({ success: true }));

    // Test: EMPLOYEE accessing EMPLOYEE route
    const rbacEmpRes = await request(rbacApp)
      .get('/api/test-employee')
      .set('Authorization', `Bearer ${validToken}`);
    if (rbacEmpRes.status !== 200) throw new Error(`Expected 200, got ${rbacEmpRes.status}`);
    console.log('✅ EMPLOYEE allowed on EMPLOYEE route');

    // Test: EMPLOYEE accessing ADMIN route
    const rbacAdminRes = await request(rbacApp)
      .get('/api/test-admin')
      .set('Authorization', `Bearer ${validToken}`);
    if (rbacAdminRes.status !== 403) throw new Error(`Expected 403, got ${rbacAdminRes.status}`);
    console.log('✅ EMPLOYEE rejected from ADMIN route (403)');


    console.log('\n--- ALL AUTHENTICATION TESTS PASSED ---\n');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    // Clean up
    await User.deleteMany({ email: /@test\.com$/ });
    await Employee.deleteMany({ employeeCode: /^TEST_AUTH_/ });
    await mongoose.disconnect();
  }
}

runTests();
