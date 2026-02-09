const SiteSettings = require('../models/SiteSettings');

/* =====================
   Get Public Settings
===================== */
exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();
    
    // Filter out only necessary data for public if needed
    // For now, return everything as branding and banners are public
    res.json({
      settings: {
        branding: settings.branding,
        banners: settings.banners.sort((a, b) => a.order - b.order),
      },
    });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Get All Settings (Admin)
===================== */
exports.getAllSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Update Settings
===================== */
exports.updateSettings = async (req, res, next) => {
  try {
    const { branding, banners } = req.body;
    
    // Validate inputs if necessary
    
    const settings = await SiteSettings.getSettings();
    
    if (branding) {
      if (branding.logo) settings.branding.logo = { ...settings.branding.logo, ...branding.logo };
      if (branding.favicon) settings.branding.favicon = { ...settings.branding.favicon, ...branding.favicon };
      if (branding.siteName) settings.branding.siteName = branding.siteName;
    }
    
    if (banners) {
      // Replace banners array or merge logic? 
      // Simple replacement is easier for reordering/editing list
      settings.banners = banners;
    }
    
    await settings.save();
    
    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (err) {
    next(err);
  }
};
