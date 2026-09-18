const Poll = require('../models/Poll.model');
const { createNotification } = require('../services/notification.service');

const createPoll = async (req, res) => {
  try {
    const { question, description, options, isAnonymous, isMultipleChoice, eligibilityCriteria, openAt, closeAt, category } = req.body;
    const parsedOptions = (typeof options === 'string' ? JSON.parse(options) : options).map((opt, i) => ({
      id: `opt_${i + 1}`, text: opt, voteCount: 0,
    }));

    const poll = await Poll.create({
      creatorId: req.user._id,
      creatorName: req.user.name,
      question, description, isAnonymous, isMultipleChoice, category,
      options: parsedOptions,
      eligibilityCriteria: typeof eligibilityCriteria === 'string' ? JSON.parse(eligibilityCriteria) : eligibilityCriteria || { campusWide: true },
      openAt: new Date(openAt),
      closeAt: new Date(closeAt),
      status: 'active',
    });

    res.status(201).json({ success: true, poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPolls = async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 10 } = req.query;
    const query = { status };
    const total = await Poll.countDocuments(query);
    const polls = await Poll.find(query)
      .select('-votes')
      .populate('creatorId', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, polls, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate('creatorId', 'name role');
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });

    const userVote = poll.votes.find((v) => v.userId?.toString() === req.user._id.toString());
    const sanitized = poll.toObject();
    if (poll.isAnonymous) delete sanitized.votes;

    res.json({ success: true, poll: sanitized, userVote: userVote ? userVote.selectedOptions : null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const castVote = async (req, res) => {
  try {
    const { selectedOptions } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
    if (poll.status !== 'active') return res.status(400).json({ success: false, message: 'Poll is not active.' });
    if (new Date() > poll.closeAt) return res.status(400).json({ success: false, message: 'Poll has closed.' });

    const alreadyVoted = poll.votes.some((v) => v.userId?.toString() === req.user._id.toString());
    if (alreadyVoted) return res.status(400).json({ success: false, message: 'You have already voted.' });

    const opts = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions];
    if (!poll.isMultipleChoice && opts.length > 1) {
      return res.status(400).json({ success: false, message: 'Only one option allowed.' });
    }

    // Update vote counts
    const optionUpdates = {};
    opts.forEach((optId) => {
      const optIndex = poll.options.findIndex((o) => o.id === optId);
      if (optIndex !== -1) optionUpdates[`options.${optIndex}.voteCount`] = 1;
    });

    const incUpdates = {};
    Object.keys(optionUpdates).forEach((k) => { incUpdates[k] = 1; });

    await Poll.findByIdAndUpdate(poll._id, {
      $push: { votes: { userId: poll.isAnonymous ? null : req.user._id, selectedOptions: opts } },
      $inc: { totalVotes: 1, ...incUpdates },
    });

    res.json({ success: true, message: 'Vote cast successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPoll, getPolls, getPollById, castVote };
