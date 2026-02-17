'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import AdminLayout from '@/components/AdminLayout';
import SortableSection from '@/components/admin/cms/SortableSection';
import EditSectionPanel from '@/components/admin/cms/EditSectionPanel';
import ThemeCustomizer from '@/components/admin/cms/ThemeCustomizer'; // NEW
import { SECTION_TEMPLATES } from '@/constants/section-registry';
import { FiLayout, FiPlus, FiSave, FiMonitor, FiSmartphone, FiX, FiDroplet, FiUpload, FiDownload, FiRotateCcw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Initial placeholder data (will be replaced by API data)
const initialLayout = [
    { id: '1', type: 'hero', enabled: true, data: {} },
    { id: '2', type: 'products', enabled: true, data: {} },
    { id: '3', type: 'madeToOrder', enabled: true, data: {} },
    { id: '4', type: 'newsletter', enabled: true, data: {} },
];

import { adminAPI } from '@/utils/api';
import { SITE_SETTINGS_DEFAULTS } from '@/constants/siteSettingsDefaults';
import { CURRENT_LAYOUT_SCHEMA_VERSION, normalizeSettingsLayout } from '@/utils/layoutSchema';

// ... imports

const normalizeHeroDataForEditor = (heroData = {}) => ({
    ...heroData,
    title: heroData.title || '',
    subtitle: heroData.subtitle || '',
    buttonText:
        heroData.buttonText ?? heroData.primaryButtonText ?? SITE_SETTINGS_DEFAULTS.homeSections?.heroSection?.primaryButtonText ?? 'Shop Now',
    buttonLink:
        heroData.buttonLink ?? heroData.primaryButtonLink ?? SITE_SETTINGS_DEFAULTS.homeSections?.heroSection?.primaryButtonLink ?? '/products',
    secondaryButtonText:
        heroData.secondaryButtonText ?? heroData.buttonTextSecondary ?? SITE_SETTINGS_DEFAULTS.homeSections?.heroSection?.secondaryButtonText ?? 'Learn More',
    secondaryButtonLink:
        heroData.secondaryButtonLink ?? heroData.buttonLinkSecondary ?? SITE_SETTINGS_DEFAULTS.homeSections?.heroSection?.secondaryButtonLink ?? '/about',
    buttonTextSecondary:
        heroData.buttonTextSecondary ?? heroData.secondaryButtonText ?? SITE_SETTINGS_DEFAULTS.homeSections?.heroSection?.secondaryButtonText ?? 'Learn More',
    buttonLinkSecondary:
        heroData.buttonLinkSecondary ?? heroData.secondaryButtonLink ?? SITE_SETTINGS_DEFAULTS.homeSections?.heroSection?.secondaryButtonLink ?? '/about',
    imageUrl: heroData.imageUrl || heroData.image || '',
    alignment: heroData.alignment || 'center',
});

const normalizeHeroDataForStorefront = (heroData = {}) => {
    const defaults = SITE_SETTINGS_DEFAULTS.homeSections?.heroSection || {};
    const primaryButtonText = heroData.primaryButtonText ?? heroData.buttonText ?? defaults.primaryButtonText;
    const primaryButtonLink = heroData.primaryButtonLink ?? heroData.buttonLink ?? defaults.primaryButtonLink;
    const secondaryButtonText =
        heroData.secondaryButtonText ?? heroData.buttonTextSecondary ?? defaults.secondaryButtonText;
    const secondaryButtonLink =
        heroData.secondaryButtonLink ?? heroData.buttonLinkSecondary ?? defaults.secondaryButtonLink;

    return {
        ...defaults,
        ...heroData,
        primaryButtonText,
        primaryButtonLink,
        secondaryButtonText,
        secondaryButtonLink,
        buttonText: heroData.buttonText ?? primaryButtonText,
        buttonLink: heroData.buttonLink ?? primaryButtonLink,
        buttonTextSecondary: heroData.buttonTextSecondary ?? secondaryButtonText,
        buttonLinkSecondary: heroData.buttonLinkSecondary ?? secondaryButtonLink,
    };
};

const normalizeProductsDataForEditor = (productsData = {}) => {
    const defaults = SITE_SETTINGS_DEFAULTS.homeSections?.featuredProducts || {};
    return {
        ...defaults,
        ...productsData,
        productLimit: Number(productsData.productLimit ?? productsData.count ?? defaults.productLimit ?? 8),
    };
};

const normalizeProductsDataForStorefront = (productsData = {}) => {
    const defaults = SITE_SETTINGS_DEFAULTS.homeSections?.featuredProducts || {};
    return {
        ...defaults,
        ...productsData,
        productLimit: Number(productsData.productLimit ?? productsData.count ?? defaults.productLimit ?? 8),
    };
};

const normalizeFeaturesForStorefront = (features) => {
    if (Array.isArray(features)) return features.filter(Boolean);
    if (typeof features === 'string') {
        return features
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

const normalizeMadeToOrderDataForEditor = (madeToOrderData = {}) => {
    const defaults = SITE_SETTINGS_DEFAULTS.homeSections?.madeToOrder || {};
    const normalizedFeatures = normalizeFeaturesForStorefront(
        madeToOrderData.features ?? defaults.features
    );

    return {
        ...defaults,
        ...madeToOrderData,
        features: normalizedFeatures.join('\n'),
    };
};

const normalizeMadeToOrderDataForStorefront = (madeToOrderData = {}) => {
    const defaults = SITE_SETTINGS_DEFAULTS.homeSections?.madeToOrder || {};
    return {
        ...defaults,
        ...madeToOrderData,
        features: normalizeFeaturesForStorefront(madeToOrderData.features ?? defaults.features),
    };
};

const normalizeNewsletterDataForEditor = (newsletterData = {}) => {
    const defaults = SITE_SETTINGS_DEFAULTS.homeSections?.newsletter || {};
    return {
        ...defaults,
        ...newsletterData,
    };
};

const normalizeNewsletterDataForStorefront = (newsletterData = {}) => {
    const defaults = SITE_SETTINGS_DEFAULTS.homeSections?.newsletter || {};
    return {
        ...defaults,
        ...newsletterData,
    };
};

const withAdvancedSectionDefaults = (sectionData = {}) => ({
    ...sectionData,
    customCss: sectionData.customCss ?? '',
    globalClassStyles: sectionData.globalClassStyles ?? {},
    visibilityRules: sectionData.visibilityRules ?? {},
    experiments: sectionData.experiments ?? { enabled: false, variants: [] },
    blocks: sectionData.blocks ?? [],
});

const normalizeSectionDataForEditor = (type, data = {}) => {
    if (type === 'hero') return withAdvancedSectionDefaults(normalizeHeroDataForEditor(data));
    if (type === 'products') return withAdvancedSectionDefaults(normalizeProductsDataForEditor(data));
    if (type === 'madeToOrder') return withAdvancedSectionDefaults(normalizeMadeToOrderDataForEditor(data));
    if (type === 'newsletter') return withAdvancedSectionDefaults(normalizeNewsletterDataForEditor(data));
    return withAdvancedSectionDefaults(data);
};

const normalizeSectionForEditor = (section = {}) => ({
    ...section,
    data: normalizeSectionDataForEditor(section.type, section.data || {}),
});

const normalizeLayoutForEditor = (sections = []) => sections.map(normalizeSectionForEditor);

export default function VisualEditorPage() {
    const [activeView, setActiveView] = useState('desktop');
    const [layout, setLayout] = useState([]); // Ordered list of sections
    const [theme, setTheme] = useState({}); // Stores global styles, fonts, and now section-specific theme overrides (header, footer, etc.)
    const [branding, setBranding] = useState(SITE_SETTINGS_DEFAULTS.branding || {});
    const [announcementBar, setAnnouncementBar] = useState({});
    const [banners, setBanners] = useState([]);
    const [homeSections, setHomeSections] = useState({}); // Legacy - maps to layout but keeps data structure
    const [activeTab, setActiveTab] = useState('layout');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [versionHistory, setVersionHistory] = useState([]);
    const [isRestoring, setIsRestoring] = useState(false);
    const [publishStatus, setPublishStatus] = useState('draft');
    const [scheduledPublishAt, setScheduledPublishAt] = useState('');
    const [publishedAt, setPublishedAt] = useState('');
    const [liveSnapshot, setLiveSnapshot] = useState(null);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [showPublishTools, setShowPublishTools] = useState(false);
    const [showOperationsDrawer, setShowOperationsDrawer] = useState(false);
    const [compareModal, setCompareModal] = useState({
        open: false,
        label: '',
        rows: [],
    });
    const previewTimerRef = useRef(null);
    const previewPayloadRef = useRef({});

    const postPreviewUpdate = (payload) => {
        previewPayloadRef.current = {
            ...(previewPayloadRef.current || {}),
            ...(payload || {}),
        };

        if (previewTimerRef.current) {
            clearTimeout(previewTimerRef.current);
        }

        previewTimerRef.current = setTimeout(() => {
            const iframe = document.querySelector('iframe');
            if (!iframe || !iframe.contentWindow) return;

            iframe.contentWindow.postMessage(
                {
                    type: 'THEME_UPDATE',
                    payload: previewPayloadRef.current,
                },
                '*',
            );

            previewPayloadRef.current = {};
            previewTimerRef.current = null;
        }, 180);
    };

    // Derived state
    const editingSection = layout.find(s => s.id === editingSectionId) || null;

    useEffect(() => () => {
        if (previewTimerRef.current) {
            clearTimeout(previewTimerRef.current);
        }
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await adminAPI.getAllSettings();
                const settings = normalizeSettingsLayout(response.data.settings || {});

                // Map settings to layout format
                let currentLayout = [];

                if (settings.layout && settings.layout.length > 0) {
                    currentLayout = normalizeLayoutForEditor(settings.layout);
                } else if (settings.homeSections) {
                    // Fallback to legacy homeSections
                    const sections = settings.homeSections;
                    if (sections.heroSection) {
                        currentLayout.push({
                            id: 'hero',
                            type: 'hero',
                            enabled: sections.heroSection.enabled,
                            data: normalizeHeroDataForEditor(sections.heroSection),
                        });
                    }
                    if (sections.featuredProducts) {
                        currentLayout.push({
                            id: 'products',
                            type: 'products',
                            enabled: sections.featuredProducts.enabled,
                            data: normalizeProductsDataForEditor(sections.featuredProducts),
                        });
                    }
                    if (sections.madeToOrder) {
                        currentLayout.push({
                            id: 'madeToOrder',
                            type: 'madeToOrder',
                            enabled: sections.madeToOrder.enabled,
                            data: normalizeMadeToOrderDataForEditor(sections.madeToOrder),
                        });
                    }
                    if (sections.newsletter) {
                        currentLayout.push({
                            id: 'newsletter',
                            type: 'newsletter',
                            enabled: sections.newsletter.enabled,
                            data: normalizeNewsletterDataForEditor(sections.newsletter),
                        });
                    }
                }

                setLayout(currentLayout.length > 0 ? currentLayout : initialLayout);
                setTheme(settings.theme || SITE_SETTINGS_DEFAULTS.theme);
                setBranding(settings.branding || SITE_SETTINGS_DEFAULTS.branding || {});
                setAnnouncementBar(settings.announcementBar || {});
                setBanners(settings.banners || settings.bannerSystem?.banners || []);
                setPublishStatus(settings.publishWorkflow?.status || 'draft');
                setScheduledPublishAt(settings.publishWorkflow?.scheduledAt || '');
                setPublishedAt(settings.publishWorkflow?.publishedAt || '');
                setLiveSnapshot(settings.publishedSnapshot || null);

                const historyResponse = await adminAPI.getThemeVersionHistory();
                setVersionHistory(historyResponse.data?.history || []);
            } catch (error) {
                console.error("Failed to load settings:", error);
                toast.error("Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const handlePreviewSectionClick = (event) => {
            if (event.data?.type !== 'SECTION_CLICKED') return;
            const sectionId = event.data?.payload?.id;
            const sectionType = event.data?.payload?.sectionType;
            if (!sectionId && !sectionType) return;

            const sectionToEdit = sectionId
                ? layout.find((item) => item.id === sectionId)
                : layout.find((item) => item.type === sectionType);
            if (sectionToEdit) {
                setEditingSectionId(sectionToEdit.id);
                setIsAddingSection(false);
                setActiveTab('layout');
                toast.success(`Editing ${sectionToEdit.type} section`);
            }
        };

        window.addEventListener('message', handlePreviewSectionClick);
        return () => window.removeEventListener('message', handlePreviewSectionClick);
    }, [layout]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        if (active.id !== over.id) {
            setLayout((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newLayout = arrayMove(items, oldIndex, newIndex);

                // Sync to preview
                postPreviewUpdate({ layout: newLayout });

                return newLayout;
            });
        }
    };

    const handleSave = async ({ publishMode = 'draft' } = {}) => {
        setIsSaving(true);
        try {
            const homeSections = {};
            layout.forEach(section => {
                if (section.type === 'hero') homeSections.heroSection = normalizeHeroDataForStorefront({ ...section.data, enabled: section.enabled });
                if (section.type === 'products') homeSections.featuredProducts = normalizeProductsDataForStorefront({ ...section.data, enabled: section.enabled });
                if (section.type === 'madeToOrder') homeSections.madeToOrder = normalizeMadeToOrderDataForStorefront({ ...section.data, enabled: section.enabled });
                if (section.type === 'newsletter') homeSections.newsletter = normalizeNewsletterDataForStorefront({ ...section.data, enabled: section.enabled });
            });

            const updateData = {
                homeSections,
                layout,
                layoutSchemaVersion: CURRENT_LAYOUT_SCHEMA_VERSION,
                theme,
                branding,
                announcementBar,
                publishWorkflow: {
                    status: publishMode === 'live' ? 'live' : publishMode === 'scheduled' ? 'scheduled' : 'draft',
                    scheduledAt: publishMode === 'scheduled' ? scheduledPublishAt : '',
                    publishedAt: publishMode === 'live' ? new Date().toISOString() : undefined,
                    updatedAt: new Date().toISOString(),
                },
            };

            await adminAPI.updateSettings(updateData);
            const latestSettings = await adminAPI.getAllSettings();
            const savedSettings = latestSettings?.data?.settings || {};
            setPublishStatus(savedSettings.publishWorkflow?.status || updateData.publishWorkflow.status);
            setScheduledPublishAt(savedSettings.publishWorkflow?.scheduledAt || '');
            setPublishedAt(savedSettings.publishWorkflow?.publishedAt || '');
            setLiveSnapshot(savedSettings.publishedSnapshot || liveSnapshot);

            const historyResponse = await adminAPI.getThemeVersionHistory();
            setVersionHistory(historyResponse.data?.history || []);
            if (publishMode === 'live') {
                toast.success('Published to live successfully');
            } else if (publishMode === 'scheduled') {
                toast.success('Publish schedule saved');
            } else {
                toast.success('Draft saved successfully');
            }
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublishNow = async () => {
        await handleSave({ publishMode: 'live' });
    };

    const handleSchedulePublish = async () => {
        if (!scheduledPublishAt) {
            toast.error('Choose a publish date/time first');
            return;
        }

        await handleSave({ publishMode: 'scheduled' });
    };

    const handleRunPublishCheck = async () => {
        try {
            const response = await adminAPI.runPublishWorkflowNow();
            const workflow = response?.data?.publishWorkflow || {};

            if (workflow.status) {
                setPublishStatus(workflow.status);
            }
            setScheduledPublishAt(workflow.scheduledAt || '');
            setPublishedAt(workflow.publishedAt || '');

            const latestSettings = await adminAPI.getAllSettings();
            setLiveSnapshot(latestSettings?.data?.settings?.publishedSnapshot || liveSnapshot);

            if (response?.data?.result?.promoted) {
                toast.success('Scheduled publish promoted to live');
            } else {
                toast.success('Publish check completed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to run publish check');
        }
    };

    const handleResetToDefaults = async () => {
        const confirmed = window.confirm(
            'Reset all frontend settings to default and publish live now? This will overwrite your current theme and layout settings.',
        );
        if (!confirmed) return;

        const typedConfirmation = window.prompt('Type RESET to confirm full storefront reset:');
        if (typedConfirmation !== 'RESET') {
            toast.error('Reset cancelled. Confirmation text did not match.');
            return;
        }

        try {
            setIsSaving(true);
            const response = await adminAPI.resetFrontendDefaults();
            const settings = response?.data?.settings || {};
            const normalizedLayout = normalizeLayoutForEditor(settings.layout || []);

            setLayout(normalizedLayout);
            setTheme(settings.theme || SITE_SETTINGS_DEFAULTS.theme);
            setBranding(settings.branding || SITE_SETTINGS_DEFAULTS.branding || {});
            setAnnouncementBar(settings.announcementBar || SITE_SETTINGS_DEFAULTS.announcementBar || {});
            setBanners(settings.banners || settings.bannerSystem?.banners || []);
            setPublishStatus(settings.publishWorkflow?.status || 'live');
            setScheduledPublishAt(settings.publishWorkflow?.scheduledAt || '');
            setPublishedAt(settings.publishWorkflow?.publishedAt || '');
            setLiveSnapshot(settings.publishedSnapshot || null);

            postPreviewUpdate({
                layout: normalizedLayout,
                theme: settings.theme || SITE_SETTINGS_DEFAULTS.theme,
                branding: settings.branding || SITE_SETTINGS_DEFAULTS.branding || {},
                announcementBar: settings.announcementBar || SITE_SETTINGS_DEFAULTS.announcementBar || {},
            });

            toast.success('Frontend reset to defaults');
        } catch (error) {
            console.error(error);
            toast.error('Failed to reset defaults');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportTheme = async () => {
        try {
            const response = await adminAPI.exportThemeJson();
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `theme-export-${new Date().toISOString().slice(0, 10)}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
            toast.success('Theme exported');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export theme');
        }
    };

    const handleImportTheme = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const json = JSON.parse(text);
            const response = await adminAPI.importThemeJson(json);
            const settings = normalizeSettingsLayout(response.data?.settings || {});

            if (settings) {
                const normalizedLayout = normalizeLayoutForEditor(settings.layout || layout);
                setLayout(normalizedLayout);
                setTheme(settings.theme || theme);
                setBranding(settings.branding || branding);
                setAnnouncementBar(settings.announcementBar || announcementBar);
                setBanners(settings.banners || settings.bannerSystem?.banners || banners);

                postPreviewUpdate({
                    layout: normalizedLayout,
                    theme: settings.theme || theme,
                    branding: settings.branding || branding,
                    announcementBar: settings.announcementBar || announcementBar,
                });
            }

            const historyResponse = await adminAPI.getThemeVersionHistory();
            setVersionHistory(historyResponse.data?.history || []);
            toast.success('Theme imported successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to import theme JSON');
        } finally {
            event.target.value = '';
        }
    };

    const handleRestoreVersion = async (historyId) => {
        try {
            setIsRestoring(true);
            const response = await adminAPI.restoreThemeVersion(historyId);
            const settings = normalizeSettingsLayout(response.data?.settings || {});

            if (settings) {
                const normalizedLayout = normalizeLayoutForEditor(settings.layout || []);
                setLayout(normalizedLayout);
                setTheme(settings.theme || {});
                setBranding(settings.branding || {});
                setAnnouncementBar(settings.announcementBar || {});
                setBanners(settings.banners || settings.bannerSystem?.banners || []);

                postPreviewUpdate({
                    layout: normalizedLayout,
                    theme: settings.theme || {},
                    branding: settings.branding || {},
                    announcementBar: settings.announcementBar || {},
                });
            }

            const historyResponse = await adminAPI.getThemeVersionHistory();
            setVersionHistory(historyResponse.data?.history || []);
            toast.success('Version restored');
        } catch (error) {
            console.error(error);
            toast.error('Failed to restore version');
        } finally {
            setIsRestoring(false);
        }
    };

    const handleCompareVersion = (historyItem) => {
        const snapshotLayout = Array.isArray(historyItem?.snapshot?.layout)
            ? historyItem.snapshot.layout
            : [];

        if (!snapshotLayout.length) {
            toast('No snapshot layout to compare');
            return;
        }

        const currentById = new Map(layout.map((section) => [section.id, section]));
        const snapshotById = new Map(snapshotLayout.map((section) => [section.id, section]));
        const allIds = Array.from(new Set([
            ...Array.from(currentById.keys()),
            ...Array.from(snapshotById.keys()),
        ]));

        const rows = allIds.map((sectionId) => {
            const currentSection = currentById.get(sectionId);
            const snapshotSection = snapshotById.get(sectionId);

            if (!currentSection) {
                return {
                    sectionId,
                    sectionType: snapshotSection?.type || 'unknown',
                    status: 'removed-in-draft',
                    changedKeys: Object.keys(snapshotSection?.data || {}),
                    currentEnabled: false,
                    snapshotEnabled: Boolean(snapshotSection?.enabled),
                };
            }

            if (!snapshotSection) {
                return {
                    sectionId,
                    sectionType: currentSection?.type || 'unknown',
                    status: 'new-in-draft',
                    changedKeys: Object.keys(currentSection?.data || {}),
                    currentEnabled: Boolean(currentSection?.enabled),
                    snapshotEnabled: false,
                };
            }

            const currentData = currentSection?.data || {};
            const snapshotData = snapshotSection?.data || {};
            const keys = Array.from(new Set([
                ...Object.keys(currentData),
                ...Object.keys(snapshotData),
            ]));
            const changedKeys = keys.filter((key) =>
                JSON.stringify(currentData[key]) !== JSON.stringify(snapshotData[key]),
            );

            const enabledChanged = Boolean(currentSection?.enabled) !== Boolean(snapshotSection?.enabled);
            const isChanged = enabledChanged || changedKeys.length > 0;

            return {
                sectionId,
                sectionType: currentSection?.type || snapshotSection?.type || 'unknown',
                status: isChanged ? 'changed' : 'same',
                changedKeys,
                currentEnabled: Boolean(currentSection?.enabled),
                snapshotEnabled: Boolean(snapshotSection?.enabled),
            };
        });

        setCompareModal({
            open: true,
            label: historyItem?.label || 'snapshot',
            rows,
        });
    };

    // ... rest of the handlers (handleDelete, etc. - ensure they update 'layout' state)
    const handleDelete = (id) => {
        // visual delete only, effectively disables it until saved? 
        // Or strictly removes from the list.
        setLayout(items => {
            const newLayout = items.filter(item => item.id !== id);
            postPreviewUpdate({ layout: newLayout });
            return newLayout;
        });
        toast.success('Section removed (Save to apply)');
    };

    const handleToggle = (id) => {
        setLayout(items => {
            const newLayout = items.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item);
            postPreviewUpdate({ layout: newLayout });
            return newLayout;
        });
    };

    const handleEdit = (section) => {
        setEditingSectionId(section.id);
        setIsAddingSection(false);
    };

    const handleUpdateSection = (id, newData) => {
        setLayout(items => {
            const newLayout = items.map(item => {
                if (item.id !== id) return item;
                return {
                    ...item,
                    data: normalizeSectionDataForEditor(item.type, newData),
                };
            });

            // Sync to preview
            postPreviewUpdate({ layout: newLayout });

            return newLayout;
        });
        setEditingSectionId(null);
        toast.success('Section updated');
    };

    const handleAddSection = (template) => {
        // ... similar logic, but we need to ensure we don't duplicate unique sections
        // if the backend structure enforces singletons (like 'hero').

        const uniqueTypes = new Set(['hero', 'products', 'madeToOrder', 'newsletter']);
        if (uniqueTypes.has(template.type) && layout.some((section) => section.type === template.type)) {
            toast.error(`${template.label} already exists`);
            return;
        }

        const newSection = {
            id: `section-${Date.now()}`, // Temporary ID
            type: template.type,
            enabled: true,
            data: normalizeSectionDataForEditor(template.type, { ...template.defaultData })
        };

        setLayout(prev => {
            const newLayout = [...prev, newSection];
            postPreviewUpdate({ layout: newLayout });
            return newLayout;
        });
        setIsAddingSection(false);
        setEditingSectionId(newSection.id);
        toast.success(`Added ${template.label}`);
    };

    const hasActiveBanners = (banners || []).some(
        (banner) => banner?.isActive === true || banner?.enabled === true,
    );
    const publishedAtLabel = useMemo(() => {
        if (!publishedAt) return 'Never published';
        const publishedDate = new Date(publishedAt);
        if (Number.isNaN(publishedDate.getTime())) return 'Never published';
        return publishedDate.toLocaleString();
    }, [publishedAt]);

    const scheduleCountdownLabel = useMemo(() => {
        if (publishStatus !== 'scheduled' || !scheduledPublishAt) return '';
        const scheduleDate = new Date(scheduledPublishAt);
        if (Number.isNaN(scheduleDate.getTime())) return '';

        const diffMs = scheduleDate.getTime() - Date.now();
        if (diffMs <= 0) return 'Scheduled time reached. Run Publish Check.';

        const totalMinutes = Math.ceil(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return hours > 0 ? `Publishes in ${hours}h ${minutes}m` : `Publishes in ${minutes}m`;
    }, [publishStatus, scheduledPublishAt]);

    const liveVsDraftSummary = useMemo(() => {
        const liveLayout = Array.isArray(liveSnapshot?.layout) ? liveSnapshot.layout : [];
        if (!liveLayout.length) {
            return { changedSections: layout.length, changedFields: 0 };
        }

        const liveById = new Map(liveLayout.map((section) => [section.id, section]));
        let changedSections = 0;
        let changedFields = 0;

        layout.forEach((section) => {
            const liveSection = liveById.get(section.id);
            if (!liveSection) {
                changedSections += 1;
                changedFields += Object.keys(section.data || {}).length;
                return;
            }

            const currentData = JSON.stringify(section.data || {});
            const liveData = JSON.stringify(liveSection.data || {});
            const enabledChanged = Boolean(section.enabled) !== Boolean(liveSection.enabled);

            if (enabledChanged || currentData !== liveData) {
                changedSections += 1;
                changedFields += Math.max(
                    Object.keys(section.data || {}).length,
                    Object.keys(liveSection.data || {}).length,
                );
            }
        });

        return { changedSections, changedFields };
    }, [layout, liveSnapshot]);

    return (
        <AdminLayout>
            <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-100">

                {/* Left Sidebar: Components & Settings */}
                <aside className="w-80 bg-white border-r border-gray-200 flex flex-col z-20 shadow-lg">
                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('layout')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'layout' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FiLayout /> Layout
                        </button>
                        <button
                            onClick={() => setActiveTab('theme')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'theme' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FiDroplet /> Theme
                        </button>
                    </div>

                    {/* Layout Header */}
                    {activeTab === 'layout' && (
                        <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-gray-800 text-sm">Homepage Sections</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Drag to reorder</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsAddingSection(true);
                                    setEditingSectionId(null);
                                }}
                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                title="Add Section"
                            >
                                <FiPlus />
                            </button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto relative">
                        {hasActiveBanners && (
                            <div className="m-4 mb-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                Active banners currently override Hero section content on the homepage. Update banners in CMS if you want hero text changes to appear.
                            </div>
                        )}

                        {/* THEME TAB CONTENT */}
                        {activeTab === 'theme' && (
                            <ThemeCustomizer
                                theme={theme}
                                branding={branding}
                                hasActiveBanners={hasActiveBanners}
                                // Pass current section data to allow editing content from Theme tab
                                sections={{
                                    hero: layout.find(s => s.type === 'hero')?.data || {},
                                    products: layout.find(s => s.type === 'products')?.data || {},
                                    footer: layout.find(s => s.type === 'footer')?.data || {}, // Assuming footer has data
                                    newsletter: layout.find(s => s.type === 'newsletter')?.data || {},
                                }}
                                onUpdateSection={(type, partialData) => {
                                    setLayout(items => {
                                        const newLayout = items.map(item => {
                                            if (item.type === type) {
                                                return { ...item, data: { ...item.data, ...partialData } };
                                            }
                                            return item;
                                        });

                                        // Sync to preview
                                        postPreviewUpdate({ layout: newLayout });

                                        return newLayout;
                                    });
                                }}
                                onChange={(newTheme) => {
                                    setTheme(newTheme);
                                    // Send update to preview
                                    postPreviewUpdate({ theme: newTheme });
                                }}
                                onBrandingChange={(newBranding) => {
                                    setBranding(newBranding);
                                    postPreviewUpdate({ branding: newBranding });
                                }}
                                announcementBar={announcementBar}
                                onAnnouncementChange={(newBar) => {
                                    setAnnouncementBar(newBar);
                                    postPreviewUpdate({ announcementBar: newBar });
                                }}
                            />
                        )}

                        {/* LAYOUT TAB CONTENT */}
                        {activeTab === 'layout' && (
                            <div className="p-4 space-y-3">
                                {/* Editor Panels Overlay */}
                                {editingSection && (
                                    <EditSectionPanel
                                        section={editingSection}
                                        hasActiveBanners={hasActiveBanners}
                                        onSave={handleUpdateSection}
                                        onCancel={() => setEditingSectionId(null)}
                                    />
                                )}

                                {/* Add Section Panel Overlay */}
                                {isAddingSection && (
                                    <div className="absolute inset-0 bg-white z-50 flex flex-col h-full animate-slide-in-right">
                                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                            <h3 className="font-bold text-gray-800">Add Section</h3>
                                            <button onClick={() => setIsAddingSection(false)} className="text-gray-500 hover:text-gray-700">
                                                <FiX size={20} />
                                            </button>
                                        </div>
                                        <div className="p-4 grid gap-3">
                                            {SECTION_TEMPLATES.map(template => (
                                                <button
                                                    key={template.type}
                                                    onClick={() => handleAddSection(template)}
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                                                >
                                                    <div className="p-2 bg-gray-100 rounded-md text-gray-600 group-hover:text-blue-600 group-hover:bg-white">
                                                        {template.icon}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{template.label}</p>
                                                        <p className="text-xs text-gray-500">Click to add</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={layout.map(i => i.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-3">
                                            {layout.map((section) => (
                                                <SortableSection
                                                    key={section.id}
                                                    id={section.id}
                                                    section={section}
                                                    onDelete={handleDelete}
                                                    onToggle={handleToggle}
                                                    onEdit={handleEdit}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button
                                onClick={handleExportTheme}
                                className="btn btn-secondary flex items-center justify-center gap-2"
                            >
                                <FiDownload /> Export
                            </button>
                            <label className="btn btn-secondary flex items-center justify-center gap-2 cursor-pointer">
                                <FiUpload /> Import
                                <input
                                    type="file"
                                    accept="application/json"
                                    className="hidden"
                                    onChange={handleImportTheme}
                                />
                            </label>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowOperationsDrawer(true)}
                            className="btn btn-secondary w-full mb-3 text-xs"
                        >
                            Open History & Publish Tools
                        </button>

                        <button
                            onClick={() => handleSave({ publishMode: 'live' })}
                            disabled={isSaving}
                            className="btn btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            ) : (
                                <FiSave />
                            )}
                            {isSaving ? 'Saving...' : 'Save & Publish'}
                        </button>

                        {publishStatus !== 'live' && (
                            <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                                Public website is currently showing the last live version. Use Publish Now or scheduled publish to make these edits visible.
                            </div>
                        )}

                        <div className="mt-2 rounded border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-600">
                            Live vs Draft: {liveVsDraftSummary.changedSections} section(s) changed, {liveVsDraftSummary.changedFields} field group(s) updated.
                        </div>

                        <button
                            onClick={handleResetToDefaults}
                            disabled={isSaving}
                            className="btn btn-secondary w-full mt-2 text-xs"
                        >
                            Reset to Default Frontend
                        </button>
                    </div>
                </aside>

                {showOperationsDrawer && (
                    <div className="fixed inset-0 z-[110] bg-black/35 flex justify-end">
                        <div className="w-[360px] h-full bg-white border-l border-gray-200 p-4 overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-800">History & Publish</h3>
                                <button type="button" onClick={() => setShowOperationsDrawer(false)} className="text-gray-500 hover:text-gray-700">
                                    <FiX size={18} />
                                </button>
                            </div>

                            <div className="mb-3 border border-gray-200 rounded bg-white">
                                <button
                                    type="button"
                                    onClick={() => setShowVersionHistory((prev) => !prev)}
                                    className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
                                >
                                    Version History
                                    {showVersionHistory ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                </button>
                                {showVersionHistory && (
                                    <div className="max-h-48 overflow-y-auto px-3 pb-2">
                                        {versionHistory.length === 0 && (
                                            <p className="text-xs text-gray-400">No snapshots yet</p>
                                        )}
                                        {versionHistory.slice(0, 12).map((item) => (
                                            <div key={item.id} className="flex items-center justify-between text-xs py-1">
                                                <span className="truncate pr-2">{item.label || 'Snapshot'}</span>
                                                <button
                                                    onClick={() => handleRestoreVersion(item.id)}
                                                    disabled={isRestoring}
                                                    className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                                    title="Restore this version"
                                                >
                                                    <FiRotateCcw />
                                                </button>
                                                <button
                                                    onClick={() => handleCompareVersion(item)}
                                                    className="text-gray-600 hover:text-gray-800"
                                                    title="Compare with current draft"
                                                >
                                                    ≈
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3 rounded border border-gray-200 bg-white text-xs">
                                <button
                                    type="button"
                                    onClick={() => setShowPublishTools((prev) => !prev)}
                                    className="w-full px-3 py-2 flex items-center justify-between"
                                >
                                    <span className="font-semibold text-gray-500 uppercase tracking-wider">Publish Status</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${publishStatus === 'live'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : publishStatus === 'scheduled'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            {publishStatus}
                                        </span>
                                        {showPublishTools ? <FiChevronUp size={14} className="text-gray-500" /> : <FiChevronDown size={14} className="text-gray-500" />}
                                    </div>
                                </button>
                                {showPublishTools && (
                                    <div className="p-2 pt-0 space-y-2">
                                        <p className="text-[11px] text-gray-500">Last published: {publishedAtLabel}</p>
                                        <input
                                            type="datetime-local"
                                            value={scheduledPublishAt}
                                            onChange={(e) => setScheduledPublishAt(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={handleSchedulePublish}
                                                disabled={isSaving}
                                                className="btn btn-secondary text-xs"
                                            >
                                                Schedule
                                            </button>
                                            <button
                                                onClick={handlePublishNow}
                                                disabled={isSaving}
                                                className="btn btn-primary text-xs"
                                            >
                                                Publish Now
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleRunPublishCheck}
                                            disabled={isSaving}
                                            className="btn btn-secondary text-xs w-full"
                                        >
                                            Run Publish Check
                                        </button>
                                        <button
                                            onClick={() => handleSave({ publishMode: 'draft' })}
                                            disabled={isSaving}
                                            className="btn btn-secondary text-xs w-full"
                                        >
                                            Save Draft Only
                                        </button>
                                        {scheduleCountdownLabel && (
                                            <p className="text-[11px] text-amber-700">{scheduleCountdownLabel}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Right Preview Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-gray-100 relative">
                    {/* Toolbar */}
                    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-center gap-4 px-4 shadow-sm z-10">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preview Mode:</span>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveView('desktop')}
                                className={`p-1.5 px-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${activeView === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FiMonitor size={14} /> Desktop
                            </button>
                            <button
                                onClick={() => setActiveView('mobile')}
                                className={`p-1.5 px-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${activeView === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FiSmartphone size={14} /> Mobile
                            </button>
                        </div>
                    </div>

                    {/* Iframe / Preview Container */}
                    <div className="flex-1 overflow-auto p-8 flex justify-center items-start relative">
                        {iframeLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="spinner w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                    <p className="text-sm text-gray-500 font-medium">Loading Preview...</p>
                                </div>
                            </div>
                        )}

                        <div
                            className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden relative ${activeView === 'mobile' ? 'w-[375px] h-[812px] rounded-[30px] border-[8px] border-gray-800' : 'w-full h-full max-w-[1280px] rounded-lg border border-gray-200'
                                }`}
                        >
                            <iframe
                                src="/?visualEditor=1"
                                className={`w-full h-full bg-white transition-opacity duration-300 ${iframeLoading ? 'opacity-0' : 'opacity-100'}`}
                                title="Live Preview"
                                onLoad={() => {
                                    setIframeLoading(false);
                                    postPreviewUpdate({
                                        layout,
                                        theme,
                                        branding,
                                        announcementBar,
                                    });
                                }}
                            />
                        </div>
                    </div>
                </main>

                {compareModal.open && (
                    <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-4">
                        <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-lg bg-white shadow-2xl border border-gray-200">
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-800">Compare Draft vs {compareModal.label}</h3>
                                <button
                                    type="button"
                                    onClick={() => setCompareModal({ open: false, label: '', rows: [] })}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                            <div className="p-4 space-y-2">
                                {compareModal.rows.length === 0 && (
                                    <p className="text-sm text-gray-500">No sections to compare.</p>
                                )}
                                {compareModal.rows.map((row) => (
                                    <div key={row.sectionId} className="rounded border border-gray-200 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium text-gray-800">
                                                {row.sectionType} ({row.sectionId})
                                            </p>
                                            <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${
                                                row.status === 'same'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : row.status === 'changed'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                                            <div className="rounded border border-gray-100 p-2 bg-gray-50">
                                                <p className="font-semibold text-gray-600 mb-1">Draft</p>
                                                <p>Enabled: {row.currentEnabled ? 'Yes' : 'No'}</p>
                                            </div>
                                            <div className="rounded border border-gray-100 p-2 bg-gray-50">
                                                <p className="font-semibold text-gray-600 mb-1">Snapshot</p>
                                                <p>Enabled: {row.snapshotEnabled ? 'Yes' : 'No'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Changed Fields</p>
                                            {row.changedKeys.length === 0 ? (
                                                <p className="text-xs text-gray-500">No data field changes.</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {row.changedKeys.map((key) => (
                                                        <span key={key} className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                                                            {key}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div >
        </AdminLayout >
    );
}
