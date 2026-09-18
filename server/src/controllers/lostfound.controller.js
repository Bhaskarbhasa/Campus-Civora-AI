const LostFound = require('../models/LostFound.model');
const { matchLostFound } = require('../services/ai.service');
const { notifyLostFoundMatch } = require('../services/notification.service');
const { uploadToCloudinary } = require('../config/cloudinary');

const createReport = async (req, res) => {
  try {
    const { type, itemCategory, itemName, description, color, brand, distinguishingFeatures, lastSeenLocation, foundLocation, locationDetails, submittedTo, dateTime, isUrgent, verificationQuestions } = req.body;

    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'campus-civora/lostfound');
        photos.push({ url: result.secure_url, publicId: result.public_id });
      }
    }

    const report = await LostFound.create({
      reporterId: req.user._id,
      type, itemCategory, itemName, description, color, brand, distinguishingFeatures,
      lastSeenLocation, foundLocation, locationDetails, submittedTo,
      dateTime: new Date(dateTime),
      photos, isUrgent: isUrgent || false,
      verificationQuestions: typeof verificationQuestions === 'string' ? JSON.parse(verificationQuestions) : verificationQuestions || [],
    });

    // AI matching in background
    if (type === 'lost') {
      const foundItems = await LostFound.find({ type: 'found', status: 'active', itemCategory: report.itemCategory });
      if (foundItems.length > 0) {
        matchLostFound(report, foundItems).then(async (matches) => {
          if (matches.length > 0) {
            await LostFound.findByIdAndUpdate(report._id, { potentialMatches: matches });
            await notifyLostFoundMatch(req.user._id, report._id, `We found ${matches.length} potential match(es) for your lost ${report.itemName}!`);
            // Notify finder too
            for (const m of matches) {
              const foundReport = foundItems.find((f) => f._id.toString() === m.matchedReportId?.toString());
              if (foundReport) {
                await notifyLostFoundMatch(foundReport.reporterId, foundReport._id, `A student may have lost the item you found (${report.itemName}). Check the match!`);
              }
            }
          }
        });
      }
    }

    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const { type, status = 'active', category, page = 1, limit = 12 } = req.query;
    const query = { status };
    if (type) query.type = type;
    if (category) query.itemCategory = category;

    const total = await LostFound.countDocuments(query);
    const reports = await LostFound.find(query)
      .populate('reporterId', 'name department year')
      .populate({
        path: 'potentialMatches.matchedReportId',
        select: 'itemName type itemCategory photos description'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, reports, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReportById = async (req, res) => {
  try {
    const report = await LostFound.findById(req.params.id).populate('reporterId', 'name department year phone');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const claimItem = async (req, res) => {
  try {
    const { answers } = req.body; // answers to verification questions
    const report = await LostFound.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (report.status !== 'active' && report.status !== 'matched') {
      return res.status(400).json({ success: false, message: 'Item is not available for claim.' });
    }

    // Verify answers if questions exist
    if (report.verificationQuestions.length > 0) {
      const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers || [];
      let correct = 0;
      report.verificationQuestions.forEach((q, i) => {
        if (parsedAnswers[i] && parsedAnswers[i].toLowerCase().trim() === q.answer.toLowerCase().trim()) correct++;
      });
      if (correct < report.verificationQuestions.length) {
        return res.status(400).json({ success: false, message: 'Verification failed. Incorrect answers.' });
      }
    }

    await LostFound.findByIdAndUpdate(report._id, { status: 'claimed', claimedBy: req.user._id, claimedAt: new Date() });
    res.json({ success: true, message: 'Claim verified. Please collect the item.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReport, getReports, getReportById, claimItem };
