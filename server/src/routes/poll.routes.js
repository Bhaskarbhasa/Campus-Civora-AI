const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { createPoll, getPolls, getPollById, castVote } = require('../controllers/poll.controller');

router.get('/', protect, getPolls);
router.post('/', protect, authorize('warden', 'chief_warden', 'hod', 'dean', 'student_welfare', 'registrar', 'principal', 'director', 'super_admin'), createPoll);
router.get('/:id', protect, getPollById);
router.post('/:id/vote', protect, castVote);

module.exports = router;
