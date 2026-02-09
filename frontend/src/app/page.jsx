'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { productAPI } from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import { FiArrowRight } from 'react-icons/fi';
import { ProductCardSkeleton } from '@/components/LoadingSpinner';
import { JsonLd, generateWebsiteJsonLd, generateOrganizationJsonLd } from '@/utils/seo';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { getIconComponent } from '@/utils/iconMapper';

const isBannerActive = (banner) => {
  if (!banner?.enabled) return false;

  const now = new Date();
  const startsAt = banner.startDate ? new Date(banner.startDate) : null;
  const endsAt = banner.endDate ? new Date(banner.endDate) : null;

  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;
  return true;
};

const shuffleArray = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function Home() {
  const { settings } = useSiteSettings();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const hero = settings.heroSection || {};
  const trustBadges = (settings.trustBadges || [])
    .filter((badge) => badge.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const featuredSection = useMemo(
    () => settings.featuredProducts || {},
    [settings.featuredProducts],
  );
  const madeToOrder = settings.homeSections?.madeToOrder || {};
  const newsletter = settings.homeSections?.newsletter || {};

  const activeBanners = useMemo(() => {
    const allBanners = settings.bannerSystem?.banners || [];
    return allBanners
      .filter((banner) => banner.type === 'homepage')
      .filter(isBannerActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [settings.bannerSystem]);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      if (!featuredSection.enabled) {
        setFeaturedProducts([]);
        setLoading(false);
        return;
      }

      const limit = Math.max(1, Math.min(Number(featuredSection.productLimit) || 8, 24));
      const selection = featuredSection.productSelection || 'latest';

      try {
        setLoading(true);

        if (selection === 'top-rated') {
          const response = await productAPI.getTopRatedProducts({ limit });
          const products = Array.isArray(response.data) ? response.data : [];
          setFeaturedProducts(products);
          return;
        }

        if (selection === 'manual') {
          const manualIds = (featuredSection.manualProductIds || []).filter(Boolean);
          if (!manualIds.length) {
            setFeaturedProducts([]);
            return;
          }

          const response = await productAPI.getAllProducts({ ids: manualIds.join(',') });
          const products = Array.isArray(response.data) ? response.data : [];
          const orderMap = new Map(manualIds.map((id, index) => [String(id), index]));
          const sortedManual = products
            .sort((a, b) => (orderMap.get(String(a._id)) || 0) - (orderMap.get(String(b._id)) || 0))
            .slice(0, limit);
          setFeaturedProducts(sortedManual);
          return;
        }

        if (selection === 'random') {
          const response = await productAPI.getAllProducts();
          const products = Array.isArray(response.data) ? response.data : [];
          setFeaturedProducts(shuffleArray(products).slice(0, limit));
          return;
        }

        const response = await productAPI.getAllProducts({ limit });
        const products = Array.isArray(response.data) ? response.data : [];
        setFeaturedProducts(products.slice(0, limit));
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, [featuredSection]);

  return (
    <>
      <JsonLd data={generateWebsiteJsonLd()} />
      <JsonLd data={generateOrganizationJsonLd()} />

      {activeBanners.length > 0 && (
        <section className="section-padding pb-6 bg-primary-50">
          <div className="container-custom grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBanners.map((banner) => (
              <div
                key={banner.id || banner.title}
                className="relative rounded-2xl overflow-hidden min-h-[220px] flex items-end p-8 text-white"
                style={{
                  backgroundImage: banner.image
                    ? `linear-gradient(90deg, rgba(17,24,39,0.65), rgba(17,24,39,0.2)), url(${banner.image})`
                    : 'linear-gradient(135deg, #1f2937, #7c2d12)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">{banner.title}</h2>
                  {banner.description && <p className="text-white/90 mb-4">{banner.description}</p>}
                  {banner.buttonText && banner.buttonLink && (
                    <Link href={banner.buttonLink} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-primary-900 font-semibold hover:bg-primary-100 transition-colors">
                      {banner.buttonText}
                      <FiArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {hero.enabled && (
        <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-brand-cream/20 to-primary-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-primary-900 mb-4 sm:mb-6 animate-fade-in leading-tight">
                {hero.title}
                {hero.subtitle && <span className="block text-brand-brown mt-2">{hero.subtitle}</span>}
              </h1>
              {hero.description && (
                <p className="text-base sm:text-lg md:text-xl text-primary-700 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in px-4">
                  {hero.description}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in px-4">
                {hero.primaryButtonText && hero.primaryButtonLink && (
                  <Link href={hero.primaryButtonLink} className="btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                    {hero.primaryButtonText}
                    <FiArrowRight className="w-5 h-5" />
                  </Link>
                )}
                {hero.secondaryButtonText && hero.secondaryButtonLink && (
                  <Link href={hero.secondaryButtonLink} className="btn btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                    {hero.secondaryButtonText}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-brown/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-tan/10 rounded-full blur-3xl"></div>
          </div>
        </section>
      )}

      {trustBadges.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {trustBadges.map((badge) => {
                const Icon = getIconComponent(badge.icon);
                return (
                  <div key={badge.id || badge.title} className="text-center p-6">
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
      )}

      {featuredSection.enabled && (
        <section className="section-padding bg-primary-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-primary-900 mb-4">
                {featuredSection.title}
              </h2>
              <p className="text-lg text-primary-600 max-w-2xl mx-auto">
                {featuredSection.description}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                <ProductCardSkeleton count={featuredSection.productLimit || 8} />
              </div>
            ) : featuredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                {featuredSection.viewAllButtonText && featuredSection.viewAllButtonLink && (
                  <div className="text-center mt-12">
                    <Link href={featuredSection.viewAllButtonLink} className="btn btn-primary">
                      {featuredSection.viewAllButtonText}
                      <FiArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-primary-600 text-lg">No products available at the moment</p>
              </div>
            )}
          </div>
        </section>
      )}

      {madeToOrder.enabled && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-primary-900 mb-6">
                {madeToOrder.title}
              </h2>
              <p className="text-lg text-primary-600 mb-8">
                {madeToOrder.description}
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-primary-600">
                {(madeToOrder.features || []).map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-brown rounded-full"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {newsletter.enabled && (
        <section className="section-padding gradient-primary text-white">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-4">
                {newsletter.title}
              </h2>
              <p className="text-lg mb-8 text-white/90">
                {newsletter.description}
              </p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder={newsletter.placeholder || 'Enter your email'}
                  className="flex-1 px-6 py-3 rounded-lg text-primary-900 focus:outline-none focus:ring-2 focus:ring-brand-tan"
                />
                <button type="submit" className="btn bg-white text-brand-brown hover:bg-brand-cream px-8">
                  {newsletter.buttonText || 'Subscribe'}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
