const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['academic', 'administrative', 'maintenance', 'hostel', 'support'],
      required: true,
    },
    headId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    description: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    location: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    complaintCategories: [String], // which categories this dept handles
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
