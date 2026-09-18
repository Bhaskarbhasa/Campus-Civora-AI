const cron = require('node-cron');
const Complaint = require('../models/Complaint.model');
const User = require('../models/User.model');
const { notifyEscalation } = require('../services/notification.service');

const ESCALATION_CHAIN = ['warden', 'chief_warden', 'student_welfare', 'principal', 'director'];

const runEscalationJob = () => {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('⏰ Running SLA escalation check...');
      const now = new Date();

      // Find complaints past SLA deadline that are still open
      const overdueComplaints = await Complaint.find({
        slaDeadline: { $lt: now },
        status: { $nin: ['closed', 'rejected', 'duplicate', 'merged', 'escalated'] },
        escalationLevel: { $lt: 4 },
      }).limit(50);

      for (const complaint of overdueComplaints) {
        const nextLevel = Math.min(complaint.escalationLevel + 1, 4);
        const nextRole = ESCALATION_CHAIN[nextLevel];

        const targetUser = await User.findOne({ role: nextRole, isActive: true });
        if (targetUser) {
          await notifyEscalation(complaint, targetUser._id, `SLA deadline exceeded. Complaint has been pending for too long.`);
        }

        const newSLAHours = { 0: 48, 1: 24, 2: 12, 3: 6, 4: 2 };
        const newDeadline = new Date(now.getTime() + (newSLAHours[nextLevel] || 24) * 3600000);

        await Complaint.findByIdAndUpdate(complaint._id, {
          escalationLevel: nextLevel,
          status: 'escalated',
          $push: {
            escalationHistory: { escalatedTo: nextRole, escalatedAt: now, reason: 'SLA breach' },
            timeline: {
              status: 'escalated',
              message: `Auto-escalated to ${nextRole.replace(/_/g, ' ')} due to SLA breach.`,
              performedByName: 'System',
              performedByRole: 'system',
            },
          },
          slaDeadline: newDeadline,
        });
      }

      if (overdueComplaints.length > 0) {
        console.log(`✅ Escalated ${overdueComplaints.length} overdue complaints.`);
      }

      // Close expired lost & found reports (after 30 days)
      const LostFound = require('../models/LostFound.model');
      await LostFound.updateMany(
        { status: 'active', createdAt: { $lt: new Date(Date.now() - 30 * 24 * 3600000) } },
        { status: 'expired' }
      );

      // Close expired polls
      const Poll = require('../models/Poll.model');
      await Poll.updateMany({ status: 'active', closeAt: { $lt: now } }, { status: 'closed' });

      // Petition Auto-Escalation
      const Petition = require('../models/Petition.model');
      const { createNotification } = require('../services/notification.service');
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600000);
      const overduePetitions = await Petition.find({ status: 'under_review', updatedAt: { $lt: sevenDaysAgo } });
      
      for (const petition of overduePetitions) {
        const director = await User.findOne({ role: 'director', isActive: true });
        if (director) {
          await createNotification({
            recipientId: director._id,
            title: `Petition Escalated: ${petition.title}`,
            message: `A petition has been under review by Student Welfare for over 7 days. It has been escalated to you for a final decision.`,
            type: 'petition_milestone',
            linkedModule: 'petition',
            linkedId: petition._id,
            priority: 'urgent',
          });
        }
        await Petition.findByIdAndUpdate(petition._id, {
          status: 'escalated',
          $push: {
            timeline: {
              action: 'escalated',
              performedByName: 'System',
              comment: 'Auto-escalated to Director due to 7 days of inactivity by Student Welfare.'
            }
          }
        });
      }

    } catch (error) {
      console.error('❌ Escalation job error:', error.message);
    }
  });

  console.log('⏰ SLA escalation cron job started.');
};

module.exports = { runEscalationJob };
