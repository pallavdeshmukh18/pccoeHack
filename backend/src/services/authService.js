const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { generateToken } = require('../utils/jwt');

const throwError = (msg, code) => {
  const err = new Error(msg);
  err.statusCode = code;
  throw err;
};

class AuthService {
  async signup({ firstName, lastName, email, password, employeeCode }) {
    if (!firstName || !lastName || !email || !password || !employeeCode) {
      throwError('All fields are required', 400);
    }
    
    if (password.length < 8) {
      throwError('Password must be at least 8 characters long', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const employee = await Employee.findOne({ employeeCode: employeeCode.trim() });
    if (!employee) {
      throwError('Employee not found', 404);
    }

    if (employee.status !== 'ACTIVE') {
      throwError('Employee is not active', 400);
    }

    const existingUserWithEmployee = await User.findOne({ employeeId: employee._id });
    if (existingUserWithEmployee) {
      throwError('Employee is already linked to a user', 409);
    }

    const existingUserWithEmail = await User.findOne({ email: normalizedEmail });
    if (existingUserWithEmail) {
      throwError('Email is already in use', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: `${firstName} ${lastName}`,
      email: normalizedEmail,
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: employee._id,
      isActive: true
    });

    const token = generateToken({ id: user._id, role: user.role });

    return { user, token };
  }

  async login({ email, password }) {
    if (!email || !password) {
      throwError('Email and password are required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash').populate('employeeId');
    if (!user) {
      throwError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throwError('User is not active', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throwError('Invalid credentials', 401);
    }

    const token = generateToken({ id: user._id, role: user.role });

    return { user, token };
  }

  async googleAuth(credential) {
    let payload;
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credential}` }
      });
      
      if (response.ok) {
        payload = await response.json();
      } else {
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      }
    } catch (error) {
      throwError('Invalid Google credential', 401);
    }

    const email = payload.email.toLowerCase().trim();
    const user = await User.findOne({ email });
    const picture = payload.picture || null;

    if (user) {
      if (!user.isActive) throwError('User is not active', 403);
      
      let changed = false;
      if (picture && user.avatarUrl !== picture) {
        user.avatarUrl = picture;
        changed = true;
      }

      if (user.employeeId) {
        if (changed) await user.save();
        const token = generateToken({ id: user._id, role: user.role });
        return { user, token, action: 'LOGIN_SUCCESS' };
      }
      
      // CASE B - Existing user + no employee linked
      if (changed) await user.save();
      return { action: 'EMPLOYEE_LINK_REQUIRED' };
    }

    // CASE C - No existing User
    return { action: 'EMPLOYEE_LINK_REQUIRED' };
  }

  async googleLink({ credential, employeeCode }) {
    if (!employeeCode) throwError('Employee code is required', 400);

    let payload;
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credential}` }
      });
      
      if (response.ok) {
        payload = await response.json();
      } else {
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      }
    } catch (error) {
      throwError('Invalid Google credential', 401);
    }

    const email = payload.email.toLowerCase().trim();
    const picture = payload.picture || null;
    
    const employee = await Employee.findOne({ employeeCode: employeeCode.trim() });
    if (!employee) throwError('Employee not found', 404);
    if (employee.status !== 'ACTIVE') throwError('Employee is not active', 400);

    const existingUserWithEmployee = await User.findOne({ employeeId: employee._id });
    if (existingUserWithEmployee) throwError('Employee is already linked to a user', 409);

    let user = await User.findOne({ email });
    if (user) {
      if (user.employeeId) throwError('Email is already in use and linked', 409);
      user.employeeId = employee._id;
      if (picture && user.avatarUrl !== picture) user.avatarUrl = picture;
      await user.save();
    } else {
      const salt = await bcrypt.genSalt(10);
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
        email,
        passwordHash,
        role: 'EMPLOYEE',
        employeeId: employee._id,
        isActive: true,
        avatarUrl: picture
      });
    }

    const token = generateToken({ id: user._id, role: user.role });
    return { user, token };
  }
}

module.exports = new AuthService();
