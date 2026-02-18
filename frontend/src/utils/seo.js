/**
 * SEO Metadata Utilities
 * Helper functions to generate consistent SEO metadata
 */

import {
  SITE_URL,
  SITE_NAME,
  TWITTER_HANDLE,
} from '@/lib/constants';

const SITE_DESCRIPTION =
  "Discover exquisite handcrafted shoes made with premium materials and timeless craftsmanship. Shop the finest collection of luxury footwear at Radeo.";
const SITE_IMAGE = `${SITE_URL}/og-image.jpg`;

/**
 * Generate base metadata for all pages
 */
export const generateMetadata = ({
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  image = SITE_IMAGE,
  url = SITE_URL,
  type = "website",
  keywords = [],
  noindex = false,
  nofollow = false,
}) => {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

  const metadata = {
    title: fullTitle,
    description,
    keywords: [
      "shoes",
      "footwear",
      "premium shoes",
      "handcrafted shoes",
      "luxury footwear",
      "online shoe store",
      ...keywords,
    ].join(", "),

    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: "en_IN",
      type,
    },

    // Twitter
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },

    // Verification tags
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },

    // Icons
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },

    // Alternate languages (if applicable)
    alternates: {
      canonical: url,
    },

    // Other metadata
    other: {
      "application-name": SITE_NAME,
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": SITE_NAME,
      "format-detection": "telephone=no",
      "mobile-web-app-capable": "yes",
      "msapplication-TileColor": "#8B4513",
      "theme-color": "#8B4513",
    },
  };

  // Add robots directive if needed
  if (noindex || nofollow) {
    metadata.robots = {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
      },
    };
  }

  return metadata;
};

/**
 * Generate product page metadata
 */
export const generateProductMetadata = (product) => {
  const imageUrl = typeof product.images?.[0] === 'string'
    ? product.images[0]
    : product.images?.[0]?.url || SITE_IMAGE;

  return generateMetadata({
    title: product.name,
    description: product.description?.substring(0, 160) || SITE_DESCRIPTION,
    image: imageUrl,
    url: `${SITE_URL}/products/${product.slug}`,
    type: "website",
    keywords: [
      product.name,
      product.brand,
      product.category?.name,
      ...(product.tags || []),
    ].filter(Boolean),
  });
};

/**
 * Generate category page metadata
 */
export const generateCategoryMetadata = (category) => {
  return generateMetadata({
    title: category.name,
    description:
      category.description ||
      `Shop ${category.name} at Radeo. Discover our premium collection of ${category.name.toLowerCase()}.`,
    image: category.image || SITE_IMAGE,
    url: `${SITE_URL}/products?category=${category.slug}`,
    keywords: [category.name, "shoes", "footwear", "buy online"],
  });
};

/**
 * Generate JSON-LD structured data for product
 */
export const generateProductJsonLd = (product, url) => {
  const productUrl = url || `${SITE_URL}/products/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images?.map((img) => img.url || img) || [],
    sku: product.sku || product._id,
    brand: {
      "@type": "Brand",
      name: product.brand || SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      ).toISOString(),
      availability:
        product.quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
    aggregateRating: product.ratings
      ? {
          "@type": "AggregateRating",
          ratingValue: product.ratings.average,
          reviewCount: product.ratings.count,
        }
      : undefined,
  };
};

/**
 * Generate JSON-LD structured data for organization.
 * Accepts optional siteSettings to use dynamic branding/contact values
 * from the admin panel instead of env vars.
 *
 * @param {Object} [siteSettings] - Site settings from admin panel
 */
export const generateOrganizationJsonLd = (siteSettings) => {
  const branding = siteSettings?.branding || {};
  const contact = siteSettings?.contact || {};
  const social = siteSettings?.social || {};

  const orgName = branding.siteName || SITE_NAME;
  const logoUrl = branding.logoUrl || `${SITE_URL}/logo.png`;
  const phone = contact.phone || process.env.NEXT_PUBLIC_CONTACT_PHONE || '';

  const contactPoint = phone
    ? {
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      }
    : undefined;

  const address = contact.address
    ? {
        "@type": "PostalAddress",
        streetAddress: contact.address,
        addressLocality: contact.city || "Agra",
        addressRegion: contact.state || "Uttar Pradesh",
        addressCountry: "IN",
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: orgName,
    url: SITE_URL,
    logo: logoUrl,
    description: SITE_DESCRIPTION,
    ...(contactPoint && { contactPoint }),
    ...(address && { address }),
    sameAs: [
      social.instagram || process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      social.facebook || process.env.NEXT_PUBLIC_FACEBOOK_URL,
      social.twitter || process.env.NEXT_PUBLIC_TWITTER_URL,
    ].filter(Boolean),
  };
};

/**
 * Generate JSON-LD structured data for breadcrumb
 */
export const generateBreadcrumbJsonLd = (breadcrumbs) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
};

/**
 * Generate JSON-LD structured data for website search
 */
export const generateWebsiteJsonLd = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
};

/**
 * Component to render JSON-LD script
 */
export const JsonLd = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

const seoUtils = {
  generateMetadata,
  generateProductMetadata,
  generateCategoryMetadata,
  generateProductJsonLd,
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd,
  generateWebsiteJsonLd,
  JsonLd,
};

export default seoUtils;
