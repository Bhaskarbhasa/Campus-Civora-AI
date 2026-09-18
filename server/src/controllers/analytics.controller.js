const Complaint = require('../models/Complaint.model');
const User = require('../models/User.model');
const Petition = require('../models/Petition.model');
const Poll = require('../models/Poll.model');
const LostFound = require('../models/LostFound.model');

const getUniversityAnalytics = async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const closedComplaints = await Complaint.countDocuments({ status: 'closed' });
    const openComplaints = await Complaint.countDocuments({ status: { $nin: ['closed', 'rejected', 'duplicate'] } });
    const emergencyComplaints = await Complaint.countDocuments({ priority: 'emergency' });

    const byCategory = await Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const byStatus = await Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const byPriority = await Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);
    const byBuilding = await Complaint.aggregate([{ $group: { _id: '$location.building', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);

    const avgResolutionTime = await Complaint.aggregate([
      { $match: { status: 'closed', closedAt: { $ne: null } } },
      { $project: { duration: { $subtract: ['$closedAt', '$createdAt'] } } },
      { $group: { _id: null, avgMs: { $avg: '$duration' } } },
    ]);

    const monthlyTrend = await Complaint.aggregate([
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    const totalUsers = await User.countDocuments({ isActive: true });
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const activePetitions = await Petition.countDocuments({ status: 'active' });
    const activePolls = await Poll.countDocuments({ status: 'active' });
    const activeLostFound = await LostFound.countDocuments({ status: 'active' });

    // Student satisfaction (avg rating of closed complaints)
    const satisfactionAgg = await Complaint.aggregate([
      { $match: { status: 'closed', 'studentVerification.rating': { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$studentVerification.rating' } } },
    ]);

    res.json({
      success: true,
      analytics: {
        overview: { totalComplaints, closedComplaints, openComplaints, emergencyComplaints, totalUsers, totalStudents, activePetitions, activePolls, activeLostFound },
        byCategory, byStatus, byPriority, byBuilding,
        avgResolutionHours: avgResolutionTime[0] ? (avgResolutionTime[0].avgMs / 3600000).toFixed(1) : null,
        satisfactionScore: satisfactionAgg[0] ? satisfactionAgg[0].avgRating.toFixed(1) : null,
        monthlyTrend,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDepartmentAnalytics = async (req, res) => {
  try {
    const { department } = req.params;
    const query = department && department !== 'all' ? { assignedDepartment: department } : {};

    const stats = await Complaint.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const avgResolution = await Complaint.aggregate([
      { $match: { ...query, status: 'closed', closedAt: { $ne: null } } },
      { $project: { duration: { $subtract: ['$closedAt', '$createdAt'] } } },
      { $group: { _id: null, avgMs: { $avg: '$duration' } } },
    ]);

    res.json({ success: true, stats, avgResolutionHours: avgResolution[0] ? (avgResolution[0].avgMs / 3600000).toFixed(1) : null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const myComplaints = await Complaint.countDocuments({ complainantId: userId });
    const myClosed = await Complaint.countDocuments({ complainantId: userId, status: 'closed' });
    const myPetitions = await Petition.countDocuments({ creatorId: userId });
    const recentComplaints = await Complaint.find({ complainantId: userId }).sort({ createdAt: -1 }).limit(5).select('title status priority createdAt');
    res.json({ success: true, analytics: { myComplaints, myClosed, myPetitions, recentComplaints } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUniversityAnalytics, getDepartmentAnalytics, getUserAnalytics };
