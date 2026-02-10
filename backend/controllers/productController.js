const mongoose = require("mongoose");
const Product = require("../models/Product");
const Review = require("../models/Review");
const { getOrSetCache } = require("../utils/cache");

// Escape special regex characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/v1/products
exports.getAllProducts = async (req, res) => {
  try {
    const {
      featured,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy,
      order,
      brand,
      material,
      ids,
      limit,
      color,
      size,
    } = req.query;

    // Create a unique cache key based on query parameters
    const cacheKey = `products:${JSON.stringify(req.query)}`;

    // Cache TTL: 5 minutes for filtered lists, 15 minutes for default list
    const ttl = Object.keys(req.query).length > 0 ? 300 : 900;

    const products = await getOrSetCache(
      cacheKey,
      async () => {
        const query = { isActive: true };

        // Search functionality
        if (search && search.trim()) {
          const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
          query.$or = [
            { name: searchRegex },
            { description: searchRegex },
            { brand: searchRegex },
            { category: searchRegex },
            { tags: searchRegex },
          ];
        }

        // Filter by featured if requested
        if (featured === "true") {
          query.featured = true;
        }

        // Filter by category if provided
        if (category) {
          query.category = category.toLowerCase();
        }

        // Filter by specific product IDs if provided
        if (ids) {
          const idList = String(ids)
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

          if (idList.length > 0) {
            const validIdList = idList.filter((id) =>
              mongoose.Types.ObjectId.isValid(id),
            );

            if (validIdList.length === 0) {
              return [];
            }

            if (validIdList.length !== idList.length) {
              console.warn("Ignoring invalid product ids in ids filter");
            }

            query._id = { $in: validIdList };
          }
        }

        // Filter by brand if provided
        if (brand) {
          query.brand = new RegExp(`^${escapeRegex(brand)}$`, "i"); // Case-insensitive exact match
        }

        // Filter by material if provided
        if (material) {
          query.materialAndCare = new RegExp(escapeRegex(material), "i"); // Case-insensitive contains
        }

        // Filter by color if provided
        if (color) {
          query.colors = { $in: [new RegExp(`^${escapeRegex(color)}$`, "i")] };
        }

        // Filter by size if provided
        if (size) {
          query["sizes.size"] = new RegExp(`^${escapeRegex(size)}$`, "i");
        }

        // Price range filtering
        if (minPrice || maxPrice) {
          query.price = {};
          if (minPrice) {
            query.price.$gte = Number(minPrice);
          }
          if (maxPrice) {
            query.price.$lte = Number(maxPrice);
          }
        }

        console.log("📦 Fetching products with query:", query);

        // Build sort options
        let sortOptions = {};
        if (sortBy) {
          const sortOrder = order === "asc" ? 1 : -1;
          sortOptions[sortBy] = sortOrder;
        } else {
          // Default sort
          sortOptions = { createdAt: -1 };
        }

        console.log("📊 Sorting by:", sortOptions);

        let mongooseQuery = Product.find(query).sort(sortOptions);

        // Optional limit support for lightweight list views
        if (limit && Number(limit) > 0) {
          mongooseQuery = mongooseQuery.limit(Number(limit));
        }

        const results = await mongooseQuery;
        console.log(`✅ Found ${results.length} products`);
        return results;
      },
      ttl,
    );

    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/products/top-rated
exports.getTopRatedProducts = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 8, 50));
    const cacheKey = `products:top-rated:${limit}`;

    const sortedProducts = await getOrSetCache(
      cacheKey,
      async () => {
        const ratingRows = await Review.aggregate([
          { $match: { isHidden: false } },
          {
            $group: {
              _id: "$product",
              averageRating: { $avg: "$rating" },
              reviewCount: { $sum: 1 },
            },
          },
          { $sort: { averageRating: -1, reviewCount: -1 } },
          { $limit: limit * 3 },
        ]);

        if (!ratingRows.length) {
          return [];
        }

        const sortedProductIds = ratingRows.map((row) => row._id);
        const products = await Product.find({
          _id: { $in: sortedProductIds },
          isActive: true,
        });

        const productMap = new Map(
          products.map((product) => [String(product._id), product]),
        );
        return sortedProductIds
          .map((id) => productMap.get(String(id)))
          .filter(Boolean)
          .slice(0, limit);
      },
      1800,
    ); // Cache for 30 minutes

    return res.json(sortedProducts);
  } catch (error) {
    console.error("Get top-rated products error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/products/search
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: "Search query must be at least 2 characters",
      });
    }

    const searchRegex = new RegExp(escapeRegex(q.trim()), "i");

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
      ],
    })
      .limit(20)
      .select("name slug image price category brand")
      .sort({ featured: -1, createdAt: -1 });

    console.log(`🔍 Search for "${q}": found ${products.length} results`);

    res.json(products);
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/products/:slug
exports.getProductBySlug = async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    isActive: true,
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

// GET /api/v1/products/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await getOrSetCache(
      "products:categories",
      async () => {
        return await Product.distinct("category", { isActive: true });
      },
      3600 * 24,
    ); // Cache for 24 hours

    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/products/brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await getOrSetCache(
      "products:brands",
      async () => {
        const brands = await Product.distinct("brand", {
          isActive: true,
          brand: { $exists: true, $ne: "" },
        });
        // Sort brands alphabetically
        return brands.filter(Boolean).sort();
      },
      3600 * 24,
    ); // Cache for 24 hours

    res.json(brands);
  } catch (error) {
    console.error("Get brands error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/products/materials
exports.getMaterials = async (req, res) => {
  try {
    // Get all products with materialAndCare field
    const products = await Product.find(
      {
        isActive: true,
        materialAndCare: { $exists: true, $ne: "" },
      },
      { materialAndCare: 1 },
    );

    // Extract unique materials from the text
    const materialsSet = new Set();
    const commonMaterials = [
      "leather",
      "suede",
      "canvas",
      "mesh",
      "synthetic",
      "rubber",
      "textile",
      "cotton",
      "polyester",
      "nylon",
    ];

    products.forEach((product) => {
      const text = product.materialAndCare.toLowerCase();
      commonMaterials.forEach((material) => {
        if (text.includes(material)) {
          materialsSet.add(
            material.charAt(0).toUpperCase() + material.slice(1),
          );
        }
      });
    });

    const materials = Array.from(materialsSet).sort();
    res.json(materials);
  } catch (error) {
    console.error("Get materials error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/products/price-range
exports.getPriceRange = async (req, res) => {
  try {
    const result = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    if (result.length > 0) {
      res.json({
        min: Math.floor(result[0].minPrice),
        max: Math.ceil(result[0].maxPrice),
      });
    } else {
      res.json({ min: 0, max: 100000 });
    }
  } catch (error) {
    console.error("Get price range error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/products/colors
exports.getColors = async (req, res) => {
  try {
    const colors = await Product.distinct("colors", {
      isActive: true,
      colors: { $exists: true, $ne: [] },
    });
    // Filter out empty strings and sort alphabetically
    const sortedColors = colors.filter(Boolean).sort();
    res.json(sortedColors);
  } catch (error) {
    console.error("Get colors error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/products/sizes
exports.getSizes = async (req, res) => {
  try {
    const products = await Product.find(
      {
        isActive: true,
        sizes: { $exists: true, $ne: [] },
      },
      { sizes: 1 },
    );

    // Extract unique sizes
    const sizesSet = new Set();
    products.forEach((product) => {
      product.sizes.forEach((sizeObj) => {
        if (sizeObj.size) {
          sizesSet.add(sizeObj.size);
        }
      });
    });

    // Sort sizes numerically if possible, otherwise alphabetically
    const sizes = Array.from(sizesSet).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    res.json(sizes);
  } catch (error) {
    console.error("Get sizes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
