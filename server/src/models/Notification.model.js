const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'complaint_update',
        'complaint_assigned',
        'complaint_escalated',
        'complaint_closed',
        'complaint_reopened',
        'complaint_community',
        'petition_milestone',
        'petition_decision',
        'poll_available',
        'poll_closed',
        'lostfound_match',
        'lostfound_claimed',
        'system_announcement',
        'emergency_alert',
        'sla_breach',
        'verification_required',
        'general',
      ],
      default: 'general',
    },
    linkedModule: {
      type: String,
      enum: ['complaint', 'petition', 'poll', 'lostfound', 'system', null],
      default: null,
    },
    linkedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    channel: { type: String, enum: ['in_app', 'email', 'both'], default: 'both' },
    emailSent: { type: Boolean, default: false },
    actionUrl: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
