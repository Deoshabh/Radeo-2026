'use client';

import { useEffect } from 'react';
import { generateProductMetadata, JsonLd, generateProductJsonLd } from '@/utils/seo';

/**
 * Dynamic Metadata Component for Product Pages
 * Updates document metadata when product data loads
 */
export function ProductMetadata({ product }) {
  useEffect(() => {
    if (!product) return;

    // Generate metadata
    const metadata = generateProductMetadata(product);

    // Update document title
    document.title = metadata.title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = metadata.description;

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = metadata.keywords;

    // Update Open Graph tags
    updateMetaTag('property', 'og:title', metadata.openGraph.title);
    updateMetaTag('property', 'og:description', metadata.openGraph.description);
    updateMetaTag('property', 'og:url', metadata.openGraph.url);
    updateMetaTag('property', 'og:type', metadata.openGraph.type);
    updateMetaTag('property', 'og:image', metadata.openGraph.images[0].url);
    updateMetaTag('property', 'og:image:width', metadata.openGraph.images[0].width);
    updateMetaTag('property', 'og:image:height', metadata.openGraph.images[0].height);
    updateMetaTag('property', 'og:site_name', metadata.openGraph.siteName);

    // Update Twitter Card tags
    updateMetaTag('name', 'twitter:card', metadata.twitter.card);
    updateMetaTag('name', 'twitter:title', metadata.twitter.title);
    updateMetaTag('name', 'twitter:description', metadata.twitter.description);
    updateMetaTag('name', 'twitter:image', metadata.twitter.images[0]);
    updateMetaTag('name', 'twitter:site', metadata.twitter.site);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = metadata.openGraph.url;
  }, [product]);

  if (!product) return null;

  return (
    <>
      <JsonLd data={generateProductJsonLd(product)} />
    </>
  );
}

/**
 * Helper function to update or create meta tags
 */
function updateMetaTag(attribute, attributeValue, content) {
  let tag = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, attributeValue);
    document.head.appendChild(tag);
  }
  tag.content = content || '';
}

export default ProductMetadata;
