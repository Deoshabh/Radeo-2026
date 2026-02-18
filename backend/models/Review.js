const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxLength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1000
  },
  images: [{
    url: String,
    publicId: String // MinIO path or ID
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  
  // Moderation Fields
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  moderation_flag: {
    type: Boolean,
    default: false,
    index: true
  },
  isHidden: { // Manual override to hide
    type: Boolean,
    default: false,
    index: true
  },
  ai_tags: {
    moderation_score: Number,
    moderation_flags: [String],
    moderation_action: { type: String, enum: ['approve', 'flag', 'reject'] },
    processedAt: Date,
  },

  // Admin reply
  adminReply: {
    text: { type: String, trim: true, maxLength: 2000 },
    repliedAt: Date,
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // Admin notes (internal, not shown to customer)
  adminNotes: { type: String, trim: true, maxLength: 1000 }
}, {
  timestamps: true
});

// Compound index for efficient querying by product and status
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // One review per product per user

module.exports = mongoose.model('Review', reviewSchema);
