const { log } = require('../utils/logger');
const mongoose = require('mongoose');
const Product = require("../models/Product");
const Category = require("../models/Category");
const StockMovement = require("../models/StockMovement");
const { invalidateCache } = require("../utils/cache");

// @desc    Get all products (admin view)
// @route   GET /api/admin/products
// @access  Private/Admin
// @desc    Get all products (admin view)
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const brand = req.query.brand || "";
    const stockStatus = req.query.stockStatus || ""; // 'low', 'out'
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category.toLowerCase() }).select('_id').lean();
        if (cat) filter.category = cat._id;
      }
    }

    if (brand && brand !== 'all') {
      filter.brand = brand;
    }

    if (req.query.status && req.query.status !== 'all') {
        filter.isActive = req.query.status === 'active';
    }

    if (stockStatus) {
      if (stockStatus === 'low') {
        filter.stock = { $lte: 10, $gt: 0 };
      } else if (stockStatus === 'out') {
        filter.stock = { $lte: 0 };
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = order;

    const total = await Product.countDocuments(filter);
    const skip = (page - 1) * limit;
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Map products to include status for frontend compatibility
    const productsWithStatus = products.map((product) => ({
      ...product.toObject(),
      status: product.isActive ? "active" : "inactive",
    }));

    res.json({
      products: productsWithStatus,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    log.error("Get all products error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ... (existing getProductById, createProduct, updateProduct, etc.)

// @desc    Bulk delete products
// @route   POST /api/admin/products/bulk-delete
// @access  Private/Admin
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body; // Array of product IDs

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No product IDs provided" });
    }

    // 1. Find all products to be deleted to get their images
    const products = await Product.find({ _id: { $in: ids } });

    // 2. Delete images from MinIO (parallel)
    const { deleteObject } = require("../utils/minio");
    const allKeys = products.flatMap(p =>
      (p.images || []).map(img => img.key || (typeof img === 'string' ? img.split('/product-media/')[1] : null)).filter(Boolean)
    );

    const deleteResults = await Promise.allSettled(
      allKeys.map(key => deleteObject(key))
    );
    const deletedImagesCount = deleteResults.filter(r => r.status === 'fulfilled').length;
    const failedDeletes = deleteResults.filter(r => r.status === 'rejected');
    if (failedDeletes.length > 0) {
      log.warn(`Bulk delete: ${failedDeletes.length} image deletions failed`);
    }

    // 3. Delete products from DB
    const result = await Product.deleteMany({ _id: { $in: ids } });

    // 4. Invalidate cache
    await invalidateCache("products:*");

    res.json({
      message: `Successfully deleted ${result.deletedCount} products and ${deletedImagesCount} images`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    log.error("Bulk delete products error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Bulk update product status
// @route   POST /api/admin/products/bulk-status
// @access  Private/Admin
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No product IDs provided" });
    }

    if (isActive === undefined) {
        return res.status(400).json({ message: "Status (isActive) is required" });
    }

    const result = await Product.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive: isActive } }
    );

    // Invalidate cache
    await invalidateCache("products:*");

    res.json({
      message: `Successfully updated status for ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    log.error("Bulk update status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single product by ID (admin view)
// @route   GET /api/admin/products/:id
// @access  Private/Admin
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    log.error("Get product by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new product
// @route   POST /api/admin/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      specifications,
      materialAndCare,
      shippingAndReturns,
      category,
      price,
      comparePrice,
      brand,
      sku,
      stock,
      sizes,
      colors,
      tags,
      images,
      images360,
      hotspots360,
      video,
      featured,
      isActive,
    } = req.body;

    // Log incoming data for debugging
    log.info(
      "Creating product with data:",
      JSON.stringify(
        {
          name,
          slug,
          category,
          price,
          sizesType: typeof sizes,
          sizesValue: sizes,
          imagesType: typeof images,
          imagesLength: images?.length,
          imagesValue: images,
        },
        null,
        2,
      ),
    );

    // Validate required fields
    if (!name || !slug || !description || !category || !price) {
      log.info("âŒ Validation failed - missing required fields:", {
        name: !!name,
        slug: !!slug,
        description: !!description,
        category: !!category,
        price: !!price,
      });
      return res.status(400).json({
        message:
          "Please provide all required fields (name, slug, description, category, price)",
        missing: {
          name: !name,
          slug: !slug,
          description: !description,
          category: !category,
          price: !price,
        },
      });
    }

    // Auto-resolve slug collision with -2, -3, etc.
    let finalSlug = slug;
    let slugConflict = await Product.findOne({ slug: finalSlug });
    if (slugConflict) {
      let suffix = 2;
      while (slugConflict) {
        finalSlug = `${slug}-${suffix}`;
        slugConflict = await Product.findOne({ slug: finalSlug });
        suffix++;
        if (suffix > 50) break; // safety limit
      }
    }

    // Parse sizes if it's a string (from JSON)
    let parsedSizes = [];
    if (sizes) {
      if (typeof sizes === "string") {
        try {
          parsedSizes = JSON.parse(sizes);
        } catch (e) {
          log.error("Failed to parse sizes:", e);
          parsedSizes = [];
        }
      } else if (Array.isArray(sizes)) {
        parsedSizes = sizes;
      }
    }

    // Parse images if it's a string (from JSON)
    let parsedImages = [];
    if (images) {
      if (typeof images === "string") {
        try {
          parsedImages = JSON.parse(images);
        } catch (e) {
          log.error("Failed to parse images:", e);
          parsedImages = [];
        }
      } else if (Array.isArray(images)) {
        parsedImages = images;
      }
    }

    // Parse colors if it's a string
    let parsedColors = [];
    if (colors) {
      if (typeof colors === "string") {
        try {
          parsedColors = JSON.parse(colors);
        } catch (e) {
          log.error("Failed to parse colors:", e);
          parsedColors = [];
        }
      } else if (Array.isArray(colors)) {
        parsedColors = colors;
      }
    }

    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        try {
          parsedTags = JSON.parse(tags);
        } catch (e) {
          log.error("Failed to parse tags:", e);
          parsedTags = [];
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    // Parse 360 images if it's a string
    let parsedImages360 = [];
    if (images360) {
      if (typeof images360 === "string") {
        try {
          parsedImages360 = JSON.parse(images360);
        } catch (e) {
          log.error("Failed to parse images360:", e);
          parsedImages360 = [];
        }
      } else if (Array.isArray(images360)) {
        parsedImages360 = images360;
      }
    }

    // Parse 360 hotspots if it's a string
    let parsedHotspots360 = [];
    if (hotspots360) {
      if (typeof hotspots360 === "string") {
        try {
          parsedHotspots360 = JSON.parse(hotspots360);
        } catch (e) {
          log.error("Failed to parse hotspots360:", e);
          parsedHotspots360 = [];
        }
      } else if (Array.isArray(hotspots360)) {
        parsedHotspots360 = hotspots360;
      }
    }

    // Validate images have required fields
    if (parsedImages.length > 0) {
      const validImages = parsedImages.every((img) => img.url && img.key);
      if (!validImages) {
        return res.status(400).json({
          message:
            "Invalid image data. Each image must have 'url' and 'key' properties",
          receivedImages: parsedImages,
        });
      }
    }

    // Resolve category: accept ObjectId or slug string
    let resolvedCategory = category;
    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      const cat = await Category.findOne({ slug: category.toLowerCase() }).select('_id').lean();
      if (!cat) {
        return res.status(400).json({ message: `Category "${category}" not found` });
      }
      resolvedCategory = cat._id;
    }

    // Create product
    const product = await Product.create({
      name,
      slug: finalSlug,
      description,
      specifications: specifications || "",
      materialAndCare: materialAndCare || "",
      shippingAndReturns: shippingAndReturns || "",
      category: resolvedCategory,
      price,
      comparePrice,
      brand,
      sku,
      stock: stock !== undefined ? stock : 100, // Default to 100 if not provided
      sizes: parsedSizes,
      colors: parsedColors,
      tags: parsedTags,
      images: parsedImages,
      images360: parsedImages360,
      hotspots360: parsedHotspots360,
      video: video || undefined,
      featured: featured || false,
      isActive: isActive !== undefined ? isActive : true,
      isOutOfStock: false, // Default to not out of stock
    });

    log.info("âœ… Product created successfully:", {
      id: product._id,
      name: product.name,
      slug: product.slug,
      isActive: product.isActive,
      featured: product.featured,
      category: product.category,
    });

    // Invalidate product cache
    await invalidateCache("products:*");
    await invalidateCache(`frame-manifest:${slug}`);

    res.status(201).json(product);
  } catch (error) {
    log.error("âŒ Create product error:", error);
    log.error("Error name:", error.name);
    log.error("Error message:", error.message);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Product with this slug already exists" });
    }
    const isDevEnv = process.env.NODE_ENV === "development";
    res.status(500).json({
      message: "Server error",
      ...(isDevEnv && { error: error.message }),
      ...(isDevEnv &&
        error.errors && {
          details: Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          })),
        }),
    });
  }
};

// @desc    Update a product
// @route   PATCH /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      specifications,
      materialAndCare,
      shippingAndReturns,
      name,
      slug,
      description,
      category,
      price,
      comparePrice,
      brand,
      sku,
      sizes,
      colors,
      tags,
      images,
      images360,
      hotspots360,
      video,
      featured,
      isActive,
      gstPercentage,
      averageDeliveryCost,
      careInstructions,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If slug is being updated, check for uniqueness
    if (slug && slug !== product.slug) {
      const existingProduct = await Product.findOne({ slug });
      if (existingProduct) {
        return res
          .status(400)
          .json({ message: "Product with this slug already exists" });
      }
    }

    // Update fields
    if (specifications !== undefined) product.specifications = specifications;
    if (materialAndCare !== undefined)
      product.materialAndCare = materialAndCare;
    if (shippingAndReturns !== undefined)
      product.shippingAndReturns = shippingAndReturns;
    if (name) product.name = name;
    if (slug) product.slug = slug;
    if (description) product.description = description;
    if (category) {
      // Resolve category: accept ObjectId or slug string
      if (mongoose.Types.ObjectId.isValid(category)) {
        product.category = category;
      } else {
        const cat = await Category.findOne({ slug: category.toLowerCase() }).select('_id').lean();
        if (cat) {
          product.category = cat._id;
        } else {
          return res.status(400).json({ message: `Category "${category}" not found` });
        }
      }
    }
    if (price) product.price = price;
    if (comparePrice !== undefined) product.comparePrice = comparePrice;
    if (brand !== undefined) product.brand = brand;
    if (sku !== undefined) product.sku = sku;
    if (req.body.stock !== undefined) product.stock = req.body.stock;
    if (sizes !== undefined) product.sizes = sizes;
    if (colors !== undefined) product.colors = colors;
    if (tags !== undefined) product.tags = tags;
    if (images !== undefined) product.images = images;
    if (images360 !== undefined) product.images360 = images360;
    if (hotspots360 !== undefined) product.hotspots360 = hotspots360;
    if (video !== undefined) product.video = video || null;
    if (featured !== undefined) product.featured = featured;
    if (isActive !== undefined) product.isActive = isActive;
    if (req.body.isOutOfStock !== undefined)
      product.isOutOfStock = req.body.isOutOfStock;
    if (gstPercentage !== undefined) product.gstPercentage = gstPercentage;
    if (averageDeliveryCost !== undefined)
      product.averageDeliveryCost = averageDeliveryCost;
    if (careInstructions !== undefined)
      product.careInstructions = careInstructions;

    await product.save();

    // Invalidate product cache
    await invalidateCache("products:*");
    await invalidateCache(`frame-manifest:${product.slug}`);

    res.json(product);
  } catch (error) {
    log.error("Update product error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle product active status
// @route   PATCH /api/admin/products/:id/toggle
// @access  Private/Admin
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();

    // Invalidate product cache
    await invalidateCache("products:*");

    // Return product with status field for frontend compatibility
    const productResponse = {
      ...product.toObject(),
      status: product.isActive ? "active" : "inactive",
    };

    res.json(productResponse);
  } catch (error) {
    log.error("Toggle product status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle product featured status
// @route   PATCH /api/admin/products/:id/toggle-featured
// @access  Private/Admin
exports.toggleProductFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.featured = !product.featured;
    await product.save();

    // Invalidate product cache
    await invalidateCache("products:*");

    res.json(product);
  } catch (error) {
    log.error("Toggle product featured error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update product status (isActive, isOutOfStock)
// @route   PATCH /api/admin/products/:id/status
// @access  Private/Admin
exports.updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isOutOfStock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update only provided fields
    if (isActive !== undefined) {
      product.isActive = isActive;
    }
    if (isOutOfStock !== undefined) {
      product.isOutOfStock = isOutOfStock;
    }

    await product.save();

    // Invalidate product cache
    await invalidateCache("products:*");

    res.json(product);
  } catch (error) {
    log.error("Update product status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    log.info(`ðŸ—‘ï¸  Deleting product: ${product.name} (${product.slug})`);

    // Delete all product images from MinIO
    if (product.images && product.images.length > 0) {
      const { deleteObject } = require("../utils/minio");

      log.info(`ðŸ“¦ Product has ${product.images.length} images to delete`);

      for (const image of product.images) {
        try {
          // Images are stored as objects with { url, key }
          const objectKey = image.key || null;

          if (objectKey) {
            log.info(`  Deleting image: ${objectKey}`);
            await deleteObject(objectKey);
            log.info(`  âœ… Deleted: ${objectKey}`);
          } else {
            // Fallback: try parsing URL if key is missing
            const imageUrl = typeof image === "string" ? image : image.url;
            if (imageUrl) {
              const urlParts = imageUrl.split("/product-media/");
              if (urlParts.length > 1) {
                const objectName = urlParts[1];
                log.info(`  Deleting image (from URL): ${objectName}`);
                await deleteObject(objectName);
                log.info(`  âœ… Deleted: ${objectName}`);
              } else {
                log.info(`  âš ï¸  Could not parse image URL: ${imageUrl}`);
              }
            } else {
              log.info(`  âš ï¸  Image has no key or url:`, image);
            }
          }
        } catch (imageError) {
          log.error(`  âŒ Failed to delete image:`, imageError.message);
          // Continue deleting other images even if one fails
        }
      }

      log.info(`âœ… Finished deleting images for product: ${product.name}`);
    } else {
      log.info(`â„¹ï¸  Product has no images to delete`);
    }

    // Delete product from database
    await Product.findByIdAndDelete(id);

    log.info(
      `âœ… Product deleted from database: ${product.name} (ID: ${id})`,
    );

    // Invalidate product cache
    await invalidateCache("products:*");

    res.json({
      message: "Product and associated images deleted successfully",
      deletedProduct: {
        id: product._id,
        name: product.name,
        slug: product.slug,
        imagesDeleted: product.images?.length || 0,
      },
    });
  } catch (error) {
    log.error("Delete product error:", error);
    const isDevEnv = process.env.NODE_ENV === "development";
    res.status(500).json({ message: "Server error", ...(isDevEnv && { error: error.message }) });
  }
};

// @desc    Get stock movement history for a product
// @route   GET /api/v1/admin/products/stock-movements/:productId
// @access  Private/Admin
exports.getStockMovements = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = (page - 1) * limit;
    const { type } = req.query;

    const filter = { product: productId };
    if (type) filter.type = type;

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("performedBy", "name email")
        .lean(),
      StockMovement.countDocuments(filter),
    ]);

    res.json({
      success: true,
      movements,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    log.error("Get stock movements error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
