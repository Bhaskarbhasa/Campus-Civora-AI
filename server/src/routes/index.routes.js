const express = require('express');
const router = express.Router();
const { protect, authorize, ADMIN_ROLES } = require('../middleware/auth.middleware');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notification.controller');
const { getUniversityAnalytics, getDepartmentAnalytics, getUserAnalytics } = require('../controllers/analytics.controller');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const bcrypt = require('bcryptjs');

// Notifications
router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:id/read', protect, markAsRead);
router.patch('/notifications/read-all', protect, markAllAsRead);

// Analytics
router.get('/analytics/university', protect, authorize(...ADMIN_ROLES, 'dean', 'registrar'), getUniversityAnalytics);
router.get('/analytics/department/:department', protect, getUniversityAnalytics);
router.get('/analytics/me', protect, getUserAnalytics);

// User profile
router.get('/users/me', protect, (req, res) => res.json({ success: true, user: req.user }));
router.patch('/users/me', protect, async (req, res) => {
  try {
    const { name, phone, profilePhoto } = req.body;
    const updated = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin - User Management
router.get('/admin/users', protect, authorize('super_admin', 'principal', 'director', 'registrar'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, department } = req.query;
    const query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin/users', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { name, email, role, department, hostelBlock, designation, employeeId, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists.' });
    const user = await User.create({ name, email: email.toLowerCase(), role, department, hostelBlock, designation, employeeId, phone, isActive: true });
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/admin/users/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/admin/users/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin - Audit Logs
router.get('/admin/audit-logs', protect, authorize('super_admin', 'principal', 'director'), async (req, res) => {
  try {
    const { page = 1, limit = 20, module, action } = req.query;
    const query = {};
    if (module) query.module = module;
    if (action) query.action = { $regex: action, $options: 'i' };
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query).populate('userId', 'name role').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, logs, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
