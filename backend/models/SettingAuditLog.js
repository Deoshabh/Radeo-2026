const mongoose = require('mongoose');

const settingAuditLogSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'bulk-update', 'reset'],
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

settingAuditLogSchema.index({ key: 1, createdAt: -1 });

module.exports = mongoose.model('SettingAuditLog', settingAuditLogSchema);
