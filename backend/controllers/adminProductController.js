const Product = require("../models/Product");

// @desc    Get all products (admin view)
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
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
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
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
      stock: stock || 0,
      sizes: parsedSizes,
      colors: parsedColors,
      tags: parsedTags,
      images: parsedImages,
      featured: featured || false,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Server error" });
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
      sizes,
      images,
      featured,
      isActive,
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
    if (sizes !== undefined) product.sizes = sizes;
    if (images !== undefined) product.images = images;
    if (featured !== undefined) product.featured = featured;
    if (isActive !== undefined) product.isActive = isActive;
    if (req.body.isOutOfStock !== undefined)
      product.isOutOfStock = req.body.isOutOfStock;

    await product.save();

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

    res.json(product);
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

    res.json(product);
  } catch (error) {
    console.error("Update product status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
