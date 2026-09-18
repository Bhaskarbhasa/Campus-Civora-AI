const User = require('../models/User.model');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Warden, Chief Warden, Super Admin)
const getUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    
    let query = {};
    
    // Role-based scoping
    const userRole = req.user.role;
    if (userRole === 'maintenance_supervisor') {
      query.role = { $in: ['electrician', 'plumber', 'carpenter', 'civil_maintenance', 'network_technician', 'housekeeping'] };
    } else if (userRole === 'warden' || userRole === 'chief_warden') {
      query.role = { $in: ['student', 'warden', 'security', 'housekeeping'] };
    } else if (userRole !== 'super_admin' && userRole !== 'director' && userRole !== 'dean') {
      return res.status(403).json({ success: false, message: 'You do not have permission to view users' });
    }

    if (role && (!query.role || query.role.$in.includes(role))) {
      query.role = role;
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-passwordHash -refreshToken -otpHash -otpExpiry').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Private
const createUser = async (req, res) => {
  try {
    const { name, email, role, department, hostelBlock } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      role,
      department,
      hostelBlock,
      isVerified: true // created by admin
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const { name, email, role, department, hostelBlock, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Don't allow changing super_admin unless you are super_admin
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify a super admin account' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.department = department || user.department;
    user.hostelBlock = hostelBlock || user.hostelBlock;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete a super admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
