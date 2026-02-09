const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    branding: {
      logo: {
        url: { type: String, default: '' },
        alt: { type: String, default: 'Logo' },
      },
      favicon: {
        url: { type: String, default: '' },
      },
      siteName: { type: String, default: 'Radeo' },
    },
    banners: [
      {
        id: { type: String },
        imageUrl: { type: String, required: true },
        title: { type: String },
        subtitle: { type: String },
        link: { type: String },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      },
    ],
    // Singleton pattern enforcement
    isDefault: { type: Boolean, default: true, unique: true },
  },
  { timestamps: true },
);

// Ensure only one document exists
siteSettingsSchema.statics.getSettings = async function () {
  const settings = await this.findOne({ isDefault: true });
  if (settings) return settings;
  return this.create({ isDefault: true });
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
