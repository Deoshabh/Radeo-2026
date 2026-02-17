'use client';

import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useMemo } from 'react';
import useEmbeddedPreviewBridge from '@/components/storefront/useEmbeddedPreviewBridge';
import useHomeSectionComposition from '@/components/storefront/useHomeSectionComposition';
import PopupBuilder from '@/components/storefront/PopupBuilder';
import useStorefrontRuntimeContext from '@/components/storefront/useStorefrontRuntimeContext';
import useActiveStorefrontSettings from '@/components/storefront/useActiveStorefrontSettings';
import SectionRenderWrapper from '@/components/storefront/SectionRenderWrapper';

export default function HomeSections({ initialSettings, initialProducts }) {
    const { settings: clientSettings, loading } = useSiteSettings();
    const activeSettings = useActiveStorefrontSettings({ loading, clientSettings, initialSettings });

    const runtimeContext = useStorefrontRuntimeContext();

    const {
        effectiveSettings,
        renderOrder,
        renderSection,
        getSectionData,
    } = useHomeSectionComposition({
        activeSettings,
        runtimeContext,
        builderLayout: [],
        initialProducts,
    });

    useEmbeddedPreviewBridge();

    const sectionRenderItems = useMemo(
        () => renderOrder.map((section) => ({
            section,
            effectiveSectionData: getSectionData(section),
        })),
        [getSectionData, renderOrder],
    );

    const popupConfig = useMemo(
        () => effectiveSettings?.theme?.popupBuilder || { enabled: false },
        [effectiveSettings?.theme?.popupBuilder],
    );

    return (
        <>
            {sectionRenderItems.map(({ section, effectiveSectionData }) => (
                <SectionRenderWrapper
                    key={section.id}
                    section={section}
                    effectiveSectionData={effectiveSectionData}
                    effectiveSettings={effectiveSettings}
                    runtimeContext={runtimeContext}
                    renderSection={renderSection}
                />
            ))}

            <PopupBuilder popupConfig={popupConfig} />
        </>
    );
}
