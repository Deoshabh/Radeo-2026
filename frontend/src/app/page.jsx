import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { FiArrowRight } from 'react-icons/fi';
import { ProductCardSkeleton } from '@/components/LoadingSpinner';
import { JsonLd, generateWebsiteJsonLd, generateOrganizationJsonLd } from '@/utils/seo';
import { getIconComponent } from '@/utils/iconMapper';
import { SITE_SETTINGS_DEFAULTS } from '@/constants/siteSettingsDefaults';

import HeroAnimate from '@/components/ui/HeroAnimate';
import ScrollReveal from '@/components/ui/ScrollReveal';

// Force dynamic rendering since we rely on external API data that changes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- Data Fetching ---

async function getSiteSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/public`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch settings:', res.status, res.statusText);
      return SITE_SETTINGS_DEFAULTS;
    }

    const data = await res.json();
    return data.settings || SITE_SETTINGS_DEFAULTS;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return SITE_SETTINGS_DEFAULTS;
  }
}

async function getFeaturedProducts(limit = 8, selection = 'latest', manualIds = []) {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?limit=${limit}`;

    if (selection === 'top-rated') {
      url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/top-rated?limit=${limit}`;
    } else if (selection === 'manual' && manualIds.length > 0) {
      url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?ids=${manualIds.join(',')}`;
    }

    const res = await fetch(url, { cache: 'no-store' }); // Ensure fresh products
    if (!res.ok) return [];

    const data = await res.json();
    let products = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []);

    // Manual sort
    if (selection === 'manual' && manualIds.length > 0) {
      const orderMap = new Map(manualIds.map((id, index) => [String(id), index]));
      products = products.sort((a, b) => (orderMap.get(String(a._id)) || 0) - (orderMap.get(String(b._id)) || 0));
    }

    // Random shuffle if needed
    if (selection === 'random') {
      products = products.sort(() => Math.random() - 0.5);
    }

    return products.slice(0, limit);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

// --- Components ---

const HeroSection = ({ banners, heroSettings }) => {
  // Use banners if enabled and active, else fallback to Hero Settings
  const activeBanners = (banners || [])
    .filter(b => b.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (activeBanners.length > 0) {
    // For simplicity in SSR, show the first banner as Hero.
    // A Client Component can hydrate this into a full carousel.
    const banner = activeBanners[0];
    return (
      <HeroAnimate
        backgroundUrl={banner.imageUrl || banner.image}
        className="h-[500px] lg:h-[600px] flex items-center"
      >
        <div className="container-custom">
          <div className="max-w-2xl text-white">
            <h2 className="text-5xl lg:text-7xl font-bold mb-4 leading-tight">{banner.title}</h2>
            {banner.subtitle && <p className="text-xl text-white/90 mb-8">{banner.subtitle}</p>}
            {banner.link && (
              <div className="inline-block">
                <Link href={banner.link} className="btn bg-white text-primary-900 px-8 py-3 text-lg hover:bg-brand-brown hover:text-white border-none">
                  {banner.buttonText || 'Shop Now'} <FiArrowRight className="inline ml-2" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </HeroAnimate>
    );
  }

  // Fallback to Admin-defined Hero Section
  if (!heroSettings?.enabled) return null;

  return (
    <section className={`relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-gradient-to-br ${heroSettings.backgroundGradient || 'from-primary-50 via-brand-cream/20 to-primary-100'}`}>
      <div className="container mx-auto px-4 text-center z-10">
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-primary-900 mb-6">
          {heroSettings.title}
          {heroSettings.subtitle && <span className="block text-brand-brown mt-2">{heroSettings.subtitle}</span>}
        </h1>
        {heroSettings.description && (
          <p className="text-xl text-primary-700 mb-8 max-w-2xl mx-auto">{heroSettings.description}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {heroSettings.primaryButtonLink && (
            <Link href={heroSettings.primaryButtonLink} className="btn btn-primary text-lg px-8 py-4">
              {heroSettings.primaryButtonText} <FiArrowRight className="inline ml-2" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// --- Main Page Component ---

export default async function Home() {
  const settings = await getSiteSettings();

  const featuredSection = settings.homeSections?.featuredProducts || {};
  const products = await getFeaturedProducts(
    featuredSection.productLimit,
    featuredSection.productSelection,
    featuredSection.manualProductIds
  );

  return (
    <>
      <JsonLd data={generateWebsiteJsonLd()} />
      <JsonLd data={generateOrganizationJsonLd()} />

      <HeroSection banners={settings.banners} heroSettings={settings.homeSections?.heroSection} />

      {/* Trust Badges */}
      {settings.trustBadges?.length > 0 && (
        <ScrollReveal>
          <section className="section-padding bg-white">
            <div className="container-custom">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {settings.trustBadges.map(badge => {
                  const Icon = getIconComponent(badge.icon);
                  return (
                    <div key={badge.id} className="text-center p-6">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-8 h-8 text-brand-brown" />
                      </div>
                      <h3 className="font-serif text-xl font-semibold mb-2">{badge.title}</h3>
                      <p className="text-primary-600">{badge.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Featured Products */}
      {featuredSection.enabled && (
        <ScrollReveal delay={200}>
          <section className="section-padding bg-primary-50">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="font-serif text-4xl font-bold text-primary-900 mb-4">{featuredSection.title}</h2>
                <p className="text-lg text-primary-600 max-w-2xl mx-auto">{featuredSection.description}</p>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map((product, idx) => (
                    <ProductCard key={product._id} product={product} priority={idx < 4} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-primary-600">No products available.</p>
              )}

              {featuredSection.viewAllButtonLink && (
                <div className="text-center mt-12">
                  <Link href={featuredSection.viewAllButtonLink} className="btn btn-primary">
                    {featuredSection.viewAllButtonText} <FiArrowRight className="ml-2 inline" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Made to Order */}
      {settings.homeSections?.madeToOrder?.enabled && (
        <ScrollReveal delay={100}>
          <section className="section-padding bg-white text-center">
            <div className="container-custom max-w-4xl">
              <h2 className="font-serif text-4xl font-bold text-primary-900 mb-6">{settings.homeSections.madeToOrder.title}</h2>
              <p className="text-lg text-primary-600 mb-8">{settings.homeSections.madeToOrder.description}</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-primary-600">
                {settings.homeSections.madeToOrder.features.map(f => (
                  <span key={f} className="bg-primary-50 px-3 py-1 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}
    </>
  );
}
