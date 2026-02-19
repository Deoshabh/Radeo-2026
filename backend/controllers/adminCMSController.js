const ContentPage = require("../models/ContentPage");
const NavigationMenu = require("../models/NavigationMenu");
const Media = require("../models/Media");
const { uploadBuffer } = require("../utils/minio");
const path = require("path");
const { log } = require("../utils/logger");

/* =====================
   Content Pages
===================== */

// Get all pages
exports.getAllPages = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const pages = await ContentPage.find(query)
      .sort({ createdAt: -1 })
      .populate("updatedBy", "name email");

    res.json({ success: true, pages });
  } catch (error) {
    log.error("Get all pages error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single page
exports.getPage = async (req, res) => {
  try {
    const page = await ContentPage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }
    res.json({ success: true, page });
  } catch (error) {
    log.error("Get page error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create page
exports.createPage = async (req, res) => {
  try {
    const { title, slug, content, status } = req.body;

    // Basic validation
    if (!title || !slug) {
      return res.status(400).json({ message: "Title and Slug are required" });
    }

    // Check slug uniqueness
    const existing = await ContentPage.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "Slug already exists" });
    }

    const page = new ContentPage({
      ...req.body,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await page.save();
    res.status(201).json({ success: true, page });
  } catch (error) {
    log.error("Create page error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update page
exports.updatePage = async (req, res) => {
  try {
    const page = await ContentPage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    // Update only allowed fields (prevent mass assignment)
    const allowedFields = [
      'title', 'slug', 'content', 'sections', 'status',
      'seo', 'template', 'featuredImage', 'category',
      'tags', 'isPublished', 'publishedAt', 'order',
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        page[field] = req.body[field];
      }
    }
    page.updatedBy = req.user.id;

    await page.save();
    res.json({ success: true, page });
  } catch (error) {
    log.error("Update page error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Publish page
exports.publishPage = async (req, res) => {
  try {
    const page = await ContentPage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    page.status = "published";
    page.publishAt = new Date();
    page.updatedBy = req.user.id;

    await page.save();
    res.json({ success: true, page });
  } catch (error) {
    log.error("Publish page error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete page
exports.deletePage = async (req, res) => {
  try {
    const page = await ContentPage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    await page.deleteOne();
    res.json({ success: true, message: "Page deleted" });
  } catch (error) {
    log.error("Delete page error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================
   Media Library
===================== */

// Get all media with fitlering
exports.getAllMedia = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    const query = { isArchived: false };

    if (type && type !== "all") query.type = type;
    if (search) query.originalName = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;
    
    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("uploadedBy", "name");
      
    const total = await Media.countDocuments(query);

    res.json({ 
      success: true, 
      media,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    log.error("Get media error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload media
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { category, type, altText, caption, credit } = req.body;
    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();

    // File type whitelist validation
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: `File type '${file.mimetype}' is not allowed. Accepted: images, videos (mp4/webm/mov), and PDF.`,
      });
    }

    // Max file size: 50MB for videos, 10MB for others
    const maxSize = file.mimetype.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        message: `File too large. Max ${file.mimetype.startsWith('video/') ? '50MB' : '10MB'} for this file type.`,
      });
    }
    
    // Generate unique key
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const key = `cms/${uniqueSuffix}${ext}`;
    
    // Upload to MinIO
    const publicUrl = await uploadBuffer(file.buffer, key, file.mimetype);

    // Determine type if not provided
    let fileType = type || "other";
    if (file.mimetype.startsWith("image/")) fileType = "image";
    else if (file.mimetype.startsWith("video/")) fileType = "video";
    else if (file.mimetype.startsWith("application/pdf")) fileType = "document";

    // Create Media record
    const media = await Media.create({
      originalName: file.originalname,
      fileName: `${uniqueSuffix}${ext}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      extension: ext.substring(1), // remove dot
      bucket: process.env.MINIO_BUCKET || "cms-media",
      key,
      storageUrl: publicUrl, // Using public URL as storage URL for simplicity
      cdnUrl: publicUrl,
      type: fileType,
      category: category || "other",
      uploadedBy: req.user.id,
      altText: altText || "",
      caption: caption || "",
      credit: credit || "",
      width: 0, // Would need image processing to get dimensions
      height: 0,
    });

    res.status(201).json({ success: true, media });
  } catch (error) {
    log.error("Upload media error:", error);
    res.status(500).json({ message: "Failed to upload media" });
  }
};

// Update media metadata (altText, caption, credit, category, tags)
exports.updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['altText', 'caption', 'credit', 'category', 'tags'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const media = await Media.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    res.json({ success: true, media });
  } catch (error) {
    log.error("Update media error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================
   Navigation Menus
===================== */

exports.getAllMenus = async (req, res) => {
  try {
    const menus = await NavigationMenu.find().sort({ name: 1 });
    res.json({ success: true, menus });
  } catch (error) {
    log.error("Get menus error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createMenu = async (req, res) => {
  try {
    const { name, location, items } = req.body;

    const existing = await NavigationMenu.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Menu with this name already exists" });
    }

    // Check if location is already taken
    if (location) {
      const existingLoc = await NavigationMenu.findOne({ location, isActive: true });
      if (existingLoc) {
         // Not strictly an error, but warning? Or allow overwriting?
         // For now allow multiple, but usually one per location is active.
      }
    }

    const menu = await NavigationMenu.create({
      ...req.body,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ success: true, menu });
  } catch (error) {
    log.error("Create menu error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMenuItems = async (req, res) => {
  try {
    const { items } = req.body; // Expects array of items
    const menu = await NavigationMenu.findById(req.params.id);
    
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    menu.items = items;
    menu.updatedBy = req.user.id;
    await menu.save();

    res.json({ success: true, menu });
  } catch (error) {
    log.error("Update menu items error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================
   Public Endpoints
===================== */

exports.getPublicPage = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await ContentPage.findOne({ slug, status: "published" });
    
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    res.json({ success: true, page });
  } catch (error) {
    log.error("Get public page error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPublicMenu = async (req, res) => {
  try {
    const { location } = req.params;
    const menu = await NavigationMenu.findOne({ location, isActive: true });
    
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    // Filter active items (logic in model virtual, but explicit here for safety)
    const now = new Date();
    const activeItems = menu.items.filter(item => {
        if (item.showFrom && item.showFrom > now) return false;
        if (item.showUntil && item.showUntil <= now) return false;
        return true;
    });
    
    const menuObj = menu.toObject();
    menuObj.items = activeItems;

    res.json({ success: true, menu: menuObj });
  } catch (error) {
    log.error("Get public menu error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
