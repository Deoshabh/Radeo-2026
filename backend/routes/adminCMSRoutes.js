const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authenticate, authorize } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validateRequest");

const {
  // Content Pages
  getAllPages,
  getPage,
  createPage,
  updatePage,
  publishPage,
  deletePage,
  
  // Media Library
  getAllMedia,
  uploadMedia,
  
  // Navigation Menus
  getAllMenus,
  createMenu,
  updateMenuItems,
  
  // Public endpoints
  getPublicPage,
  getPublicMenu,
} = require("../controllers/adminCMSController");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, documents
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/mpeg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  },
});

// ================================
// ADMIN CMS ROUTES (Protected)
// ================================

// All admin CMS routes require authentication and admin role
router.use(authenticate);
router.use(authorize("admin"));

// Content Pages
router.get("/pages", getAllPages);
router.get("/pages/:id", getPage);
router.post("/pages", createPage);
router.put("/pages/:id", updatePage);
router.post("/pages/:id/publish", publishPage);
router.delete("/pages/:id", deletePage);

// Media Library
router.get("/media", getAllMedia);
router.post("/media/upload", upload.single("file"), uploadMedia);

// Navigation Menus
router.get("/menus", getAllMenus);
router.post("/menus", createMenu);
router.put("/menus/:id/items", updateMenuItems);

// ================================
// PUBLIC CMS ROUTES
// ================================

// Note: These are mounted at root level in server.js
// They are included here for organization

// Public routes (no authentication required)
const publicRouter = express.Router();
publicRouter.get("/pages/:slug", getPublicPage);
publicRouter.get("/menus/:location", getPublicMenu);

module.exports = {
  adminRouter: router,
  publicRouter,
};