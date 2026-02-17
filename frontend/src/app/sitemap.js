export default async function sitemap() {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://api.radeo.in/api/v1";
  const BASE_URL = "https://radeo.in";

  // Static pages that always exist
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/shipping`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/returns`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date().toISOString(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date().toISOString(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    // Fetch all active products
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${API_URL}/products`, { next: { revalidate: 3600 } }),
      fetch(`${API_URL}/products/categories`, { next: { revalidate: 86400 } }),
    ]);

    // --- Products ---
    let productUrls = [];
    if (productsRes.ok) {
      const products = await productsRes.json();
      const productsData = Array.isArray(products)
        ? products
        : products.products || [];

      productUrls = productsData
        .filter((p) => p.isActive)
        .map((product) => ({
          url: `${BASE_URL}/products/${product.slug}`,
          lastModified: product.updatedAt || new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.8,
        }));
    }

    // --- Categories ---
    let categoryUrls = [];
    if (categoriesRes.ok) {
      const categories = await categoriesRes.json();
      if (Array.isArray(categories)) {
        categoryUrls = categories.map((cat) => ({
          url: `${BASE_URL}/category/${encodeURIComponent(cat)}`,
          lastModified: new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.7,
        }));
      }
    }

    return [...staticPages, ...categoryUrls, ...productUrls];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error generating sitemap:", error);
    }
    // Return static-only sitemap if API fails
    return staticPages;
  }
}
