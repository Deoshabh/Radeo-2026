'use client';

import { useState, useEffect } from 'react';
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
import { FiLayout, FiPlus, FiSave, FiMonitor, FiSmartphone, FiX, FiDroplet, FiUpload, FiDownload, FiRotateCcw } from 'react-icons/fi';
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

// ... imports

export default function VisualEditorPage() {
    const [activeView, setActiveView] = useState('desktop');
    const [layout, setLayout] = useState([]); // Ordered list of sections
    const [theme, setTheme] = useState({}); // Stores global styles, fonts, and now section-specific theme overrides (header, footer, etc.)
    const [branding, setBranding] = useState(SITE_SETTINGS_DEFAULTS.branding || {});
    const [announcementBar, setAnnouncementBar] = useState({});
    const [homeSections, setHomeSections] = useState({}); // Legacy - maps to layout but keeps data structure
    const [activeTab, setActiveTab] = useState('layout');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [versionHistory, setVersionHistory] = useState([]);
    const [isRestoring, setIsRestoring] = useState(false);

    // Derived state
    const editingSection = layout.find(s => s.id === editingSectionId) || null;

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await adminAPI.getAllSettings();
                const settings = response.data.settings || {};

                // Map settings to layout format
                let currentLayout = [];

                if (settings.layout && settings.layout.length > 0) {
                    currentLayout = settings.layout;
                } else if (settings.homeSections) {
                    // Fallback to legacy homeSections
                    const sections = settings.homeSections;
                    if (sections.heroSection) currentLayout.push({ id: 'hero', type: 'hero', enabled: sections.heroSection.enabled, data: sections.heroSection });
                    if (sections.featuredProducts) currentLayout.push({ id: 'products', type: 'products', enabled: sections.featuredProducts.enabled, data: sections.featuredProducts });
                    if (sections.madeToOrder) currentLayout.push({ id: 'madeToOrder', type: 'madeToOrder', enabled: sections.madeToOrder.enabled, data: sections.madeToOrder });
                    if (sections.newsletter) currentLayout.push({ id: 'newsletter', type: 'newsletter', enabled: sections.newsletter.enabled, data: sections.newsletter });
                }

                setLayout(currentLayout.length > 0 ? currentLayout : initialLayout);
                setTheme(settings.theme || SITE_SETTINGS_DEFAULTS.theme);
                setBranding(settings.branding || SITE_SETTINGS_DEFAULTS.branding || {});
                setAnnouncementBar(settings.announcementBar || {});

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
            const sectionType = event.data?.payload?.sectionType;
            if (!sectionType) return;

            const sectionToEdit = layout.find((item) => item.type === sectionType);
            if (sectionToEdit) {
                setEditingSectionId(sectionToEdit.id);
                setIsAddingSection(false);
                setActiveTab('layout');
                toast.success(`Editing ${sectionType} section`);
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

        if (active.id !== over.id) {
            setLayout((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newLayout = arrayMove(items, oldIndex, newIndex);

                // Sync to preview
                const iframe = document.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        type: 'THEME_UPDATE',
                        payload: { layout: newLayout }
                    }, '*');
                }

                return newLayout;
            });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const homeSections = {};
            layout.forEach(section => {
                if (section.type === 'hero') homeSections.heroSection = { ...section.data, enabled: section.enabled };
                if (section.type === 'products') homeSections.featuredProducts = { ...section.data, enabled: section.enabled };
                if (section.type === 'madeToOrder') homeSections.madeToOrder = { ...section.data, enabled: section.enabled };
                if (section.type === 'newsletter') homeSections.newsletter = { ...section.data, enabled: section.enabled };
            });

            const updateData = {
                homeSections,
                layout, // Save the ordered layout
                theme,
                branding,
                announcementBar
            };

            await adminAPI.updateSettings(updateData);

            const historyResponse = await adminAPI.getThemeVersionHistory();
            setVersionHistory(historyResponse.data?.history || []);
            toast.success('Layout and Theme saved successfully!');
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings");
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
            const settings = response.data?.settings;

            if (settings) {
                setLayout(settings.layout || layout);
                setTheme(settings.theme || theme);
                setBranding(settings.branding || branding);
                setAnnouncementBar(settings.announcementBar || announcementBar);
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
            const settings = response.data?.settings;

            if (settings) {
                setLayout(settings.layout || []);
                setTheme(settings.theme || {});
                setBranding(settings.branding || {});
                setAnnouncementBar(settings.announcementBar || {});
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

    // ... rest of the handlers (handleDelete, etc. - ensure they update 'layout' state)
    const handleDelete = (id) => {
        // visual delete only, effectively disables it until saved? 
        // Or strictly removes from the list.
        setLayout(items => items.filter(item => item.id !== id));
        toast.success('Section removed (Save to apply)');
    };

    const handleToggle = (id) => {
        setLayout(items => items.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
    };

    const handleEdit = (section) => {
        setEditingSectionId(section.id);
        setIsAddingSection(false);
    };

    const handleUpdateSection = (id, newData) => {
        setLayout(items => {
            const newLayout = items.map(item => item.id === id ? { ...item, data: newData } : item);

            // Sync to preview
            const iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                // We need to map layout back to 'homeSections' for the legacy components if they rely on it, 
                // OR ensure the frontend uses 'layout' prop correctly.
                // Our updated page.jsx uses 'layout' OR legacy.
                // Sending 'layout' is safer.
                iframe.contentWindow.postMessage({
                    type: 'THEME_UPDATE',
                    payload: { layout: newLayout }
                }, '*');
            }

            return newLayout;
        });
        setEditingSectionId(null);
        toast.success('Section updated');
    };

    const handleAddSection = (template) => {
        // ... similar logic, but we need to ensure we don't duplicate unique sections
        // if the backend structure enforces singletons (like 'hero').

        const newSection = {
            id: `section-${Date.now()}`, // Temporary ID
            type: template.type,
            enabled: true,
            data: { ...template.defaultData }
        };

        setLayout(prev => [...prev, newSection]);
        setIsAddingSection(false);
        setEditingSectionId(newSection.id);
        toast.success(`Added ${template.label}`);
    };

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
                        {/* THEME TAB CONTENT */}
                        {activeTab === 'theme' && (
                            <ThemeCustomizer
                                theme={theme}
                                branding={branding}
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
                                        const iframe = document.querySelector('iframe');
                                        if (iframe && iframe.contentWindow) {
                                            iframe.contentWindow.postMessage({
                                                type: 'THEME_UPDATE',
                                                payload: { layout: newLayout }
                                            }, '*');
                                        }

                                        return newLayout;
                                    });
                                }}
                                onChange={(newTheme) => {
                                    setTheme(newTheme);
                                    // Send update to preview
                                    const iframe = document.querySelector('iframe');
                                    if (iframe && iframe.contentWindow) {
                                        iframe.contentWindow.postMessage({
                                            type: 'THEME_UPDATE',
                                            payload: { theme: newTheme }
                                        }, '*');
                                    }
                                }}
                                onBrandingChange={(newBranding) => {
                                    setBranding(newBranding);
                                    const iframe = document.querySelector('iframe');
                                    if (iframe && iframe.contentWindow) {
                                        iframe.contentWindow.postMessage({
                                            type: 'THEME_UPDATE',
                                            payload: { branding: newBranding }
                                        }, '*');
                                    }
                                }}
                                announcementBar={announcementBar}
                                onAnnouncementChange={(newBar) => {
                                    setAnnouncementBar(newBar);
                                    const iframe = document.querySelector('iframe');
                                    if (iframe && iframe.contentWindow) {
                                        iframe.contentWindow.postMessage({
                                            type: 'THEME_UPDATE',
                                            payload: { announcementBar: newBar }
                                        }, '*');
                                    }
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

                        <div className="mb-3 max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                            <p className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Version History</p>
                            {versionHistory.length === 0 && (
                                <p className="text-xs text-gray-400">No snapshots yet</p>
                            )}
                            {versionHistory.slice(0, 8).map((item) => (
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
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="btn btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            ) : (
                                <FiSave />
                            )}
                            {isSaving ? 'Saving...' : 'Save Layout'}
                        </button>
                    </div>
                </aside>

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
                                onLoad={() => setIframeLoading(false)}
                            />
                        </div>
                    </div>
                </main>

            </div >
        </AdminLayout >
    );
}
