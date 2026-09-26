const authService = require('../services/authService');
const User = require('../models/User');

class AuthController {
  async signup(req, res, next) {
    try {
      const { firstName, lastName, email, password, employeeCode } = req.body;
      const { user, token } = await authService.signup({ firstName, lastName, email, password, employeeCode });
      
      res.status(201).json({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login({ email, password });
      
      res.status(200).json({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      // req.user is populated by authMiddleware
      const user = await User.findById(req.user._id).populate('employeeId');
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async googleAuth(req, res, next) {
    try {
      const { credential } = req.body;
      const result = await authService.googleAuth(credential);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async googleLink(req, res, next) {
    try {
      const { credential, employeeCode } = req.body;
      const { user, token } = await authService.googleLink({ credential, employeeCode });
      
      res.status(200).json({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new AuthController();
