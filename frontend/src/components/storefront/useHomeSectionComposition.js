import { useMemo } from 'react';
import { evaluateVisibilityRules, resolveExperimentVariant } from '@/utils/visualBuilder';
import {
    deriveHomeSectionsFromLayout,
    getLayoutSectionData,
    normalizeLayoutSchema,
} from '@/utils/layoutSchema';
import {
    BrandsSection,
    CategoriesSection,
    FeaturedProductsSection,
    HeroSection,
    MadeToOrderSection,
    NewsletterSection,
    TextSection,
    TestimonialsSection,
    VideoHeroSection,
} from '@/components/storefront/HomeSectionComponents';

const mergeHeroSettings = (globalHeroSettings = {}, layoutHeroSettings = {}) => {
    const primaryButtonText =
        layoutHeroSettings.primaryButtonText ??
        layoutHeroSettings.buttonText ??
        globalHeroSettings.primaryButtonText ??
        globalHeroSettings.buttonText;
    const primaryButtonLink =
        layoutHeroSettings.primaryButtonLink ??
        layoutHeroSettings.buttonLink ??
        globalHeroSettings.primaryButtonLink ??
        globalHeroSettings.buttonLink;
    const secondaryButtonText =
        layoutHeroSettings.secondaryButtonText ??
        layoutHeroSettings.buttonTextSecondary ??
        globalHeroSettings.secondaryButtonText ??
        globalHeroSettings.buttonTextSecondary;
    const secondaryButtonLink =
        layoutHeroSettings.secondaryButtonLink ??
        layoutHeroSettings.buttonLinkSecondary ??
        globalHeroSettings.secondaryButtonLink ??
        globalHeroSettings.buttonLinkSecondary;

    return {
        ...globalHeroSettings,
        ...layoutHeroSettings,
        primaryButtonText,
        primaryButtonLink,
        secondaryButtonText,
        secondaryButtonLink,
        buttonText: layoutHeroSettings.buttonText ?? primaryButtonText,
        buttonLink: layoutHeroSettings.buttonLink ?? primaryButtonLink,
        buttonTextSecondary: layoutHeroSettings.buttonTextSecondary ?? secondaryButtonText,
        buttonLinkSecondary: layoutHeroSettings.buttonLinkSecondary ?? secondaryButtonLink,
    };
};

const mergeSectionSettings = (globalSectionSettings = {}, layoutSectionSettings = {}) => ({
    ...globalSectionSettings,
    ...layoutSectionSettings,
});

const isSectionEnabled = (section = {}) => {
    if (typeof section?.enabled === 'boolean') return section.enabled;

    const data = getLayoutSectionData(section);
    if (typeof data?.enabled === 'boolean') return data.enabled;

    return true;
};

const withExperimentData = (section = {}, runtime = {}) => {
    const baseData = getLayoutSectionData(section);
    const variant = resolveExperimentVariant(baseData.experiments, `${runtime.seed}:${section.id}:${runtime.pathname}`);
    if (!variant?.data) return baseData;
    return {
        ...baseData,
        ...variant.data,
    };
};

export default function useHomeSectionComposition({
    activeSettings,
    runtimeContext,
    builderLayout,
    initialProducts,
}) {
    const effectiveBanners =
        effectiveSettings?.banners ||
        effectiveSettings?.bannerSystem?.banners ||
        [];

    const effectiveSettings = useMemo(() => {
        if (!runtimeContext.isStorefrontBuilder) return activeSettings;
        if (!Array.isArray(builderLayout) || builderLayout.length === 0) return activeSettings;

        const normalizedLayout = normalizeLayoutSchema(builderLayout);
        const derivedHomeSections = deriveHomeSectionsFromLayout(
            normalizedLayout,
            activeSettings.homeSections || {},
        );

        return {
            ...activeSettings,
            layout: normalizedLayout,
            homeSections: derivedHomeSections,
        };
    }, [runtimeContext.isStorefrontBuilder, builderLayout, activeSettings]);

    const renderOrder = useMemo(() => {
        if (effectiveSettings.layout && effectiveSettings.layout.length > 0) {
            return effectiveSettings.layout.filter((item) => {
                if (!isSectionEnabled(item)) return false;
                const effectiveData = withExperimentData(item, runtimeContext);
                return evaluateVisibilityRules(effectiveData.visibilityRules, runtimeContext);
            });
        }

        const fallback = [];
        if (effectiveSettings.homeSections?.heroSection?.enabled) fallback.push({ id: 'hero', type: 'hero' });
        if (effectiveSettings.homeSections?.videoHero?.enabled) fallback.push({ id: 'video-hero', type: 'videoHero' });
        if (effectiveSettings.homeSections?.categories?.enabled) fallback.push({ id: 'categories', type: 'categories' });
        if (effectiveSettings.homeSections?.featuredProducts?.enabled) fallback.push({ id: 'products', type: 'products' });
        if (effectiveSettings.homeSections?.brands?.enabled) fallback.push({ id: 'brands', type: 'brands' });
        if (effectiveSettings.homeSections?.testimonials?.enabled) fallback.push({ id: 'testimonials', type: 'testimonials' });
        if (effectiveSettings.homeSections?.madeToOrder?.enabled) fallback.push({ id: 'madeToOrder', type: 'madeToOrder' });
        if (effectiveSettings.homeSections?.newsletter?.enabled) fallback.push({ id: 'newsletter', type: 'newsletter' });
        return fallback;
    }, [effectiveSettings, runtimeContext]);

    const renderSection = (section) => {
        const sectionData = withExperimentData(section, runtimeContext);

        switch (section.type) {
            case 'hero': {
                const heroSettings = mergeHeroSettings(
                    effectiveSettings.homeSections?.heroSection || {},
                    sectionData || {},
                );
                return <HeroSection key={section.id} banners={effectiveBanners} heroSettings={heroSettings} />;
            }
            case 'products': {
                const productsSettings = mergeSectionSettings(
                    effectiveSettings.homeSections?.featuredProducts || {},
                    sectionData || {},
                );
                return <FeaturedProductsSection key={section.id} sectionData={productsSettings} products={initialProducts} />;
            }
            case 'videoHero': {
                const videoHeroSettings = mergeSectionSettings(
                    effectiveSettings.homeSections?.videoHero || {},
                    sectionData || {},
                );
                return <VideoHeroSection key={section.id} sectionData={videoHeroSettings} />;
            }
            case 'categories': {
                const categoriesSettings = mergeSectionSettings(
                    effectiveSettings.homeSections?.categories || {},
                    sectionData || {},
                );
                return <CategoriesSection key={section.id} sectionData={categoriesSettings} />;
            }
            case 'brands': {
                const brandsSettings = mergeSectionSettings(
                    effectiveSettings.homeSections?.brands || {},
                    sectionData || {},
                );
                return <BrandsSection key={section.id} sectionData={brandsSettings} />;
            }
            case 'testimonials': {
                const testimonialsSettings = mergeSectionSettings(
                    effectiveSettings.homeSections?.testimonials || {},
                    sectionData || {},
                );
                return <TestimonialsSection key={section.id} sectionData={testimonialsSettings} />;
            }
            case 'madeToOrder': {
                const madeToOrderSettings = mergeSectionSettings(
                    effectiveSettings.homeSections?.madeToOrder || {},
                    sectionData || {},
                );
                return <MadeToOrderSection key={section.id} sectionData={madeToOrderSettings} />;
            }
            case 'newsletter': {
                const newsletterSettings = mergeSectionSettings(
                    effectiveSettings.homeSections?.newsletter || {},
                    sectionData || {},
                );
                return <NewsletterSection key={section.id} sectionData={newsletterSettings} />;
            }
            case 'text':
                return <TextSection key={section.id} sectionData={sectionData || {}} />;
            default:
                return null;
        }
    };

    const getSectionData = (section) => withExperimentData(section, runtimeContext);

    return {
        effectiveSettings,
        renderOrder,
        renderSection,
        getSectionData,
    };
}
