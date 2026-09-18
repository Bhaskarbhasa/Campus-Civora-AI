const Petition = require('../models/Petition.model');
const { analyzePetition } = require('../services/ai.service');
const { createNotification } = require('../services/notification.service');
const User = require('../models/User.model');

const createPetition = async (req, res) => {
  try {
    const { title, description, purpose, expectedOutcome, targetCommunity, eligibilityRules, affectedDepartments } = req.body;
    const tCommunity = typeof targetCommunity === 'string' ? JSON.parse(targetCommunity) : targetCommunity;
    const eRules = typeof eligibilityRules === 'string' ? JSON.parse(eligibilityRules) : eligibilityRules || {};

    const petition = await Petition.create({
      creatorId: req.user._id,
      title, description, purpose, expectedOutcome,
      targetCommunity: tCommunity,
      eligibilityRules: eRules,
      affectedDepartments: affectedDepartments || [],
      timeline: [{ action: 'created', performedBy: req.user._id, performedByName: req.user.name, comment: 'Petition created.' }],
    });

    // AI async
    analyzePetition(petition).then(async (result) => {
      await Petition.findByIdAndUpdate(petition._id, { aiSummary: result.summary, tags: result.tags });
    });

    // Notify the target community
    let targetUsers = [];
    if (tCommunity?.type === 'department' && tCommunity.value) {
      targetUsers = await User.find({ department: tCommunity.value, _id: { $ne: req.user._id } }).select('_id');
    } else if (tCommunity?.type === 'hostel' && tCommunity.value) {
      targetUsers = await User.find({ hostelBlock: tCommunity.value, _id: { $ne: req.user._id } }).select('_id');
    }

    for (const u of targetUsers) {
      await createNotification({
        recipientId: u._id,
        title: `New Petition: ${title}`,
        message: `A new petition affecting your ${tCommunity.type} has been created by ${req.user.name}.`,
        type: 'petition_update',
        relatedId: petition._id,
        metadata: { url: `/student/petitions` }
      });
    }

    res.status(201).json({ success: true, petition });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPetitions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};
    const total = await Petition.countDocuments(query);
    const petitions = await Petition.find(query)
      .populate('creatorId', 'name department year')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, petitions, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPetitionById = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id)
      .populate('creatorId', 'name department year')
      .populate('supportVotes.userId', 'name department year')
      .populate('currentAuthority.userId', 'name role');
    if (!petition) return res.status(404).json({ success: false, message: 'Petition not found.' });
    res.json({ success: true, petition });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const votePetition = async (req, res) => {
  try {
    const { vote, comment, reason } = req.body; // vote: 'support' | 'oppose'
    const petition = await Petition.findById(req.params.id);
    if (!petition) return res.status(404).json({ success: false, message: 'Petition not found.' });
    if (petition.status !== 'active') return res.status(400).json({ success: false, message: 'Petition is not active.' });

    const alreadyVoted =
      petition.supportVotes.some((v) => v.userId.toString() === req.user._id.toString()) ||
      petition.oppositionVotes.some((v) => v.userId.toString() === req.user._id.toString());
    if (alreadyVoted) return res.status(400).json({ success: false, message: 'You have already voted.' });

    const update = vote === 'support'
      ? { $push: { supportVotes: { userId: req.user._id, comment } }, $inc: { supportCount: 1 } }
      : { $push: { oppositionVotes: { userId: req.user._id, reason } }, $inc: { oppositionCount: 1 } };

    const updated = await Petition.findByIdAndUpdate(petition._id, update, { new: true });

    // Check threshold (30% support → forward)
    const totalEligible = await User.countDocuments({ role: 'student', isActive: true });
    const supportPct = (updated.supportCount / totalEligible) * 100;
    if (supportPct >= 30 && !updated.thresholdReached) {
      await Petition.findByIdAndUpdate(petition._id, { thresholdReached: true, status: 'under_review' });
      // Notify relevant authority
      const authority = await User.findOne({ role: 'student_welfare', isActive: true });
      if (authority) {
        await createNotification({
          recipientId: authority._id,
          title: `Petition Threshold Reached: ${petition.title}`,
          message: `A petition has reached ${Math.round(supportPct)}% support and requires your review.`,
          type: 'petition_milestone',
          linkedModule: 'petition',
          linkedId: petition._id,
          priority: 'high',
        });
      }
    }

    res.json({ success: true, message: 'Vote recorded.', supportCount: updated.supportCount, oppositionCount: updated.oppositionCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const decidePetition = async (req, res) => {
  try {
    const { decision, response } = req.body; // decision: 'approve' | 'reject' | 'schedule'
    const statusMap = { approve: 'approved', reject: 'rejected', schedule: 'under_review' };
    const updated = await Petition.findByIdAndUpdate(
      req.params.id,
      {
        status: statusMap[decision] || 'under_review',
        officialResponse: response,
        respondedBy: req.user._id,
        respondedAt: new Date(),
        $push: { timeline: { action: decision, performedBy: req.user._id, performedByName: req.user.name, comment: response } },
      },
      { new: true }
    ).populate('creatorId');

    await createNotification({
      recipientId: updated.creatorId._id,
      title: `Petition Decision: ${updated.title}`,
      message: `Your petition has been ${decision}d. Official response: ${response}`,
      type: 'petition_decision',
      linkedModule: 'petition',
      linkedId: updated._id,
      priority: 'high',
    });

    res.json({ success: true, petition: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPetition, getPetitions, getPetitionById, votePetition, decidePetition };
