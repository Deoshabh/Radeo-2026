'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import ProductCard from '@/components/ProductCard';
import HeroAnimate from '@/components/ui/HeroAnimate';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { getIconComponent } from '@/utils/iconMapper';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useMemo } from 'react';

// --- Sub-components ---

const HeroSection = ({ banners, heroSettings }) => {
    // Use banners if enabled and active, else fallback to Hero Settings
    const activeBanners = (banners || [])
        .filter(b => b.isActive)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (activeBanners.length > 0) {
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

const FeaturedProductsSection = ({ settings, products }) => {
    const sectionData = settings.homeSections?.featuredProducts || {};
    if (!sectionData.enabled) return null;

    return (
        <ScrollReveal delay={200}>
            <section className="section-padding bg-primary-50">
                <div className="container-custom">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-4xl font-bold text-primary-900 mb-4">{sectionData.title}</h2>
                        <p className="text-lg text-primary-600 max-w-2xl mx-auto">{sectionData.description}</p>
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

                    {sectionData.viewAllButtonLink && (
                        <div className="text-center mt-12">
                            <Link href={sectionData.viewAllButtonLink} className="btn btn-primary">
                                {sectionData.viewAllButtonText} <FiArrowRight className="ml-2 inline" />
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </ScrollReveal>
    );
};

const MadeToOrderSection = ({ settings }) => {
    const sectionData = settings.homeSections?.madeToOrder || {};
    if (!sectionData.enabled) return null;

    return (
        <ScrollReveal delay={100}>
            <section className="section-padding bg-white text-center">
                <div className="container-custom max-w-4xl">
                    <h2 className="font-serif text-4xl font-bold text-primary-900 mb-6">{sectionData.title}</h2>
                    <p className="text-lg text-primary-600 mb-8">{sectionData.description}</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-primary-600">
                        {sectionData.features?.map(f => (
                            <span key={f} className="bg-primary-50 px-3 py-1 rounded-full">{f}</span>
                        ))}
                    </div>
                </div>
            </section>
        </ScrollReveal>
    );
};

const NewsletterSection = ({ settings }) => {
    const sectionData = settings.homeSections?.newsletter || {};
    if (!sectionData.enabled) return null;

    return (
        <ScrollReveal delay={100}>
            <section className="section-padding bg-brand-brown text-white text-center">
                <div className="container-custom max-w-2xl">
                    <h2 className="font-serif text-3xl font-bold mb-4">{sectionData.title}</h2>
                    <p className="text-white/80 mb-8">{sectionData.description}</p>
                    <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Your email address"
                            className="flex-1 px-4 py-3 rounded-md text-gray-900 focus:outline-none"
                        />
                        <button className="bg-brand-tan text-white px-6 py-3 rounded-md hover:bg-white hover:text-brand-brown transition-colors font-medium">
                            {sectionData.buttonText}
                        </button>
                    </form>
                </div>
            </section>
        </ScrollReveal>
    );
};

const TrustBadgesSection = ({ settings }) => {
    if (!settings.trustBadges?.length) return null;
    return (
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
    );
};

export default function HomeSections({ initialSettings, initialProducts }) {
    const { settings: clientSettings, loading } = useSiteSettings();

    // Prefer client settings if loaded (which includes live previews), otherwise fallback to server settings (SSR)
    const activeSettings = useMemo(() => {
        // If we're loading client settings, sticking to initialSettings is safer to avoid layout shift
        // unless we have a specific reason to believe clientSettings has more recent data (like live preview).
        // However, deepMerge in Context ensures we have data. 
        // If loading is true, 'clientSettings' might be defaults.
        // So:
        if (loading) return initialSettings;
        return clientSettings;
    }, [loading, clientSettings, initialSettings]);

    // Determine Layout Order
    // Use settings.layout if available, otherwise fallback to default structure
    let renderOrder = [];

    if (activeSettings.layout && activeSettings.layout.length > 0) {
        renderOrder = activeSettings.layout.filter(item => item.enabled);
    } else {
        // Default fallback
        if (activeSettings.homeSections?.heroSection?.enabled) renderOrder.push({ id: 'hero', type: 'hero' });
        if (activeSettings.homeSections?.featuredProducts?.enabled) renderOrder.push({ id: 'products', type: 'products' });
        if (activeSettings.homeSections?.madeToOrder?.enabled) renderOrder.push({ id: 'madeToOrder', type: 'madeToOrder' });
        if (activeSettings.homeSections?.newsletter?.enabled) renderOrder.push({ id: 'newsletter', type: 'newsletter' });
    }

    // Helper to render section by type
    const renderSection = (section) => {
        switch (section.type) {
            case 'hero':
                return <HeroSection key={section.id} banners={activeSettings.banners} heroSettings={activeSettings.homeSections?.heroSection} />;
            case 'products':
                return <FeaturedProductsSection key={section.id} settings={activeSettings} products={initialProducts} />;
            case 'madeToOrder':
                return <MadeToOrderSection key={section.id} settings={activeSettings} />;
            case 'newsletter':
                return <NewsletterSection key={section.id} settings={activeSettings} />;
            default:
                return null;
        }
    };

    return (
        <>
            {renderOrder.map(section => (
                <div key={section.id}>
                    {renderSection(section)}
                    {/* Inject Trust Badges after Hero if it's the first render (or check type) */}
                    {section.type === 'hero' && <TrustBadgesSection settings={activeSettings} />}
                </div>
            ))}
        </>
    );
}
