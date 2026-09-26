const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { requireRole } = require('./roleMiddleware');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user no longer exists' });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Not authorized, user is inactive' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } catch (error) {
    next(error);
  }
};

const requireOwnership = (req, res, next) => {
  // If user is ADMIN, allow
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  // If employee ID in params matches user's employeeId, allow
  const targetId = req.params.employeeId || req.body.employeeId;
  if (req.user && req.user.employeeId && req.user.employeeId.toString() === targetId) {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Not authorized to access this resource' });
};

module.exports = { 
    protect, 
    requireOwnership, 
    authorize: requireRole // alias for ease
};
