const Product = require("../models/Product");
const { invalidateCache } = require("../utils/cache");

// @desc    Get all products (admin view)
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = async (req, res) => {
  try {
    console.log("📦 Admin: Fetching all products...");

    const page = parseInt(req.query.page) || 0; // 0 = return all (backward compatible)
    const limit = parseInt(req.query.limit) || 0;

    let products;
    if (page > 0 && limit > 0) {
      const skip = (page - 1) * limit;
      products = await Product.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } else {
      products = await Product.find({}).sort({ createdAt: -1 });
    }

    console.log(
      `✅ Admin: Found ${products.length} products (including inactive)`,
    );

    // Map products to include status for frontend compatibility
    const productsWithStatus = products.map((product) => ({
      ...product.toObject(),
      status: product.isActive ? "active" : "inactive",
    }));

    res.json(productsWithStatus);
  } catch (error) {
    console.error("Get all products error:", error);
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
    console.error("Get product by ID error:", error);
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
      featured,
      isActive,
    } = req.body;

    // Log incoming data for debugging
    console.log(
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
      console.log("❌ Validation failed - missing required fields:", {
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

    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "Product with this slug already exists" });
    }

    // Parse sizes if it's a string (from JSON)
    let parsedSizes = [];
    if (sizes) {
      if (typeof sizes === "string") {
        try {
          parsedSizes = JSON.parse(sizes);
        } catch (e) {
          console.error("Failed to parse sizes:", e);
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
          console.error("Failed to parse images:", e);
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
          console.error("Failed to parse colors:", e);
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
          console.error("Failed to parse tags:", e);
          parsedTags = [];
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
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

    // Create product
    const product = await Product.create({
      name,
      slug,
      description,
      specifications: specifications || "",
      materialAndCare: materialAndCare || "",
      shippingAndReturns: shippingAndReturns || "",
      category,
      price,
      comparePrice,
      brand,
      sku,
      stock: stock !== undefined ? stock : 100, // Default to 100 if not provided
      sizes: parsedSizes,
      colors: parsedColors,
      tags: parsedTags,
      images: parsedImages,
      featured: featured || false,
      isActive: isActive !== undefined ? isActive : true,
      isOutOfStock: false, // Default to not out of stock
    });

    console.log("✅ Product created successfully:", {
      id: product._id,
      name: product.name,
      slug: product.slug,
      isActive: product.isActive,
      featured: product.featured,
      category: product.category,
    });

    // Invalidate product cache
    await invalidateCache("products:*");

    res.status(201).json(product);
  } catch (error) {
    console.error("❌ Create product error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Product with this slug already exists" });
    }
    res.status(500).json({
      message: "Server error",
      error: error.message,
      details: error.errors
        ? Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          }))
        : undefined,
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
    if (category) product.category = category;
    if (price) product.price = price;
    if (comparePrice !== undefined) product.comparePrice = comparePrice;
    if (brand !== undefined) product.brand = brand;
    if (sku !== undefined) product.sku = sku;
    if (req.body.stock !== undefined) product.stock = req.body.stock;
    if (sizes !== undefined) product.sizes = sizes;
    if (colors !== undefined) product.colors = colors;
    if (tags !== undefined) product.tags = tags;
    if (images !== undefined) product.images = images;
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

    res.json(product);
  } catch (error) {
    console.error("Update product error:", error);
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
    console.error("Toggle product status error:", error);
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
    console.error("Toggle product featured error:", error);
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
    console.error("Update product status error:", error);
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

    console.log(`🗑️  Deleting product: ${product.name} (${product.slug})`);

    // Delete all product images from MinIO
    if (product.images && product.images.length > 0) {
      const { deleteObject } = require("../utils/minio");

      console.log(`📦 Product has ${product.images.length} images to delete`);

      for (const image of product.images) {
        try {
          // Images are stored as objects with { url, key }
          const objectKey = image.key || null;

          if (objectKey) {
            console.log(`  Deleting image: ${objectKey}`);
            await deleteObject(objectKey);
            console.log(`  ✅ Deleted: ${objectKey}`);
          } else {
            // Fallback: try parsing URL if key is missing
            const imageUrl = typeof image === "string" ? image : image.url;
            if (imageUrl) {
              const urlParts = imageUrl.split("/product-media/");
              if (urlParts.length > 1) {
                const objectName = urlParts[1];
                console.log(`  Deleting image (from URL): ${objectName}`);
                await deleteObject(objectName);
                console.log(`  ✅ Deleted: ${objectName}`);
              } else {
                console.log(`  ⚠️  Could not parse image URL: ${imageUrl}`);
              }
            } else {
              console.log(`  ⚠️  Image has no key or url:`, image);
            }
          }
        } catch (imageError) {
          console.error(`  ❌ Failed to delete image:`, imageError.message);
          // Continue deleting other images even if one fails
        }
      }

      console.log(`✅ Finished deleting images for product: ${product.name}`);
    } else {
      console.log(`ℹ️  Product has no images to delete`);
    }

    // Delete product from database
    await Product.findByIdAndDelete(id);

    console.log(
      `✅ Product deleted from database: ${product.name} (ID: ${id})`,
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
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
