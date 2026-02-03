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
router.patch("/:id", authenticate, admin, updateFilter);
router.patch("/:id/toggle", authenticate, admin, async (req, res) => {
  try {
    const Filter = require("../models/Filter");
    const filter = await Filter.findById(req.params.id);
    if (!filter) {
      return res.status(404).json({ message: "Filter not found" });
    }
    filter.isActive = !filter.isActive;
    await filter.save();
    res.json(filter);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
router.delete("/:id", authenticate, admin, deleteFilter);
router.post("/reorder", authenticate, admin, reorderFilters);

module.exports = router;
