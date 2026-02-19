const Filter = require("../models/Filter");

// Get all filters
exports.getFilters = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type, isActive: true } : { isActive: true };

    const filters = await Filter.find(query).sort({ displayOrder: 1, name: 1 });

    res.json(filters);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all filters (admin - including inactive)
exports.getAllFilters = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};

    const filters = await Filter.find(query).sort({ displayOrder: 1, name: 1 });

    res.json(filters);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create filter
exports.createFilter = async (req, res) => {
  try {
    const { type, name, value, displayOrder, isActive, minPrice, maxPrice } =
      req.body;

    // Validate filter type
    const ALLOWED_TYPES = ['color', 'size', 'brand', 'price', 'material', 'category'];
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: `Invalid filter type. Allowed: ${ALLOWED_TYPES.join(', ')}` });
    }

    if (!name || !value) {
      return res.status(400).json({ message: "Filter name and value are required" });
    }

    // Check if filter already exists
    const existingFilter = await Filter.findOne({ type, value });
    if (existingFilter) {
      return res
        .status(400)
        .json({ message: "Filter with this value already exists" });
    }

    const filter = new Filter({
      type,
      name,
      value,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
      minPrice: minPrice || 0,
      maxPrice: maxPrice || null,
    });

    await filter.save();
    res.status(201).json(filter);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update filter
exports.updateFilter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value, displayOrder, isActive, minPrice, maxPrice } =
      req.body;

    const filter = await Filter.findById(id);
    if (!filter) {
      return res.status(404).json({ message: "Filter not found" });
    }

    // Check if changing value conflicts with another filter
    if (value && value !== filter.value) {
      const existingFilter = await Filter.findOne({
        type: filter.type,
        value,
        _id: { $ne: id },
      });
      if (existingFilter) {
        return res
          .status(400)
          .json({ message: "Filter with this value already exists" });
      }
    }

    if (name) filter.name = name;
    if (value) filter.value = value;
    if (displayOrder !== undefined) filter.displayOrder = displayOrder;
    if (isActive !== undefined) filter.isActive = isActive;
    if (minPrice !== undefined) filter.minPrice = minPrice;
    if (maxPrice !== undefined) filter.maxPrice = maxPrice;

    await filter.save();
    res.json(filter);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete filter
exports.deleteFilter = async (req, res) => {
  try {
    const { id } = req.params;

    const filter = await Filter.findByIdAndDelete(id);
    if (!filter) {
      return res.status(404).json({ message: "Filter not found" });
    }

    res.json({ message: "Filter deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Reorder filters
exports.reorderFilters = async (req, res) => {
  try {
    const { filters } = req.body; // Array of { id, displayOrder }

    if (!Array.isArray(filters)) {
      return res.status(400).json({ message: "Filters must be an array" });
    }

    // Update each filter's display order using bulkWrite for efficiency
    await Filter.bulkWrite(
      filters.map(({ id, displayOrder }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { displayOrder } },
        },
      }))
    );

    res.json({ message: "Filters reordered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
