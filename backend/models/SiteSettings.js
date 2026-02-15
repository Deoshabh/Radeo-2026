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
        buttonText: { type: String, default: 'Shop Now' },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      },
    ],
    announcementBar: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: 'Welcome to our store!' },
      link: { type: String, default: '' },
      backgroundColor: { type: String, default: '#10b981' },
      textColor: { type: String, default: '#ffffff' },
      dismissible: { type: Boolean, default: true },
    },
    // Sections configuration for Home Page
    homeSections: {
      heroSection: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Handcrafted Perfection' },
        subtitle: { type: String, default: 'Discover our new collection' },
        description: { type: String, default: '' },
        primaryButtonText: { type: String, default: 'Shop Collection' },
        primaryButtonLink: { type: String, default: '/products' },
        secondaryButtonText: { type: String, default: '' },
        secondaryButtonLink: { type: String, default: '' },
      },
      featuredProducts: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Featured Collection' },
        description: { type: String, default: '' },
        productLimit: { type: Number, default: 8 },
        productSelection: { type: String, enum: ['latest', 'top-rated', 'manual', 'random'], default: 'latest' },
        manualProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
        viewAllButtonText: { type: String, default: 'View All' },
        viewAllButtonLink: { type: String, default: '/products' },
      },
      madeToOrder: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Made to Order' },
        description: { type: String, default: 'Custom fit for your unique style.' },
        features: [{ type: String }],
      },
      newsletter: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Join Our Newsletter' },
        description: { type: String, default: 'Subscribe to get the latest updates.' },
        buttonText: { type: String, default: 'Subscribe' },
      },
    },
    // Dynamic Layout Configuration (Visual CMS)
    layout: [
      {
        id: { type: String, required: true },
        type: { type: String, required: true }, // 'hero', 'products', 'text', 'newsletter'
        enabled: { type: Boolean, default: true },
        data: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible data storage
      }
    ],
    // Global Theme Validation
    theme: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        primaryColor: '#3B2F2F',
        secondaryColor: '#F4F1EA',
        fontFamily: 'Inter',
        borderRadius: '8px',
      }
    },
    // Singleton pattern enforcement
    isDefault: { type: Boolean, default: true, unique: true },
  },
  { timestamps: true, strict: false },
);

// Ensure only one document exists
siteSettingsSchema.statics.getSettings = async function () {
  const settings = await this.findOne({ isDefault: true });
  if (settings) return settings;
  return this.create({ isDefault: true });
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
