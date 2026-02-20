const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Review = require("../models/Review");
const { getOrSetCache } = require("../utils/cache");
const { log } = require("../utils/logger");

// Escape special regex characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Hydrate inStock virtual on lean query results (.lean() strips Mongoose virtuals)
const hydrateInStock = (doc) => {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(hydrateInStock);
  doc.inStock = doc.stock > 0 && !doc.isOutOfStock;
  return doc;
};

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
      page,
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

        // Search functionality â€” use MongoDB text index for performance
        let useTextScore = false;
        if (search && search.trim()) {
          const searchTerm = search.trim();
          if (searchTerm.length >= 2) {
            query.$text = { $search: searchTerm };
            useTextScore = true;
          }
        }

        // Filter by featured if requested
        if (featured === "true") {
          query.featured = true;
        }

        // Filter by category if provided (look up by slug or ObjectId)
        if (category) {
          if (mongoose.Types.ObjectId.isValid(category)) {
            query.category = category;
          } else {
            const cat = await Category.findOne({ slug: category.toLowerCase() }).select('_id').lean();
            if (cat) query.category = cat._id;
            else query.category = null; // no match → return empty
          }
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
              log.warn("Ignoring invalid product ids in ids filter");
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

        // Build sort options
        let sortOptions = {};
        if (useTextScore && !sortBy) {
          // Sort by text relevance when searching without explicit sort
          sortOptions = { score: { $meta: "textScore" } };
        } else if (sortBy) {
          const sortOrder = order === "asc" ? 1 : -1;
          sortOptions[sortBy] = sortOrder;
        } else {
          // Default sort
          sortOptions = { createdAt: -1 };
        }

        let mongooseQuery = Product.find(query).populate('category', 'name slug');

        // Add text score projection for relevance sorting
        if (useTextScore) {
          mongooseQuery = mongooseQuery.select({ score: { $meta: "textScore" } });
        }

        mongooseQuery = mongooseQuery.sort(sortOptions);

        // Enforce pagination with safe default limit
        const effectiveLimit = Math.min(Number(limit) || 50, 200);
        const currentPage = Math.max(Number(page) || 1, 1);
        const skip = (currentPage - 1) * effectiveLimit;

        mongooseQuery = mongooseQuery.skip(skip).limit(effectiveLimit).lean();

        // If page param provided, also get total count for pagination metadata
        if (page) {
          const [results, total] = await Promise.all([
            mongooseQuery,
            Product.countDocuments(query),
          ]);
          return {
            products: results,
            pagination: {
              page: currentPage,
              limit: effectiveLimit,
              total,
              pages: Math.ceil(total / effectiveLimit),
            },
          };
        }

        const results = await mongooseQuery;
        return results;
      },
      ttl,
    );

    // Hydrate inStock on lean results
    if (products && products.pagination) {
      products.products = hydrateInStock(products.products);
      res.json(products);
    } else {
      res.json(hydrateInStock(products));
    }
  } catch (error) {
    log.error("Get products error:", error);
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
        }).lean();

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

    return res.json(hydrateInStock(sortedProducts));
  } catch (error) {
    log.error("Get top-rated products error:", error);
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

    const searchQuery = q.trim();
    const cacheKey = `products:search:${searchQuery.toLowerCase()}`;

    const products = await getOrSetCache(
      cacheKey,
      async () => {
        const results = await Product.find({
          isActive: true,
          $text: { $search: searchQuery },
        })
          .select({ name: 1, slug: 1, images: 1, price: 1, category: 1, brand: 1, score: { $meta: "textScore" } })
          .sort({ score: { $meta: "textScore" } })
          .limit(20)
          .lean();

        return results;
      },
      120, // 2-minute cache for search results
    );

    log.info(`ðŸ” Search for "${q}": found ${products.length} results`);

    res.json(hydrateInStock(products));
  } catch (error) {
    log.error("Search products error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/products/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `products:slug:${slug}`;

    const product = await getOrSetCache(
      cacheKey,
      async () => {
        const foundProduct = await Product.findOne({
          slug,
          isActive: true,
        }).populate('category', 'name slug').lean();
        return foundProduct;
      },
      900, // 15 minutes cache
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(hydrateInStock(product));
  } catch (error) {
    log.error("Get product by slug error:", error);
    res.status(500).json({ message: "Server error" });
  }
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
    log.error("Get categories error:", error);
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
    log.error("Get brands error:", error);
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
    ).lean();

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
    log.error("Get materials error:", error);
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
    log.error("Get price range error:", error);
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
    log.error("Get colors error:", error);
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
    ).lean();

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
    log.error("Get sizes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
