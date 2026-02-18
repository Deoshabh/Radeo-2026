const Product = require('../models/Product');
const Category = require('../models/Category');
const { log } = require('../utils/logger');

/**
 * Auto-generate SEO metadata for a product based on its data.
 * Can be called on product create/update to pre-fill SEO fields.
 */
function generateProductSeo(product) {
  const title = `${product.name} | Buy ${product.category || 'Shoes'} Online - Radeo`;
  const description = product.description
    ? product.description.substring(0, 155).replace(/\s+/g, ' ').trim() + '...'
    : `Shop ${product.name} - premium handcrafted ${product.category || 'shoes'} at Radeo. Free shipping on orders above â‚¹999.`;

  const keywords = [
    product.name,
    product.brand,
    product.category,
    'handcrafted shoes',
    'premium footwear',
    'buy shoes online India',
    ...(product.tags || []),
    ...(product.colors?.map((c) => `${c} shoes`) || []),
  ].filter(Boolean);

  return {
    title: title.substring(0, 60),
    description: description.substring(0, 160),
    keywords: [...new Set(keywords)].join(', '),
    ogTitle: title.substring(0, 60),
    ogDescription: description.substring(0, 160),
    ogImage: product.images?.[0]?.url || product.images?.[0] || '',
    canonicalUrl: `/products/${product.slug}`,
  };
}

/**
 * Auto-generate SEO metadata for a category.
 */
function generateCategorySeo(category) {
  const title = `${category.name} - Handcrafted Shoes Collection | Radeo`;
  const description = category.description
    ? category.description.substring(0, 155).trim()
    : `Browse our ${category.name} collection - premium handcrafted footwear at Radeo.`;

  return {
    title: title.substring(0, 60),
    description: description.substring(0, 160),
    keywords: `${category.name}, ${category.name} shoes, handcrafted ${category.name}, buy ${category.name} online`,
    ogTitle: title.substring(0, 60),
    ogDescription: description.substring(0, 160),
    ogImage: category.image?.url || '',
    canonicalUrl: `/categories/${category.slug}`,
  };
}

/**
 * POST /api/v1/admin/seo/auto-generate
 * Auto-generate SEO metadata for all products and categories
 * Returns generated metadata without saving â€” admin can review before applying
 */
exports.autoGenerateSeo = async (req, res) => {
  try {
    const { type = 'all' } = req.body; // 'products', 'categories', or 'all'
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000);
    const skip = (page - 1) * limit;
    const result = { products: [], categories: [] };

    if (type === 'products' || type === 'all') {
      const products = await Product.find({ isActive: true })
        .select('name slug description category brand tags colors images')
        .skip(skip)
        .limit(limit)
        .lean();

      result.products = products.map((p) => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        seo: generateProductSeo(p),
      }));
    }

    if (type === 'categories' || type === 'all') {
      const categories = await Category.find()
        .select('name slug description image')
        .limit(500)
        .lean();

      result.categories = categories.map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        seo: generateCategorySeo(c),
      }));
    }

    res.json({
      success: true,
      generated: {
        products: result.products.length,
        categories: result.categories.length,
      },
      data: result,
    });
  } catch (error) {
    log.error('Auto-generate SEO error:', error);
    res.status(500).json({ message: 'Failed to auto-generate SEO metadata' });
  }
};

/**
 * GET /api/v1/admin/seo/audit
 * Audit SEO across all products/categories â€” find missing or weak metadata
 */
exports.auditSeo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const auditLimit = Math.min(parseInt(req.query.limit) || 500, 2000);
    const skip = (page - 1) * auditLimit;

    const [products, categories, totalProducts, totalCategories] = await Promise.all([
      Product.find({ isActive: true })
        .select('name slug description images seo')
        .skip(skip)
        .limit(auditLimit)
        .lean(),
      Category.find()
        .select('name slug description image seo')
        .limit(500)
        .lean(),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments()
    ]);

    const issues = [];

    for (const p of products) {
      if (!p.description || p.description.length < 50) {
        issues.push({ type: 'product', slug: p.slug, name: p.name, issue: 'Description too short or missing' });
      }
      if (!p.images || p.images.length === 0) {
        issues.push({ type: 'product', slug: p.slug, name: p.name, issue: 'No images â€” OG image will be empty' });
      }
    }

    for (const c of categories) {
      if (!c.description) {
        issues.push({ type: 'category', slug: c.slug, name: c.name, issue: 'Description missing' });
      }
      if (!c.image?.url) {
        issues.push({ type: 'category', slug: c.slug, name: c.name, issue: 'No image â€” OG image will be empty' });
      }
    }

    res.json({
      success: true,
      summary: {
        totalProducts,
        totalCategories,
        scannedProducts: products.length,
        issuesCount: issues.length,
        page,
        limit: auditLimit,
      },
      issues,
    });
  } catch (error) {
    log.error('SEO audit error:', error);
    res.status(500).json({ message: 'Failed to run SEO audit' });
  }
};

// Export helpers for use in product/category controllers
exports.generateProductSeo = generateProductSeo;
exports.generateCategorySeo = generateCategorySeo;
