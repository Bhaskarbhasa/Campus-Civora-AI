const mongoose = require('mongoose');

const slaConfigSchema = new mongoose.Schema(
  {
    priority: { type: String, enum: ['low', 'medium', 'high', 'emergency'], required: true, unique: true },
    responseTimeHours: { type: Number, required: true }, // time to start action
    resolutionTimeHours: { type: Number, required: true }, // time to complete
    escalationSteps: [
      {
        afterHours: Number, // escalate after these hours of inactivity
        escalateTo: String, // role to escalate to
        notifyRoles: [String],
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SLAConfig', slaConfigSchema);
