'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
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
  const [currentSlide, setCurrentSlide] = useState(0);

  // Define activeBanners BEFORE using it in callbacks
  const activeBanners = useMemo(() => {
    const allBanners = settings.banners || [];
    return allBanners
      .filter((banner) => banner.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [settings.banners]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % (activeBanners.length || 1));
  }, [activeBanners.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + (activeBanners.length || 1)) % (activeBanners.length || 1));
  }, [activeBanners.length]);

  // Auto-play carousel
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length, nextSlide]);

  // Destructure from settings.homeSections
  const homeSections = settings.homeSections || {};
  const hero = homeSections.heroSection || {};
  const featuredSection = useMemo(
    () => homeSections.featuredProducts || {},
    [homeSections.featuredProducts],
  );
  const madeToOrder = homeSections.madeToOrder || {};
  const newsletter = homeSections.newsletter || {};

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
        <section className="relative bg-primary-900 overflow-hidden">
          <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full">
            {activeBanners.map((banner, index) => (
              <div
                key={banner.id || index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${banner.imageUrl || banner.image})`
                  }}
                >
                  <div className="absolute inset-0 bg-black/40" /> {/* Overlay */}
                </div>

                {/* Content */}
                <div className="relative z-20 container-custom h-full flex items-center">
                  <div className="max-w-2xl text-white animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-lg md:text-xl text-white/90 mb-8 max-w-lg">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.link && (
                      <Link
                        href={banner.link}
                        className="btn bg-white text-primary-900 hover:bg-brand-brown hover:text-white border-none px-8 py-3 text-lg"
                      >
                        {banner.buttonText || 'Shop Now'}
                        <FiArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
                  aria-label="Previous slide"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
                  aria-label="Next slide"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                {/* Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {activeBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
                        }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
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
                  {featuredProducts.map((product, index) => (
                    <ProductCard key={product._id} product={product} priority={index < 4} />
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
