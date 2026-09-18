const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = [
  'student',
  'faculty',
  'warden',
  'chief_warden',
  'maintenance_supervisor',
  'electrician',
  'plumber',
  'carpenter',
  'civil_maintenance',
  'network_technician',
  'housekeeping',
  'hod',
  'dean',
  'class_advisor',
  'lab_assistant',
  'student_welfare',
  'librarian',
  'transport_coordinator',
  'security',
  'mess_manager',
  'lab_assistant',
  'registrar',
  'principal',
  'director',
  'super_admin',
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    role: { type: String, enum: ROLES, required: true },
    department: { type: String, default: null },
    hostelBlock: { type: String, default: null },
    rollNumber: { type: String, default: null, sparse: true },
    year: { type: Number, default: null, min: 1, max: 5 },
    semester: { type: Number, default: null, min: 1, max: 10 },
    phone: { type: String, default: null },
    profilePhoto: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    gender: { type: String, enum: ['male', 'female', 'other', null], default: null },
    section: { type: String, default: null },
    roomNumber: { type: String, default: null },
    employeeId: { type: String, default: null },
    designation: { type: String, default: null },
    reportingTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    campusLocation: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isFirstLogin: { type: Boolean, default: true },
    refreshToken: { type: String, default: null },
    otpHash: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  delete obj.otpHash;
  delete obj.otpExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
