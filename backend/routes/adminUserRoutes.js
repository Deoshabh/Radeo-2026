const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserBlock,
  createAdmin,
  getUserHistory,
  getSecurityEvents,
  sendPasswordReset,
  forceLogout,
  impersonateUser,
} = require("../controllers/adminUserController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");
const { validateRequest } = require("../middleware/validateRequest");
const { mongoIdSchema } = require("../validators/schemas");

// Protect all routes with authentication and admin check
router.use(authenticate);
router.use(admin);

// @route   GET /api/v1/admin/users
router.get("/", getAllUsers);

// @route   POST /api/v1/admin/users/create-admin
router.post("/create-admin", createAdmin);

// @route   GET /api/v1/admin/users/security-events
router.get("/security-events", getSecurityEvents);

// @route   GET /api/v1/admin/users/:id/history (must come before /:id)
router.get("/:id/history", validateRequest(mongoIdSchema), getUserHistory);

// @route   POST /api/v1/admin/users/:id/send-password-reset
router.post("/:id/send-password-reset", validateRequest(mongoIdSchema), sendPasswordReset);

// @route   POST /api/v1/admin/users/:id/force-logout
router.post("/:id/force-logout", validateRequest(mongoIdSchema), forceLogout);

// @route   POST /api/v1/admin/users/:id/impersonate
router.post("/:id/impersonate", validateRequest(mongoIdSchema), impersonateUser);

// @route   GET /api/v1/admin/users/:id
router.get("/:id", validateRequest(mongoIdSchema), getUserById);

// @route   PATCH /api/v1/admin/users/:id/role
router.patch("/:id/role", validateRequest(mongoIdSchema), updateUserRole);

// @route   PATCH /api/v1/admin/users/:id/toggle-block
router.patch(
  "/:id/toggle-block",
  validateRequest(mongoIdSchema),
  toggleUserBlock,
);

module.exports = router;
