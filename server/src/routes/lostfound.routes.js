const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { createReport, getReports, getReportById, claimItem } = require('../controllers/lostfound.controller');

router.get('/', protect, getReports);
router.post('/', protect, upload.array('photos', 3), createReport);
router.get('/:id', protect, getReportById);
router.post('/:id/claim', protect, claimItem);

module.exports = router;
