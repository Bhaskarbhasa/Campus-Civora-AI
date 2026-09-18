const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['lost', 'found'], required: true },

    itemCategory: {
      type: String,
      enum: ['id_card', 'wallet', 'mobile', 'laptop', 'calculator', 'keys', 'bag', 'book', 'headphones', 'water_bottle', 'clothing', 'jewelry', 'charger', 'other'],
      required: true,
    },

    itemName: { type: String, required: true },
    description: { type: String, required: true },
    color: { type: String, default: null },
    brand: { type: String, default: null },
    distinguishingFeatures: { type: String, default: null },

    lastSeenLocation: { type: String, default: null },      // for lost
    foundLocation: { type: String, default: null },          // for found
    locationDetails: { type: String, default: null },
    submittedTo: { type: String, default: null },            // for found (e.g., 'Handed to Warden')
    
    dateTime: { type: Date, required: true },

    photos: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],

    status: {
      type: String,
      enum: ['active', 'matched', 'claimed', 'closed', 'expired'],
      default: 'active',
    },

    potentialMatches: [
      {
        matchedReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'LostFound' },
        matchScore: Number,
        notifiedAt: Date,
      },
    ],

    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    claimedAt: { type: Date, default: null },

    verificationQuestions: [
      {
        question: String,
        answer: String, // stored hashed or plaintext based on sensitivity
      },
    ],

    handoverRecord: {
      handedOverAt: { type: Date, default: null },
      handedOverTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      witnessName: { type: String, default: null },
      notes: { type: String, default: null },
    },

    isUrgent: { type: Boolean, default: false },
    contactPreference: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LostFound', lostFoundSchema);
