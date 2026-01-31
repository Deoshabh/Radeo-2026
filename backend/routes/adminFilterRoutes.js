const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
  getAllFilters,
  createFilter,
  updateFilter,
  deleteFilter,
  reorderFilters,
} = require("../controllers/filterController");

// Admin routes (all require auth + admin)
router.get("/", authenticate, admin, getAllFilters);
router.post("/", authenticate, admin, createFilter);
router.put("/:id", authenticate, admin, updateFilter);
router.delete("/:id", authenticate, admin, deleteFilter);
router.post("/reorder", authenticate, admin, reorderFilters);

module.exports = router;
