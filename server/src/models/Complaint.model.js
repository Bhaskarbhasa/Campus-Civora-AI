const mongoose = require('mongoose');

const COMPLAINT_CATEGORIES = [
  'electrical',
  'plumbing',
  'internet_connectivity',
  'classroom_equipment',
  'laboratory_equipment',
  'hostel_facilities',
  'transportation',
  'food_services',
  'security',
  'housekeeping',
  'academic_grievance',
  'examination',
  'library',
  'sports_facilities',
  'medical',
  'civil_maintenance',
  'general_administration',
  'other',
];

const COMPLAINT_STATUS = [
  'submitted',
  'ai_processing',
  'under_verification',
  'verified',
  'approved',
  'assigned',
  'work_in_progress',
  'waiting_for_materials',
  'quality_inspection',
  'completed',
  'pending_student_verification',
  'closed',
  'reopened',
  'rejected',
  'escalated',
  'duplicate',
  'merged',
  'on_hold',
];

const PRIORITY_LEVELS = ['low', 'medium', 'high', 'emergency'];

const timelineEventSchema = new mongoose.Schema({
  status: { type: String },
  message: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String },
  performedByRole: { type: String },
  evidence: [{
    url: String,
    publicId: String,
    type: { type: String }
  }],
  timestamp: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema(
  {
    complainantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: COMPLAINT_CATEGORIES, required: true },
    subCategory: { type: String, default: null },
    isPublic: { type: Boolean, default: true },
    isEmergency: { type: Boolean, default: false },
    
    location: {
      building: { type: String, required: true },
      floor: { type: String, default: null },
      room: { type: String, default: null },
      hostelBlock: { type: String, default: null },
      specificArea: { type: String, default: null },
      gpsCoordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },

    priority: { type: String, enum: PRIORITY_LEVELS, default: 'medium' },
    status: { type: String, enum: COMPLAINT_STATUS, default: 'submitted' },

    evidenceFiles: [
      {
        url: { type: String },
        publicId: { type: String },
        fileType: { type: String }, // image, video, pdf
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    aiAnalysis: {
      suggestedCategory: { type: String, default: null },
      suggestedDepartment: { type: String, default: null },
      predictedPriority: { type: String, default: null },
      sentimentScore: { type: Number, default: null }, // 0-1 (0=neutral, 1=very urgent)
      isDuplicate: { type: Boolean, default: false },
      duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
      summary: { type: String, default: null },
      confidence: { type: Number, default: null },
      processed: { type: Boolean, default: false },
    },

    assignedDepartment: { type: String, default: null },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    verificationNote: { type: String, default: null },
    rejectionReason: { type: String, default: null },
    
    slaDeadline: { type: Date, default: null },
    escalationLevel: { type: Number, default: 0 }, // 0=warden,1=chief_warden,2=welfare,3=principal,4=director
    escalationHistory: [
      {
        escalatedTo: String,
        escalatedAt: Date,
        reason: String,
      },
    ],

    communitySupport: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],

    linkedComplaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],

    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        role: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],

    studentVerification: {
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date, default: null },
      comment: { type: String, default: null },
      rating: { type: Number, min: 1, max: 5, default: null },
    },

    timeline: [timelineEventSchema],

    closedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

complaintSchema.index({ complainantId: 1, status: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ 'location.building': 1 });
complaintSchema.index({ priority: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
module.exports.COMPLAINT_CATEGORIES = COMPLAINT_CATEGORIES;
module.exports.COMPLAINT_STATUS = COMPLAINT_STATUS;
module.exports.PRIORITY_LEVELS = PRIORITY_LEVELS;
