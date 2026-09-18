const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { createPetition, getPetitions, getPetitionById, votePetition, decidePetition } = require('../controllers/petition.controller');

router.get('/', protect, getPetitions);
router.post('/', protect, authorize('student', 'faculty'), createPetition);
router.get('/:id', protect, getPetitionById);
router.post('/:id/vote', protect, authorize('student'), votePetition);
router.post('/:id/decide', protect, authorize('student_welfare', 'director', 'super_admin'), decidePetition);

module.exports = router;
