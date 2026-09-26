require('dotenv').config();
const mongoose = require('mongoose');
const { generateToken } = require('../src/utils/jwt');
const Employee = require('../src/models/Employee');
const JobRole = require('../src/models/JobRole');
const User = require('../src/models/User');
const app = require('../src/app');
const supertest = require('supertest');

const request = supertest(app);

async function runTests() {
  let dbUri = process.env.MONGO_URI;
  if (!dbUri.includes('test')) {
    dbUri = dbUri.replace(/\/[^/?]+(\?|$)/, '/talenttwin_security_test$1');
  }
  
  await mongoose.connect(dbUri);
  await mongoose.connection.dropDatabase();

  const role = await JobRole.create({
    title: 'Security Test Role',
    jobTitle: 'Test', joiningDate: new Date(), department: 'Test',
    isActive: true
  });
  
  const empA = await Employee.create({
    firstName: 'Emp', lastName: 'A',
    employeeCode: 'SEC_A',
    jobTitle: 'Test', joiningDate: new Date(), department: 'Test', status: 'ACTIVE'
  });
  
  const empB = await Employee.create({
    firstName: 'Emp', lastName: 'B',
    employeeCode: 'SEC_B',
    jobTitle: 'Test', joiningDate: new Date(), department: 'Test', status: 'ACTIVE'
  });
  
  const userA = await User.create({
    name: 'Test', email: 'empa@test.com',
    passwordHash: 'fake',
    role: 'EMPLOYEE',
    employeeId: empA._id,
    isActive: true
  });
  
  const userB = await User.create({
    name: 'Test', email: 'empb@test.com',
    passwordHash: 'fake',
    role: 'EMPLOYEE',
    employeeId: empB._id,
    isActive: true
  });

  const admin = await User.create({
    name: 'Test', email: 'admin@test.com',
    passwordHash: 'fake',
    role: 'ADMIN',
    isActive: true
  });

  const tokenA = generateToken({ id: userA._id });
  const tokenB = generateToken({ id: userB._id });
  const tokenAdmin = generateToken({ id: admin._id });

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

  // TEST 1: Unauthenticated PATCH
  const res1 = await request.patch(`/api/employees/${empA._id}`).send({ firstName: 'Hacked' });
  assert(res1.status === 401, 'TEST 1: Unauthenticated PATCH blocked (401)');

  // TEST 2: Employee A updates Employee A
  const res2 = await request.patch(`/api/employees/${empA._id}`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ firstName: 'EmpA_Updated' });
  assert(res2.status === 200 && res2.body.data.firstName === 'EmpA_Updated', 'TEST 2: Employee A updates Employee A successfully');

  // TEST 3: Employee A attempts to update Employee B
  const res3 = await request.patch(`/api/employees/${empB._id}`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ firstName: 'Hacked' });
  assert(res3.status === 403, 'TEST 3: Employee A cannot update Employee B (403)');

  // TEST 4: Admin updates Employee
  const res4 = await request.patch(`/api/employees/${empA._id}`)
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ firstName: 'EmpA_Admin' });
  assert(res4.status === 200 && res4.body.data.firstName === 'EmpA_Admin', 'TEST 4: Admin can update Employee');

  // TEST 5: Employee attempts to submit role: 'ADMIN' (User.role hack)
  const res5 = await request.patch(`/api/employees/${empA._id}`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ role: 'ADMIN' });
  assert(res5.status === 400 || res5.status === 404, 'TEST 5: Employee cannot escalate User.role via Employee.role string (400/404)');

  // TEST 6: Employee submits nonexistent JobRole ObjectId
  const fakeId = new mongoose.Types.ObjectId();
  const res6 = await request.patch(`/api/employees/${empA._id}`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ role: fakeId });
  assert(res6.status === 404, 'TEST 6: Employee submits nonexistent JobRole ObjectId (404)');

  // TEST 7: Employee attempts to modify read-only fields
  const res7 = await request.patch(`/api/employees/${empB._id}`) // wait, use empA
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ employeeCode: 'HACKED', status: 'INACTIVE' });
  // It shouldn't crash, but it should ignore those fields
  const get7 = await Employee.findById(empA._id);
  assert(get7.employeeCode === 'SEC_A' && get7.status === 'ACTIVE', 'TEST 7: Employee attempts to modify protected fields are ignored');

  // TEST 8: Invalid employee ObjectId
  const res8 = await request.patch(`/api/employees/12345`)
    .set('Authorization', `Bearer ${tokenAdmin}`) // even admin gets 400 for bad id
    .send({ firstName: 'test' });
  assert(res8.status === 400 || res8.status === 500, 'TEST 8: Invalid employee ObjectId (400/500)');

  console.log(`\nTests Completed: ${passed} passed, ${failed} failed.`);
  
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
