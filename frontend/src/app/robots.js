export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/checkout/",
          "/cart/",
          "/orders/",
          "/profile/",
          "/wishlist/",
          "/reset-password/",
          "/forgot-password/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/checkout/",
          "/cart/",
          "/orders/",
          "/profile/",
          "/wishlist/",
        ],
      },
    ],
    sitemap: "https://radeo.in/sitemap.xml",
  };
}
