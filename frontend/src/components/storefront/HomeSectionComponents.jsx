'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight } from 'react-icons/fi';
import ProductCard from '@/components/ProductCard';
import HeroAnimate from '@/components/ui/HeroAnimate';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { getIconComponent } from '@/utils/iconMapper';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const normalizeFeatureList = (features) => {
    if (Array.isArray(features)) return features.filter(Boolean);
    if (typeof features === 'string') {
        return features
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

const resolveHeroTextAlignment = (alignment = 'center') => {
    if (alignment === 'left') return 'text-left items-start';
    if (alignment === 'right') return 'text-right items-end';
    return 'text-center items-center';
};

const resolveHeroContentPosition = (alignment = 'center') => {
    if (alignment === 'left') return 'mr-auto';
    if (alignment === 'right') return 'ml-auto';
    return 'mx-auto';
};

export const HeroSection = ({ banners, heroSettings }) => {
    const activeBanners = (banners || [])
        .filter((banner) => banner?.isActive === true || banner?.enabled === true)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (activeBanners.length > 0) {
        const banner = activeBanners[0];
        const bannerTitle =
            banner.title ||
            banner.name ||
            heroSettings?.title ||
            '';
        const bannerSubtitle =
            banner.subtitle ||
            banner.description ||
            heroSettings?.subtitle ||
            heroSettings?.description ||
            '';
        const bannerPrimaryLink = banner.link || banner.primaryLink || '';
        const bannerPrimaryText =
            banner.buttonText ||
            banner.primaryButtonText ||
            heroSettings?.primaryButtonText ||
            heroSettings?.buttonText ||
            'Shop Now';
        const bannerSecondaryLink =
            banner.secondaryLink ||
            banner.secondaryButtonLink ||
            heroSettings?.secondaryButtonLink ||
            heroSettings?.buttonLinkSecondary ||
            '';
        const bannerSecondaryText =
            banner.secondaryButtonText ||
            banner.buttonTextSecondary ||
            heroSettings?.secondaryButtonText ||
            heroSettings?.buttonTextSecondary ||
            'Learn More';

        return (
            <HeroAnimate
                backgroundUrl={banner.imageUrl || banner.image}
                className="h-[500px] lg:h-[600px] flex items-center"
            >
                <div className="container-custom">
                    <div className="max-w-2xl text-white">
                        <h2 className="text-5xl lg:text-7xl font-bold mb-4 leading-tight">{bannerTitle}</h2>
                        {bannerSubtitle && <p className="text-xl text-white/90 mb-8">{bannerSubtitle}</p>}
                        {(bannerPrimaryLink || bannerSecondaryLink) && (
                            <div className="inline-flex flex-col sm:flex-row gap-4">
                                {bannerPrimaryLink && (
                                    <Link href={bannerPrimaryLink} className="btn bg-white text-primary-900 px-8 py-3 text-lg hover:bg-brand-brown hover:text-white border-none">
                                        {bannerPrimaryText} <FiArrowRight className="inline ml-2" />
                                    </Link>
                                )}
                                {bannerSecondaryLink && (
                                    <Link href={bannerSecondaryLink} className="btn btn-secondary px-8 py-3 text-lg">
                                        {bannerSecondaryText}
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </HeroAnimate>
        );
    }

    if (!heroSettings?.enabled) return null;

    const primaryButtonText =
        heroSettings.primaryButtonText ?? heroSettings.buttonText ?? 'Shop Collection';
    const primaryButtonLink =
        heroSettings.primaryButtonLink ?? heroSettings.buttonLink ?? '/products';
    const secondaryButtonText =
        heroSettings.secondaryButtonText ?? heroSettings.buttonTextSecondary ?? 'Learn More';
    const secondaryButtonLink =
        heroSettings.secondaryButtonLink ?? heroSettings.buttonLinkSecondary ?? '';
    const hasPrimaryButton = typeof primaryButtonLink === 'string' ? primaryButtonLink.trim().length > 0 : Boolean(primaryButtonLink);
    const hasSecondaryButton = typeof secondaryButtonLink === 'string' ? secondaryButtonLink.trim().length > 0 : Boolean(secondaryButtonLink);

    const heroLayout = heroSettings.layout || 'full-bleed';
    const heroAlignment = heroSettings.alignment || (heroLayout === 'minimal' ? 'center' : 'left');
    const heroAnimationType = heroSettings.animation?.type || 'none';
    const heroHasImage = Boolean(heroSettings.imageUrl);
    const textAlignmentClass = resolveHeroTextAlignment(heroAlignment);
    const contentPositionClass = resolveHeroContentPosition(heroAlignment);
    const contentWidthClass = heroLayout === 'minimal' ? 'max-w-3xl' : 'max-w-2xl';

    const contentNode = (
        <div className="container-custom">
            <div className={`w-full ${contentWidthClass} ${contentPositionClass} flex flex-col ${textAlignmentClass}`}>
                <h1 data-hero-animate className={`font-serif text-5xl md:text-7xl font-bold mb-6 ${heroHasImage ? 'text-white' : 'text-primary-900'}`}>
                    {heroSettings.title}
                    {heroSettings.subtitle && (
                        <span className={`block mt-2 ${heroHasImage ? 'text-white/90' : 'text-brand-brown'}`}>{heroSettings.subtitle}</span>
                    )}
                </h1>
                {heroSettings.description && (
                    <p data-hero-animate className={`text-xl mb-8 ${heroHasImage ? 'text-white/90' : 'text-primary-700'}`}>{heroSettings.description}</p>
                )}
                <div data-hero-animate className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
                    {hasPrimaryButton && (
                        <Link href={primaryButtonLink} className="btn btn-primary text-lg px-8 py-4">
                            {primaryButtonText} <FiArrowRight className="inline ml-2" />
                        </Link>
                    )}
                    {hasSecondaryButton && (
                        <Link href={secondaryButtonLink} className="btn btn-secondary text-lg px-8 py-4">
                            {secondaryButtonText}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );

    if (heroHasImage) {
        return (
            <HeroAnimate
                backgroundUrl={heroSettings.imageUrl}
                animationType={heroAnimationType}
                className="min-h-[calc(100vh-80px)] flex items-center"
            >
                {contentNode}
            </HeroAnimate>
        );
    }

    return (
        <section className={`relative min-h-[calc(100vh-80px)] flex items-center overflow-hidden bg-gradient-to-br ${heroSettings.backgroundGradient || 'from-primary-50 via-brand-cream/20 to-primary-100'}`}>
            <HeroAnimate animationType={heroAnimationType} className="w-full">
                {contentNode}
            </HeroAnimate>
        </section>
    );
};

export const TextSection = ({ sectionData }) => {
    if (!sectionData?.content) return null;

    return (
        <ScrollReveal delay={100}>
            <section className="section-padding bg-white">
                <div className="container-custom max-w-4xl">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-stone max-w-none text-primary-700">
                        {sectionData.content}
                    </ReactMarkdown>
                </div>
            </section>
        </ScrollReveal>
    );
};

export const FeaturedProductsSection = ({ sectionData = {}, products }) => {
    if (!sectionData.enabled) return null;

    const productLimit = Number(sectionData.productLimit);
    const visibleProducts = Number.isFinite(productLimit) && productLimit > 0
        ? products.slice(0, productLimit)
        : products;

    return (
        <ScrollReveal delay={200}>
            <section className="section-padding bg-primary-50">
                <div className="container-custom">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-4xl font-bold text-primary-900 mb-4">{sectionData.title}</h2>
                        <p className="text-lg text-primary-600 max-w-2xl mx-auto">{sectionData.description}</p>
                    </div>

                    {visibleProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {visibleProducts.map((product, idx) => (
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

export const MadeToOrderSection = ({ sectionData = {} }) => {
    if (!sectionData.enabled) return null;

    const featureList = normalizeFeatureList(sectionData.features);

    return (
        <ScrollReveal delay={100}>
            <section className="section-padding bg-white text-center">
                <div className="container-custom max-w-4xl">
                    <h2 className="font-serif text-4xl font-bold text-primary-900 mb-6">{sectionData.title}</h2>
                    <p className="text-lg text-primary-600 mb-8">{sectionData.description}</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-primary-600">
                        {featureList.map((feature) => (
                            <span key={feature} className="bg-primary-50 px-3 py-1 rounded-full">{feature}</span>
                        ))}
                    </div>
                </div>
            </section>
        </ScrollReveal>
    );
};

export const NewsletterSection = ({ sectionData = {} }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');

    if (!sectionData.enabled) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!email.trim()) {
            return;
        }

        try {
            setStatus('submitting');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Newsletter Subscriber',
                    email: email.trim(),
                    message: 'Newsletter subscription request',
                }),
            });

            if (!response.ok) {
                throw new Error('Newsletter request failed');
            }

            setEmail('');
            setStatus('success');
            toast.success('Thanks for subscribing!');
        } catch {
            setStatus('error');
            toast.error('Unable to subscribe right now. Please try again.');
        }
    };

    return (
        <ScrollReveal delay={100}>
            <section className="section-padding bg-brand-brown text-white text-center">
                <div className="container-custom max-w-2xl">
                    <h2 className="font-serif text-3xl font-bold mb-4">{sectionData.title}</h2>
                    <p className="text-white/80 mb-8">{sectionData.description}</p>
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            placeholder={sectionData.placeholder || 'Your email address'}
                            className="flex-1 px-4 py-3 rounded-md text-gray-900 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="bg-brand-tan text-white px-6 py-3 rounded-md hover:bg-white hover:text-brand-brown transition-colors font-medium disabled:opacity-70"
                        >
                            {sectionData.buttonText}
                        </button>
                    </form>
                    {status === 'success' && (
                        <p className="mt-3 text-sm text-white/85">Subscription request sent successfully.</p>
                    )}
                </div>
            </section>
        </ScrollReveal>
    );
};

export const TestimonialsSection = ({ sectionData = {} }) => {
    if (!sectionData.enabled) return null;

    const testimonials = Array.isArray(sectionData.items)
        ? sectionData.items.filter(Boolean)
        : [];

    if (!testimonials.length) return null;

    return (
        <ScrollReveal delay={100}>
            <section className="section-padding bg-primary-50">
                <div className="container-custom">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-4xl font-bold text-primary-900 mb-4">{sectionData.title}</h2>
                        {sectionData.description && (
                            <p className="text-lg text-primary-600 max-w-2xl mx-auto">{sectionData.description}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testimonials.map((item, index) => (
                            <article
                                key={item.id || `${item.name || 'testimonial'}-${index}`}
                                className="rounded-xl border p-6"
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                }}
                            >
                                <p className="leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>“{item.quote || ''}”</p>
                                <div>
                                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.name || 'Customer'}</p>
                                    {item.role && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.role}</p>}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </ScrollReveal>
    );
};

export const BrandsSection = ({ sectionData = {} }) => {
    if (!sectionData.enabled) return null;

    const brands = Array.isArray(sectionData.items)
        ? sectionData.items.filter(Boolean)
        : [];

    if (!brands.length) return null;

    return (
        <ScrollReveal delay={100}>
            <section className="section-padding bg-white">
                <div className="container-custom">
                    <div className="text-center mb-10">
                        <h2 className="font-serif text-4xl font-bold text-primary-900 mb-4">{sectionData.title}</h2>
                        {sectionData.description && (
                            <p className="text-lg text-primary-600 max-w-2xl mx-auto">{sectionData.description}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {brands.map((brand, index) => (
                            <div
                                key={brand.id || `${brand.name || 'brand'}-${index}`}
                                className="rounded-lg border p-5 text-center"
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--color-surface) 80%, var(--color-background) 20%)',
                                    borderColor: 'var(--color-border)',
                                }}
                            >
                                <div
                                    className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold border"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-secondary)',
                                    }}
                                >
                                    {(brand.logoText || brand.name || 'BR').slice(0, 2).toUpperCase()}
                                </div>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{brand.name || 'Brand'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </ScrollReveal>
    );
};

export const CategoriesSection = ({ sectionData = {} }) => {
    if (!sectionData.enabled) return null;

    const categories = Array.isArray(sectionData.items)
        ? sectionData.items.filter(Boolean)
        : [];

    if (!categories.length) return null;

    return (
        <ScrollReveal delay={100}>
            <section className="section-padding bg-primary-50">
                <div className="container-custom">
                    <div className="text-center mb-10">
                        <h2 className="font-serif text-4xl font-bold text-primary-900 mb-4">{sectionData.title}</h2>
                        {sectionData.description && (
                            <p className="text-lg text-primary-600 max-w-2xl mx-auto">{sectionData.description}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categories.map((category, index) => (
                            <Link
                                key={category.id || `${category.name || 'category'}-${index}`}
                                href={category.link || '/products'}
                                className="rounded-lg border px-4 py-5 text-center transition-colors"
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)',
                                }}
                            >
                                <span className="font-medium">{category.name || 'Category'}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </ScrollReveal>
    );
};

export const VideoHeroSection = ({ sectionData = {} }) => {
    if (!sectionData.enabled) return null;

    const primaryText = sectionData.primaryButtonText || sectionData.buttonText || 'Shop Collection';
    const primaryLink = sectionData.primaryButtonLink || sectionData.buttonLink || '/products';
    const secondaryText = sectionData.secondaryButtonText || sectionData.buttonTextSecondary || 'Learn More';
    const secondaryLink = sectionData.secondaryButtonLink || sectionData.buttonLinkSecondary || '';

    return (
        <section className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-primary-900 text-white">
            {sectionData.videoUrl ? (
                <video
                    className="absolute inset-0 h-full w-full object-cover"
                    src={sectionData.videoUrl}
                    poster={sectionData.posterUrl || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            ) : sectionData.posterUrl ? (
                <Image
                    className="object-cover"
                    src={sectionData.posterUrl}
                    alt={sectionData.title || 'Video hero'}
                    fill
                    unoptimized
                />
            ) : null}

            <div className="absolute inset-0 bg-black/45" />

            <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center">
                <div className="container-custom">
                    <div className="max-w-2xl">
                        <h2 className="font-serif text-5xl md:text-7xl font-bold mb-5">{sectionData.title}</h2>
                        {sectionData.description && (
                            <p className="text-lg md:text-xl text-white/90 mb-8">{sectionData.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {primaryLink && (
                                <Link href={primaryLink} className="btn bg-white text-primary-900 px-8 py-3 text-lg hover:bg-brand-brown hover:text-white border-none">
                                    {primaryText} <FiArrowRight className="inline ml-2" />
                                </Link>
                            )}
                            {secondaryLink && (
                                <Link href={secondaryLink} className="btn btn-secondary px-8 py-3 text-lg">
                                    {secondaryText}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export const TrustBadgesSection = ({ settings }) => {
    if (!settings.trustBadges?.length) return null;

    return (
        <ScrollReveal>
            <section className="section-padding bg-white">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {settings.trustBadges.map((badge) => {
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
