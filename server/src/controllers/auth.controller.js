const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const { sendOTPEmail } = require('../services/email.service');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
  return { accessToken, refreshToken };
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, isStaffRequest, role, department, designation, hostelBlock, year } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required.' });

    const lowerEmail = email.toLowerCase();
    
    let user = await User.findOne({ email: lowerEmail });
    if (user) {
      if (!user.isVerified) return res.status(400).json({ success: false, message: 'Email already registered. Please verify your OTP.', redirect: 'otp' });
      return res.status(400).json({ success: false, message: 'User already exists. Please login.' });
    }

    if (isStaffRequest) {
      // Staff request logic
      user = await User.create({
        name,
        email: lowerEmail,
        role: role || 'staff',
        department,
        hostelBlock,
        designation,
        isVerified: false,
        isActive: false, // Must be approved by admin
        isFirstLogin: true,
      });

      return res.json({ 
        success: true, 
        message: 'Staff registration request submitted successfully. Please wait for an administrator to approve your account before logging in.',
        isPendingAdmin: true
      });
    } else {
      // Student logic
      if (!lowerEmail.endsWith('@ch.students.amrita.edu')) {
        return res.status(400).json({ success: false, message: 'Students must use a valid @ch.students.amrita.edu email address.' });
      }

      // Extract roll number (rough extraction before @)
      const rollNumber = lowerEmail.split('@')[0].toUpperCase();

      user = await User.create({
        name,
        email: lowerEmail,
        role: 'student',
        rollNumber,
        department,
        hostelBlock,
        year,
        isVerified: false,
        isActive: true, // Active immediately for students, they just need OTP
        isFirstLogin: true,
      });

      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, 10);
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await User.findByIdAndUpdate(user._id, { otpHash, otpExpiry });

      console.log(`\n\n=========================================`);
      console.log(`🔔 DEV MODE: OTP FOR ${user.email} IS: ${otp}`);
      console.log(`=========================================\n\n`);

      await sendOTPEmail(user.email, otp, user.name);

      res.json({ success: true, message: `OTP sent to ${user.email}`, name: user.name });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/send-otp
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email. Contact admin for registration.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.findByIdAndUpdate(user._id, { otpHash, otpExpiry });

    console.log(`\n\n=========================================`);
    console.log(`🔔 DEV MODE: OTP FOR ${user.email} IS: ${otp}`);
    console.log(`=========================================\n\n`);

    await sendOTPEmail(user.email, otp, user.name);

    res.json({ success: true, message: `OTP sent to ${user.email}`, name: user.name });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/staff-setup (Bypass OTP for staff initial password setup)
const staffSetup = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is pending approval. Please wait for an Admin to approve.' });
    }
    if (user.passwordHash) {
      return res.status(400).json({ success: false, message: 'Password already set. Please login or use forgot password.' });
    }

    // Bypass OTP: Mark as verified and generate temp token
    await User.findByIdAndUpdate(user._id, { isVerified: true });
    const tempToken = jwt.sign({ userId: user._id, purpose: 'set_password' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
    
    res.json({ success: true, message: 'Staff approved. Proceeding to set password.', tempToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (!user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'No OTP found. Request a new one.' });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Request a new one.' });
    }

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid OTP.' });

    // Clear OTP
    await User.findByIdAndUpdate(user._id, { otpHash: null, otpExpiry: null, isVerified: true });

    // If user already has a password (returning login), generate tokens
    if (user.passwordHash) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: 'OTP verified. Logged in.',
        accessToken,
        user: user.toJSON(),
        requiresPasswordSetup: false,
      });
    }

    // First time - needs to set password
    const tempToken = jwt.sign({ userId: user._id, purpose: 'set_password' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
    res.json({ success: true, message: 'OTP verified.', tempToken, requiresPasswordSetup: true, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/set-password
const setPassword = async (req, res) => {
  try {
    const { tempToken, password } = req.body;
    if (!tempToken || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const decoded = jwt.verify(tempToken, process.env.JWT_ACCESS_SECRET);
    if (decoded.purpose !== 'set_password') {
      return res.status(400).json({ success: false, message: 'Invalid token.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { passwordHash, isFirstLogin: false },
      { new: true }
    );

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await AuditLog.create({ userId: user._id, userName: user.name, userRole: user.role, action: 'set_password', module: 'auth' });

    res.json({ success: true, message: 'Password set successfully.', accessToken, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated.' });
    if (!user.passwordHash) return res.status(400).json({ success: false, message: 'Please complete first-time setup with OTP.' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await AuditLog.create({ userId: user._id, userName: user.name, userRole: user.role, action: 'login', module: 'auth', ipAddress: req.ip });

    res.json({ success: true, accessToken, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/refresh
const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token.' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken, user: user.toJSON() });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET).catch(() => null);
      if (decoded) await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out.' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true, message: 'If this email exists, an OTP has been sent.' });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    await User.findByIdAndUpdate(user._id, { otpHash, otpExpiry: new Date(Date.now() + 10 * 60 * 1000) });
    await sendOTPEmail(user.email, otp, user.name);

    res.json({ success: true, message: 'If this email exists, an OTP has been sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, sendOTP, staffSetup, verifyOTP, setPassword, login, refreshAccessToken, logout, forgotPassword };
