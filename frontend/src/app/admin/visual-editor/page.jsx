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
import { FiLayout, FiPlus, FiSave, FiMonitor, FiSmartphone, FiX, FiDroplet } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Initial placeholder data (will be replaced by API data)
const initialLayout = [
    { id: '1', type: 'hero', enabled: true, data: {} },
    { id: '2', type: 'products', enabled: true, data: {} },
    { id: '3', type: 'madeToOrder', enabled: true, data: {} },
    { id: '4', type: 'newsletter', enabled: true, data: {} },
];

export default function VisualEditorPage() {
    const [activeView, setActiveView] = useState('desktop');
    const [layout, setLayout] = useState(initialLayout);
    const [theme, setTheme] = useState(null); // NEW: Theme State
    const [activeTab, setActiveTab] = useState('layout'); // layout | theme
    const [isSaving, setIsSaving] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [isAddingSection, setIsAddingSection] = useState(false);

    // Derived state
    const editingSection = layout.find(s => s.id === editingSectionId) || null;

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
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Layout saved successfully!');
        setIsSaving(false);
    };

    const handleDelete = (id) => {
        setLayout(items => items.filter(item => item.id !== id));
        toast.success('Section removed');
    };

    const handleToggle = (id) => {
        setLayout(items => items.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
    };

    const handleEdit = (section) => {
        setEditingSectionId(section.id);
        setIsAddingSection(false); // Close add panel if open
    };

    const handleUpdateSection = (id, newData) => {
        setLayout(items => items.map(item => item.id === id ? { ...item, data: newData } : item));
        setEditingSectionId(null);
        toast.success('Section updated');
    };

    const handleAddSection = (template) => {
        const newSection = {
            id: `section-${Date.now()}`,
            type: template.type,
            enabled: true,
            data: { ...template.defaultData }
        };

        setLayout(prev => [...prev, newSection]);
        setIsAddingSection(false);
        setEditingSectionId(newSection.id); // Auto-open edit
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
                                onChange={(newTheme) => {
                                    setTheme(newTheme);
                                    // Inject into iframe
                                    const iframe = document.querySelector('iframe');
                                    if (iframe && iframe.contentWindow) {
                                        const style = iframe.contentWindow.document.documentElement.style;
                                        if (newTheme.primaryColor) style.setProperty('--color-primary-900', newTheme.primaryColor);
                                        if (newTheme.secondaryColor) style.setProperty('--color-brand-brown', newTheme.secondaryColor);
                                        if (newTheme.borderRadius) style.setProperty('--radius', newTheme.borderRadius);
                                        if (newTheme.fontFamily) style.setProperty('--font-primary', newTheme.fontFamily);
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
                    <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
                        <div
                            className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden ${activeView === 'mobile' ? 'w-[375px] h-[812px] rounded-[30px] border-[8px] border-gray-800' : 'w-full h-full max-w-[1280px] rounded-lg border border-gray-200'
                                }`}
                        >
                            <iframe
                                src="/"
                                className="w-full h-full bg-white transition-all"
                                title="Live Preview"
                                style={{ pointerEvents: 'none' }}
                            />
                        </div>
                    </div>
                </main>

            </div >
        </AdminLayout >
    );
}
