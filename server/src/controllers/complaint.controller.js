const Complaint = require('../models/Complaint.model');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const { analyzeComplaint, checkDuplicate } = require('../services/ai.service');
const { notifyComplaintUpdate, notifyEscalation, notifyCommunitySupport, createNotification } = require('../services/notification.service');
const { uploadToCloudinary } = require('../config/cloudinary');

let io = null;
const setSocketIO = (socketIO) => { io = socketIO; };

// POST /api/complaints
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, subCategory, location, isPublic, isEmergency } = req.body;
    const locationData = typeof location === 'string' ? JSON.parse(location) : location;

    // Upload evidence files if any
    const evidenceFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'campus-civora/complaints');
        evidenceFiles.push({ url: result.secure_url, publicId: result.public_id, fileType: file.mimetype.split('/')[0] });
      }
    }

    const complaint = await Complaint.create({
      complainantId: req.user._id,
      title,
      description,
      category,
      subCategory,
      location: locationData,
      isPublic: isPublic !== undefined ? isPublic : true,
      isEmergency: isEmergency || false,
      evidenceFiles,
      status: 'submitted',
      timeline: [{
        status: 'submitted',
        message: 'Complaint submitted by student.',
        performedBy: req.user._id,
        performedByName: req.user.name,
        performedByRole: req.user.role,
      }],
    });

    // Async AI processing
    processComplaintWithAI(complaint, req.user);

    await AuditLog.create({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'create_complaint', module: 'complaint', targetId: complaint._id });

    res.status(201).json({ success: true, message: 'Complaint submitted successfully.', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const processComplaintWithAI = async (complaint, user) => {
  try {
    // Update status to AI processing
    await Complaint.findByIdAndUpdate(complaint._id, { status: 'ai_processing' });
    if (io) io.to(`user_${complaint.complainantId}`).emit('complaint:status_changed', { complaintId: complaint._id, status: 'ai_processing' });

    const aiResult = await analyzeComplaint(complaint);

    // Check for duplicates in last 7 days same building/category
    const recentComplaints = await Complaint.find({
      category: complaint.category,
      'location.building': complaint.location?.building,
      status: { $nin: ['closed', 'rejected', 'duplicate'] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      _id: { $ne: complaint._id },
    }).limit(5);

    const duplicateId = await checkDuplicate(complaint, recentComplaints);

    // Set SLA deadline
    const slaHours = { emergency: 2, high: 24, medium: 48, low: 120 };
    const priority = aiResult.predictedPriority || 'medium';
    const slaDeadline = new Date(Date.now() + (slaHours[priority] || 48) * 60 * 60 * 1000);

    const updates = {
      aiAnalysis: { ...aiResult, isDuplicate: !!duplicateId, duplicateOf: duplicateId, processed: true },
      priority: aiResult.predictedPriority || complaint.priority,
      assignedDepartment: aiResult.suggestedDepartment,
      status: duplicateId ? 'duplicate' : (complaint.isEmergency || aiResult.isEmergency ? 'escalated' : 'under_verification'),
      slaDeadline,
      $push: {
        timeline: {
          status: duplicateId ? 'duplicate' : 'under_verification',
          message: duplicateId
            ? `AI identified this as a duplicate of an existing complaint.`
            : `AI analysis complete. Priority: ${priority}. Routed to: ${aiResult.suggestedDepartment}`,
          performedByName: 'AI Engine',
          performedByRole: 'ai',
        },
      },
    };

    if (duplicateId) {
      await Complaint.findByIdAndUpdate(duplicateId, { $addToSet: { linkedComplaints: complaint._id } });
    }

    await Complaint.findByIdAndUpdate(complaint._id, updates);

    // Notify student
    await notifyComplaintUpdate(
      { ...complaint.toObject(), status: updates.status },
      user,
      duplicateId
        ? 'Your complaint has been identified as a duplicate. You\'ll receive updates from the original complaint.'
        : `Your complaint has been analyzed. Priority: ${priority.toUpperCase()}. Under verification.`
    );

    // Community support for shared infrastructure
    if (!duplicateId && (complaint.category === 'internet_connectivity' || complaint.category === 'electrical' || complaint.category === 'plumbing')) {
      const affectedUsers = await User.find({
        hostelBlock: complaint.location?.hostelBlock,
        _id: { $ne: complaint.complainantId },
        role: 'student',
        isActive: true,
      }).limit(20).select('_id');

      if (affectedUsers.length > 0) {
        await notifyCommunitySupport(complaint, affectedUsers.map((u) => u._id));
      }
    }

    if (io) io.to(`user_${complaint.complainantId}`).emit('complaint:status_changed', { complaintId: complaint._id, status: updates.status, aiAnalysis: aiResult });
  } catch (error) {
    console.error('AI processing error:', error.message);
    await Complaint.findByIdAndUpdate(complaint._id, { status: 'under_verification' });
  }
};

// GET /api/complaints
const getComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, priority, search } = req.query;
    const query = {};
    const user = req.user;

    // Role-based filtering
    if (user.role === 'student') {
      query.complainantId = user._id;
    } else if (user.role === 'warden') {
      query['location.building'] = user.hostelBlock;
      query.status = { $in: ['under_verification', 'submitted', 'ai_processing'] };
      console.log('Warden Query:', query, 'Warden Block:', user.hostelBlock);
    } else if (user.role === 'class_advisor' || user.role === 'faculty') {
      // Class Advisors see Academic Block complaints from students in their department
      const User = require('../models/User.model');
      const studentsInDept = await User.find({ department: user.department, role: 'student' }).distinct('_id');
      query.complainantId = { $in: studentsInDept };
      query['location.building'] = 'Academic Block';
      query.status = { $in: ['under_verification', 'submitted', 'ai_processing'] };
    } else if (user.role === 'lab_assistant') {
      // Lab assistants use the 'hostelBlock' database field to store their assigned Lab name
      query['location.building'] = user.hostelBlock;
      query.status = { $in: ['under_verification', 'submitted', 'ai_processing'] };
    } else if (user.role === 'chief_warden') {
      const HOSTELS = ['Koushitaki Bhavan', 'Chandogya Bhavan', 'Aitareya Bhavan', 'Pranava Bhavan', 'Maitri Bhavan', 'Aswini Bhavan'];
      const LABS = ['RHISC Lab', 'VIBES Lab', 'ASRA Lab', 'SHIELD Lab', 'AI Innovation Lab', 'Computer Lab 1 & 2'];
      
      query.$or = [
        { 
          'location.building': { $in: HOSTELS }, 
          status: { $in: ['verified', 'escalated', 'approved', 'assigned', 'work_in_progress'] } 
        },
        { 
          'location.building': { $nin: [...HOSTELS, ...LABS, 'Academic Block'] },
          status: { $in: ['submitted', 'ai_processing', 'under_verification', 'verified', 'escalated', 'approved', 'assigned', 'work_in_progress'] }
        }
      ];
    } else if (['electrician', 'plumber', 'carpenter', 'civil_maintenance', 'network_technician', 'housekeeping'].includes(user.role)) {
      query.assignedTo = user._id;
    } else if (user.role === 'maintenance_supervisor') {
      // Maintenance Supervisors see all complaints that have been approved by CW/Advisor/Lab and are ready for assignment or in progress
      query.status = { $in: ['approved', 'assigned', 'work_in_progress', 'resolved'] };
    } else if (user.role === 'hod') {
      query.assignedDepartment = user.department;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) query.$text = { $search: search };

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('complainantId', 'name email rollNumber department year')
      .populate('assignedTo', 'name role designation')
      .populate('verifiedBy', 'name role')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, complaints, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/complaints/:id
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('complainantId', 'name email rollNumber department year hostelBlock roomNumber phone')
      .populate('assignedTo', 'name role designation phone')
      .populate('verifiedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('aiAnalysis.duplicateOf', 'title status')
      .populate('communitySupport.userId', 'name department year');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Access control
    const user = req.user;
    if (user.role === 'student' && complaint.complainantId._id.toString() !== user._id.toString() && !complaint.isPublic) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/complaints/:id/verify  [warden]
const verifyComplaint = async (req, res) => {
  try {
    const { action, note, evidence } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const isAcademic = ['class_advisor', 'lab_assistant'].includes(req.user.role);
    const newStatus = action === 'verify' ? (isAcademic ? 'approved' : 'verified') : 'rejected';
    
    let roleName = 'Warden';
    if (req.user.role === 'class_advisor') roleName = 'Class Advisor';
    if (req.user.role === 'lab_assistant') roleName = 'Lab Assistant';
    
    const timelineMsg = action === 'verify' 
      ? `Complaint ${isAcademic ? 'approved' : 'verified'} by ${roleName}. ${note || ''}` 
      : `Complaint rejected by ${roleName}. Reason: ${note}`;

    const updateData = {
      status: newStatus,
      verificationNote: note,
      rejectionReason: action === 'reject' ? note : null,
      $push: {
        timeline: {
          status: newStatus,
          message: timelineMsg,
          performedBy: req.user._id,
          performedByName: req.user.name,
          performedByRole: req.user.role,
        },
      },
    };

    if (isAcademic) {
      updateData.approvedBy = req.user._id;
    } else {
      updateData.verifiedBy = req.user._id;
    }

    const updated = await Complaint.findByIdAndUpdate(complaint._id, updateData, { new: true }).populate('complainantId');

    const studentUser = updated.complainantId;
    await notifyComplaintUpdate(updated, studentUser, timelineMsg);

    if (action === 'verify') {
      if (isAcademic) {
        // Academic complaints go straight to Maintenance
        const supervisors = await User.find({ role: 'maintenance_supervisor', isActive: true });
        for (const sup of supervisors) {
          await createNotification({
            recipientId: sup._id,
            title: `New Approved Complaint: ${complaint.title}`,
            message: `A complaint has been approved by ${roleName} ${req.user.name} and awaits your assignment.`,
            type: 'complaint_update',
            relatedId: complaint._id,
            metadata: { url: `/maintenance/supervisor/complaints` }
          });
        }
        if (io) io.to('role_maintenance_supervisor').emit('complaint:approved', { complaint: updated });
      } else {
        // Hostel complaints go to Chief Warden
        const chiefWarden = await User.findOne({ role: 'chief_warden', isActive: true });
        if (chiefWarden) {
          await createNotification({
            recipientId: chiefWarden._id,
            title: `Complaint Verified: ${complaint.title}`,
            message: `A complaint has been verified by Warden ${req.user.name} and awaits your approval.`,
            type: 'complaint_update',
            relatedId: complaint._id,
            metadata: { url: `/chief-warden/complaints` }
          });
        }
        if (io) io.to('role_chief_warden').emit('complaint:verified', { complaint: updated });
      }
    }

    res.json({ success: true, message: `Complaint ${newStatus}.`, complaint: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/complaints/:id/approve  [chief_warden]
const approveComplaint = async (req, res) => {
  try {
    const { action, note } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updated = await Complaint.findByIdAndUpdate(
      complaint._id,
      {
        status: newStatus,
        approvedBy: req.user._id,
        $push: {
          timeline: {
            status: newStatus,
            message: `${action === 'approve' ? 'Approved' : 'Rejected'} by Chief Warden. ${note || ''}`,
            performedBy: req.user._id,
            performedByName: req.user.name,
            performedByRole: req.user.role,
          },
        },
      },
      { new: true }
    ).populate('complainantId');

    await notifyComplaintUpdate(updated, updated.complainantId, `Your complaint has been ${newStatus} by the Chief Warden.`);

    // Notify Maintenance Supervisor if approved
    if (action === 'approve') {
      const supervisors = await User.find({ role: 'maintenance_supervisor', isActive: true });
      for (const sup of supervisors) {
        await createNotification({
          recipientId: sup._id,
          title: `New Complaint for Assignment: ${complaint.title}`,
          message: `A complaint has been approved and needs technician assignment. Category: ${complaint.category}`,
          type: 'complaint_assigned',
          linkedModule: 'complaint',
          linkedId: complaint._id,
          priority: complaint.priority === 'emergency' ? 'urgent' : 'high',
        });
      }
    }

    res.json({ success: true, message: `Complaint ${newStatus}.`, complaint: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/complaints/:id/assign  [maintenance_supervisor]
const assignComplaint = async (req, res) => {
  try {
    const { technicianId, note } = req.body;
    const technician = await User.findById(technicianId);
    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found.' });

    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status: 'assigned',
        assignedTo: technicianId,
        $push: {
          timeline: {
            status: 'assigned',
            message: `Assigned to ${technician.name} (${technician.designation || technician.role}). ${note || ''}`,
            performedBy: req.user._id,
            performedByName: req.user.name,
            performedByRole: req.user.role,
          },
        },
      },
      { new: true }
    ).populate('complainantId');

    // Notify technician
    await createNotification({
      recipientId: technicianId,
      title: `New Work Order: ${updated.title}`,
      message: `You have been assigned a new task. Location: ${updated.location?.building}. Priority: ${updated.priority.toUpperCase()}`,
      type: 'complaint_assigned',
      linkedModule: 'complaint',
      linkedId: updated._id,
      priority: updated.priority === 'emergency' ? 'urgent' : 'high',
    });

    await notifyComplaintUpdate(updated, updated.complainantId, `Your complaint has been assigned to ${technician.name}.`);

    if (io) io.to(`user_${technicianId}`).emit('complaint:assigned', { complaint: updated });

    res.json({ success: true, message: 'Complaint assigned.', complaint: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/complaints/:id/update-work  [technician]
const updateWorkProgress = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = ['work_in_progress', 'waiting_for_materials', 'quality_inspection', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status for technician.' });
    }

    const evidenceFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'campus-civora/progress');
        evidenceFiles.push({ url: result.secure_url, publicId: result.public_id, type: file.mimetype.split('/')[0] });
      }
    }

    const finalStatus = status === 'completed' ? 'pending_student_verification' : status;

    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status: finalStatus,
        resolvedAt: status === 'completed' ? new Date() : null,
        $push: {
          timeline: {
            status: finalStatus,
            message: note || `Status updated to ${finalStatus.replace(/_/g, ' ')}.`,
            performedBy: req.user._id,
            performedByName: req.user.name,
            performedByRole: req.user.role,
            evidence: evidenceFiles,
          },
        },
      },
      { new: true }
    ).populate('complainantId');

    if (status === 'completed') {
      await notifyComplaintUpdate(updated, updated.complainantId, 'Work has been completed. Please verify if your issue is resolved.');
    }

    res.json({ success: true, message: 'Work progress updated.', complaint: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/complaints/:id/verify-completion  [student]
const verifyCompletion = async (req, res) => {
  try {
    const { satisfied, comment, rating } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaint.complainantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only verify your own complaint.' });
    }

    const newStatus = satisfied ? 'closed' : 'reopened';
    const updated = await Complaint.findByIdAndUpdate(
      complaint._id,
      {
        status: newStatus,
        closedAt: satisfied ? new Date() : null,
        studentVerification: { verified: satisfied, verifiedAt: new Date(), comment, rating },
        $push: {
          timeline: {
            status: newStatus,
            message: satisfied ? `Student confirmed resolution. Rating: ${rating}/5. ${comment || ''}` : `Student reported issue not resolved. Reopened. ${comment || ''}`,
            performedBy: req.user._id,
            performedByName: req.user.name,
            performedByRole: req.user.role,
          },
        },
      },
      { new: true }
    );

    res.json({ success: true, message: satisfied ? 'Complaint closed.' : 'Complaint reopened.', complaint: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/complaints/:id/community-support
const addCommunitySupport = async (req, res) => {
  try {
    const { comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const alreadySupported = complaint.communitySupport.some(
      (s) => s.userId.toString() === req.user._id.toString()
    );
    if (alreadySupported) return res.status(400).json({ success: false, message: 'You already supported this complaint.' });

    const updated = await Complaint.findByIdAndUpdate(
      complaint._id,
      { $push: { communitySupport: { userId: req.user._id, comment } } },
      { new: true }
    );

    res.json({ success: true, message: 'Support added.', supportCount: updated.communitySupport.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/complaints/stats
const getComplaintStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const byPriority = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, byStatus: stats, byCategory, byPriority });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/complaints/:id/comments
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text is required.' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const comment = {
      userId: req.user._id,
      name: req.user.name,
      role: req.user.role,
      text
    };

    const updated = await Complaint.findByIdAndUpdate(
      complaint._id,
      { $push: { comments: comment } },
      { new: true }
    );

    res.json({ success: true, message: 'Comment added.', comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createComplaint, getComplaints, getComplaintById, verifyComplaint, approveComplaint, assignComplaint, updateWorkProgress, verifyCompletion, addCommunitySupport, getComplaintStats, setSocketIO, addComment };
