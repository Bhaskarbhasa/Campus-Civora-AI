const express = require('express');
const router = express.Router();
const { protect, authorize, authorizeAny, MAINTENANCE_ROLES } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const {
  createComplaint, getComplaints, getComplaintById,
  verifyComplaint, approveComplaint, assignComplaint,
  updateWorkProgress, verifyCompletion, addCommunitySupport, getComplaintStats, addComment
} = require('../controllers/complaint.controller');

router.get('/stats', protect, getComplaintStats);
router.get('/', protect, getComplaints);
router.post('/', protect, authorize('student'), upload.array('evidence', 5), createComplaint);
router.get('/:id', protect, getComplaintById);
router.post('/:id/verify', protect, authorize('warden', 'chief_warden', 'class_advisor', 'lab_assistant', 'super_admin'), verifyComplaint);
router.post('/:id/approve', protect, authorize('chief_warden', 'hod', 'dean', 'student_welfare', 'super_admin'), approveComplaint);
router.post('/:id/assign', protect, authorize('maintenance_supervisor', 'super_admin'), assignComplaint);
router.patch('/:id/update-work', protect, authorize(...MAINTENANCE_ROLES, 'maintenance_supervisor', 'super_admin'), upload.array('progress', 5), updateWorkProgress);
router.post('/:id/verify-completion', protect, authorize('student'), verifyCompletion);
router.post('/:id/community-support', protect, authorize('student'), addCommunitySupport);
router.post('/:id/comments', protect, addComment);

module.exports = router;
