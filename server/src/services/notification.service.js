const Notification = require('../models/Notification.model');
const { sendComplaintStatusEmail } = require('./email.service');

let io = null;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

const createNotification = async ({
  recipientId,
  title,
  message,
  type,
  linkedModule = null,
  linkedId = null,
  priority = 'normal',
  channel = 'both',
  actionUrl = null,
  sendEmailTo = null,
  emailSubject = null,
}) => {
  try {
    const notification = await Notification.create({
      recipientId,
      title,
      message,
      type,
      linkedModule,
      linkedId,
      priority,
      channel,
      actionUrl,
    });

    // Socket.io real-time push
    if (io) {
      io.to(`user_${recipientId}`).emit('notification:new', {
        notification,
      });
    }

    // Email notification
    if (channel !== 'in_app' && sendEmailTo) {
      sendComplaintStatusEmail(
        sendEmailTo.email,
        sendEmailTo.name,
        emailSubject || title,
        type,
        message
      ).then(() => {
        Notification.findByIdAndUpdate(notification._id, { emailSent: true }).exec();
      });
    }

    return notification;
  } catch (error) {
    console.error(`❌ Notification error: ${error.message}`);
  }
};

const notifyComplaintUpdate = async (complaint, user, statusMessage) => {
  return createNotification({
    recipientId: complaint.complainantId,
    title: `Complaint Update: ${complaint.title}`,
    message: statusMessage,
    type: 'complaint_update',
    linkedModule: 'complaint',
    linkedId: complaint._id,
    priority: complaint.priority === 'emergency' ? 'urgent' : 'normal',
    channel: 'both',
    sendEmailTo: user ? { email: user.email, name: user.name } : null,
    actionUrl: `/student/complaints/${complaint._id}`,
  });
};

const notifyEscalation = async (complaint, targetUserId, escalationReason) => {
  return createNotification({
    recipientId: targetUserId,
    title: `🚨 Escalated Complaint: ${complaint.title}`,
    message: `A complaint has been escalated to you. Reason: ${escalationReason}. Priority: ${complaint.priority.toUpperCase()}`,
    type: 'complaint_escalated',
    linkedModule: 'complaint',
    linkedId: complaint._id,
    priority: 'urgent',
    channel: 'both',
    actionUrl: `/complaints/${complaint._id}`,
  });
};

const notifyCommunitySupport = async (complaint, affectedUserIds) => {
  const promises = affectedUserIds.map((userId) =>
    createNotification({
      recipientId: userId,
      title: `Issue in Your Area: ${complaint.title}`,
      message: `A complaint has been filed about an issue in ${complaint.location?.building || 'your area'}. Are you affected too?`,
      type: 'complaint_community',
      linkedModule: 'complaint',
      linkedId: complaint._id,
      priority: 'normal',
      channel: 'in_app',
      actionUrl: `/student/complaints/${complaint._id}`,
    })
  );
  return Promise.allSettled(promises);
};

const notifyLostFoundMatch = async (userId, reportId, message) => {
  return createNotification({
    recipientId: userId,
    title: '🔍 Potential Match Found!',
    message,
    type: 'lostfound_match',
    linkedModule: 'lostfound',
    linkedId: reportId,
    priority: 'high',
    channel: 'both',
    actionUrl: `/student/lost-found/${reportId}`,
  });
};

module.exports = {
  setSocketIO,
  createNotification,
  notifyComplaintUpdate,
  notifyEscalation,
  notifyCommunitySupport,
  notifyLostFoundMatch,
};
