export default async function sitemap() {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://api.radeo.in/api/v1";

  try {
    // Fetch all active products
    const response = await fetch(`${API_URL}/products`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!response.ok) {
      throw new Error(`Products fetch failed with status ${response.status}`);
    }
    const products = await response.json();
    const productsData = Array.isArray(products)
      ? products
      : products.products || [];

    // Generate product URLs
    const productUrls = productsData
      .filter((p) => p.isActive)
      .map((product) => ({
        url: `https://radeo.in/products/${product.slug}`,
        lastModified: product.updatedAt || new Date().toISOString(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    // Static pages
    const staticPages = [
      {
        url: "https://radeo.in",
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: "https://radeo.in/products",
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: "https://radeo.in/auth/login",
        lastModified: new Date().toISOString(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: "https://radeo.in/auth/register",
        lastModified: new Date().toISOString(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
    ];

    return [...staticPages, ...productUrls];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error generating sitemap:", error);
    }
    // Return basic sitemap if fetch fails
    return [
      {
        url: "https://radeo.in",
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: "https://radeo.in/products",
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 0.9,
      },
    ];
  }
}
