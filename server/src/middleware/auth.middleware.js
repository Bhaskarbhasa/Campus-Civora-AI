const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId).select('-passwordHash -refreshToken -otpHash -otpExpiry');
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated.' });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

// Super admin or specific roles
const authorizeAny = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const allAllowed = ['super_admin', ...roles];
    if (!allAllowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    next();
  };
};

const MAINTENANCE_ROLES = ['electrician', 'plumber', 'carpenter', 'civil_maintenance', 'network_technician', 'housekeeping'];
const AUTHORITY_ROLES = ['warden', 'chief_warden', 'hod', 'dean', 'student_welfare', 'registrar', 'principal', 'director', 'super_admin', 'maintenance_supervisor'];
const ADMIN_ROLES = ['registrar', 'principal', 'director', 'super_admin'];

module.exports = { protect, authorize, authorizeAny, MAINTENANCE_ROLES, AUTHORITY_ROLES, ADMIN_ROLES };
