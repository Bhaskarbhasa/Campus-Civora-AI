const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    creatorName: { type: String },
    question: { type: String, required: true },
    description: { type: String, default: null },

    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        voteCount: { type: Number, default: 0 },
      },
    ],

    isAnonymous: { type: Boolean, default: false },
    isMultipleChoice: { type: Boolean, default: false },

    eligibilityCriteria: {
      departments: [String],
      hostelBlocks: [String],
      years: [Number],
      roles: [String],
      campusWide: { type: Boolean, default: true },
    },

    openAt: { type: Date, required: true },
    closeAt: { type: Date, required: true },

    votes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        selectedOptions: [String],
        votedAt: { type: Date, default: Date.now },
      },
    ],

    status: { type: String, enum: ['draft', 'active', 'closed', 'cancelled'], default: 'active' },

    totalVotes: { type: Number, default: 0 },
    participationRate: { type: Number, default: 0 },

    category: {
      type: String,
      enum: ['event', 'policy', 'facility', 'academic', 'election', 'general'],
      default: 'general',
    },

    results: { type: mongoose.Schema.Types.Mixed, default: null },
    resultsPublishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Poll', pollSchema);
