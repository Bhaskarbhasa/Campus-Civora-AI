const mongoose = require('mongoose');

const petitionSchema = new mongoose.Schema(
  {
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    purpose: { type: String, required: true },
    expectedOutcome: { type: String, required: true },
    
    targetCommunity: {
      type: { type: String, enum: ['university', 'department', 'hostel', 'year', 'lab', 'transport_route', 'campus_zone'], required: true },
      value: { type: String, default: null }, // e.g., 'CSE', 'Block A', '2nd Year'
    },
    
    eligibilityRules: {
      departments: [String],
      hostelBlocks: [String],
      years: [Number],
      roles: [String],
    },

    evidenceFiles: [{ url: String, publicId: String }],
    
    supportVotes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        votedAt: { type: Date, default: Date.now },
        comment: String,
      },
    ],
    oppositionVotes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        votedAt: { type: Date, default: Date.now },
        reason: String,
      },
    ],

    supportCount: { type: Number, default: 0 },
    oppositionCount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['draft', 'active', 'under_review', 'approved', 'rejected', 'implemented', 'closed'],
      default: 'active',
    },

    currentAuthority: {
      role: { type: String, default: null },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },

    thresholdReached: { type: Boolean, default: false },

    aiSummary: { type: String, default: null },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Petition', default: null },

    timeline: [
      {
        action: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        performedByName: String,
        comment: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    officialResponse: { type: String, default: null },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    respondedAt: { type: Date, default: null },
    
    affectedDepartments: [String],
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Petition', petitionSchema);
