const app = require('../src/app');
const mongoose = require('mongoose');
const request = require('supertest');
require('dotenv').config();

async function testApp() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected DB for Express tests');

  console.log('\\n--- 1. Testing /api/health ---');
  const res1 = await request(app).get('/api/health');
  console.log(res1.status, res1.body);

  console.log('\\n--- 2. Testing 404 handler ---');
  const res2 = await request(app).get('/api/fake-route');
  console.log(res2.status, res2.body);

  console.log('\\n--- 3. Testing 400 ValidationError (global middleware) ---');
  // Trigger missing fields on employee creation
  const res3 = await request(app).post('/api/employees').send({});
  console.log(res3.status, res3.body);

  console.log('\\n--- 4. Testing 400 CastError (global middleware) ---');
  const res4 = await request(app).get('/api/employees/invalid-id');
  console.log(res4.status, res4.body);

  await mongoose.connection.close();
}

testApp();
