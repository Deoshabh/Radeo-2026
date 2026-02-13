'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { adminAPI, settingsAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import ImageUploadWithEditor from '@/components/ImageUploadWithEditor';
import toast from 'react-hot-toast';
import { FiSave, FiImage, FiLayout, FiTrash2, FiPlus, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function AdminCMSPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { refreshSettings } = useSiteSettings();

    const [activeTab, setActiveTab] = useState('branding'); // 'branding', 'banners'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data State
    const [branding, setBranding] = useState({
        logo: { url: '', alt: 'Logo' },
        favicon: { url: '' },
        siteName: 'Radeo',
    });

    const [banners, setBanners] = useState([]);

    // Announcement Bar State
    const [announcementBar, setAnnouncementBar] = useState({
        enabled: true,
        text: '',
        link: '',
        backgroundColor: '#10b981',
        textColor: '#ffffff',
        dismissible: true
    });

    // Home Sections State
    const [homeSections, setHomeSections] = useState({
        heroSection: {},
        featuredProducts: {},
        madeToOrder: {},
        newsletter: {}
    });

    // Image Upload State
    const [logoPreview, setLogoPreview] = useState([]);
    const [logoFile, setLogoFile] = useState([]);
    const [faviconPreview, setFaviconPreview] = useState([]);
    const [faviconFile, setFaviconFile] = useState([]);

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
            router.push('/');
        }
    }, [user, isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            fetchSettings();
        }
    }, [isAuthenticated, user]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllSettings();
            const settings = response.data.settings;

            setBranding(settings.branding || { logo: {}, favicon: {}, siteName: '' });
            setBanners(settings.banners || []);
            setAnnouncementBar(settings.announcementBar || {
                enabled: true, text: '', link: '', backgroundColor: '#10b981', textColor: '#ffffff', dismissible: true
            });
            setHomeSections(settings.homeSections || {
                heroSection: {}, featuredProducts: {}, madeToOrder: {}, newsletter: {}
            });

            // Init previews
            if (settings.branding?.logo?.url) {
                setLogoPreview([settings.branding.logo.url]);
            }
            if (settings.branding?.favicon?.url) {
                setFaviconPreview([settings.branding.favicon.url]);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadImage = async (file) => {
        try {
            if (!file) return null;

            const { data: responseData } = await adminAPI.getUploadUrl({
                fileName: file.name,
                fileType: file.type,
                folder: 'cms', // Organize in CMS folder
            });

            const uploadUrlData = responseData?.data || responseData;

            await fetch(uploadUrlData.signedUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

            return uploadUrlData.publicUrl;
        } catch (error) {
            console.error('Upload failed:', error);
            throw new Error(`Failed to upload ${file.name}`);
        }
    };

    const handleSaveBranding = async () => {
        try {
            setSaving(true);

            let logoUrl = branding.logo?.url;
            let faviconUrl = branding.favicon?.url;

            // Upload new Logo if changed
            if (logoFile.length > 0) {
                logoUrl = await handleUploadImage(logoFile[0]);
            }

            // Upload new Favicon if changed
            if (faviconFile.length > 0) {
                faviconUrl = await handleUploadImage(faviconFile[0]);
            }

            const updatedBranding = {
                ...branding,
                logo: { ...branding.logo, url: logoUrl },
                favicon: { ...branding.favicon, url: faviconUrl },
            };

            await adminAPI.updateSettings({ branding: updatedBranding });

            toast.success('Branding settings updated!');
            setBranding(updatedBranding);
            setLogoFile([]);
            setFaviconFile([]);
            refreshSettings(); // Update context
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save branding settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAnnouncement = async () => {
        try {
            setSaving(true);
            await adminAPI.updateSettings({ announcementBar });
            toast.success('Announcement Bar updated!');
            refreshSettings();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save announcement bar');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSections = async () => {
        try {
            setSaving(true);
            await adminAPI.updateSettings({ homeSections });
            toast.success('Home Sections updated!');
            refreshSettings();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save sections');
        } finally {
            setSaving(false);
        }
    };

    const handleSectionChange = (section, field, value) => {
        setHomeSections(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // Banner Management
    const handleAddBanner = () => {
        setBanners([
            ...banners,
            {
                id: Date.now().toString(),
                imageUrl: '',
                title: 'New Banner',
                subtitle: 'Banner Subtitle',
                link: '/products',
                buttonText: 'Shop Now',
                isActive: true,
                order: banners.length,
                _isNew: true, // Internal flag
                _file: null, // To store file before upload
                _preview: null
            }
        ]);
    };

    const handleRemoveBanner = (index) => {
        const newBanners = banners.filter((_, i) => i !== index);
        setBanners(newBanners);
    };

    const handleMoveBanner = (index, direction) => {
        const newBanners = [...banners];
        const targetIndex = index + direction;

        if (targetIndex >= 0 && targetIndex < newBanners.length) {
            [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];
            // Update order
            newBanners.forEach((b, i) => b.order = i);
            setBanners(newBanners);
        }
    };

    const handleBannerChange = (index, field, value) => {
        const newBanners = [...banners];
        newBanners[index][field] = value;
        setBanners(newBanners);
    };

    const handleBannerImageChange = (index, { images, imagePreviews }) => {
        const newBanners = [...banners];
        if (images.length > 0) {
            newBanners[index]._file = images[0];
            newBanners[index]._preview = imagePreviews[0];
        }
        setBanners(newBanners);
    };

    const handleSaveBanners = async () => {
        try {
            setSaving(true);
            const updatedBanners = [...banners];

            // Upload images for new/updated banners
            for (let i = 0; i < updatedBanners.length; i++) {
                const banner = updatedBanners[i];
                if (banner._file) {
                    const url = await handleUploadImage(banner._file);
                    updatedBanners[i].imageUrl = url;
                    delete updatedBanners[i]._file;
                    delete updatedBanners[i]._preview;
                    delete updatedBanners[i]._isNew;
                }
            }

            await adminAPI.updateSettings({ banners: updatedBanners });

            toast.success('Banners updated successfully!');
            setBanners(updatedBanners);
            refreshSettings();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save banners');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-primary-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
                    <div className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">CMS & Site Settings</h1>
                        <p className="text-primary-600 mt-1">Manage your website&apos;s look and feel</p>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow-sm mb-6 flex overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('branding')}
                            className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'branding'
                                ? 'border-primary-900 text-primary-900 bg-primary-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FiLayout className="inline mr-2" /> Branding
                        </button>
                        <button
                            onClick={() => setActiveTab('banners')}
                            className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'banners'
                                ? 'border-primary-900 text-primary-900 bg-primary-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FiImage className="inline mr-2" /> Home Banners
                        </button>
                        <button
                            onClick={() => setActiveTab('announcement')}
                            className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'announcement'
                                ? 'border-primary-900 text-primary-900 bg-primary-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span className="inline mr-2">📢</span> Announcement Bar
                        </button>
                        <button
                            onClick={() => setActiveTab('sections')}
                            className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'sections'
                                ? 'border-primary-900 text-primary-900 bg-primary-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FiLayout className="inline mr-2" /> Home Sections
                        </button>
                    </div>

                    {/* Branding Tab */}
                    {activeTab === 'branding' && (
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Logo Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-primary-900">Website Logo</h3>
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <ImageUploadWithEditor
                                            maxImages={1}
                                            images={logoFile}
                                            imagePreviews={logoPreview.length ? logoPreview : (branding.logo?.url ? [branding.logo.url] : [])}
                                            onImagesChange={({ images, imagePreviews }) => {
                                                setLogoFile(images);
                                                setLogoPreview(imagePreviews);
                                            }}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Recommended: PNG with transparent background. Max height: 60px.</p>
                                    </div>
                                </div>

                                {/* Favicon Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-primary-900">Favicon</h3>
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <ImageUploadWithEditor
                                            maxImages={1}
                                            images={faviconFile}
                                            imagePreviews={faviconPreview.length ? faviconPreview : (branding.favicon?.url ? [branding.favicon.url] : [])}
                                            onImagesChange={({ images, imagePreviews }) => {
                                                setFaviconFile(images);
                                                setFaviconPreview(imagePreviews);
                                            }}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Recommended: Square PNG/ICO. 32x32 or 64x64.</p>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-primary-900 mb-2">Site Name</label>
                                    <input
                                        type="text"
                                        value={branding.siteName}
                                        onChange={(e) => setBranding({ ...branding, siteName: e.target.value })}
                                        className="input w-full md:w-1/2"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t flex justify-end">
                                <button
                                    onClick={handleSaveBranding}
                                    disabled={saving}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <FiSave /> {saving ? 'Saving...' : 'Save Branding'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Banners Tab */}
                    {activeTab === 'banners' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-primary-900">Hero Banners</h3>
                                <button onClick={handleAddBanner} className="btn btn-secondary flex items-center gap-2 text-sm">
                                    <FiPlus /> Add Banner
                                </button>
                            </div>

                            <div className="space-y-4">
                                {banners.length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                        <p className="text-gray-500">No banners added yet.</p>
                                    </div>
                                )}

                                {banners.map((banner, index) => (
                                    <div key={banner.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md">
                                        <div className="flex gap-4 flex-col md:flex-row">
                                            {/* Image Preview/Upload */}
                                            <div className="w-full md:w-1/3 flex-shrink-0">
                                                <div className="aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden relative">
                                                    {banner.imageUrl ? (
                                                        <Image
                                                            src={banner.imageUrl}
                                                            alt="Banner"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : banner._preview ? (
                                                        <Image
                                                            src={banner._preview}
                                                            alt="Preview"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">No Image</div>
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    <ImageUploadWithEditor
                                                        maxImages={1}
                                                        images={[]}
                                                        imagePreviews={[]}
                                                        onImagesChange={(data) => handleBannerImageChange(index, data)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500 uppercase">Title</label>
                                                        <input
                                                            type="text"
                                                            value={banner.title}
                                                            onChange={(e) => handleBannerChange(index, 'title', e.target.value)}
                                                            className="input w-full text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500 uppercase">Subtitle</label>
                                                        <input
                                                            type="text"
                                                            value={banner.subtitle}
                                                            onChange={(e) => handleBannerChange(index, 'subtitle', e.target.value)}
                                                            className="input w-full text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 uppercase">Link URL</label>
                                                    <input
                                                        type="text"
                                                        value={banner.link}
                                                        onChange={(e) => handleBannerChange(index, 'link', e.target.value)}
                                                        className="input w-full text-sm"
                                                        placeholder="/products?category=running"
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">Example: <code>/products?category=running</code> to filter by category.</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 uppercase">Button Text</label>
                                                    <input
                                                        type="text"
                                                        value={banner.buttonText}
                                                        onChange={(e) => handleBannerChange(index, 'buttonText', e.target.value)}
                                                        className="input w-full text-sm"
                                                        placeholder="Shop Now"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-4 pt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={banner.isActive}
                                                            onChange={(e) => handleBannerChange(index, 'isActive', e.target.checked)}
                                                            className="accent-primary-900"
                                                        />
                                                        <span className="text-sm">Active</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-row md:flex-col justify-between items-center gap-2 md:border-l md:pl-4">
                                                <div className="flex flex-row md:flex-col gap-1">
                                                    <button
                                                        onClick={() => handleMoveBanner(index, -1)}
                                                        disabled={index === 0}
                                                        className={`p-2 rounded hover:bg-gray-100 ${index === 0 ? 'text-gray-300' : 'text-gray-600'}`}
                                                    >
                                                        <FiArrowUp />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveBanner(index, 1)}
                                                        disabled={index === banners.length - 1}
                                                        className={`p-2 rounded hover:bg-gray-100 ${index === banners.length - 1 ? 'text-gray-300' : 'text-gray-600'}`}
                                                    >
                                                        <FiArrowDown />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveBanner(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                    title="Remove Banner"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t flex justify-end">
                                <button
                                    onClick={handleSaveBanners}
                                    disabled={saving}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <FiSave /> {saving ? 'Saving...' : 'Save Banners'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Announcement Bar Tab */}
                    {activeTab === 'announcement' && (
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-6 animate-fade-in">
                            <h3 className="text-lg font-semibold text-primary-900 mb-4">Announcement Bar Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 cursor-pointer mb-4">
                                        <input
                                            type="checkbox"
                                            checked={announcementBar.enabled}
                                            onChange={(e) => setAnnouncementBar({ ...announcementBar, enabled: e.target.checked })}
                                            className="w-5 h-5 accent-primary-900"
                                        />
                                        <span className="font-medium text-primary-900">Enable Announcement Bar</span>
                                    </label>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-primary-900 mb-2">Announcement Text</label>
                                    <input
                                        type="text"
                                        value={announcementBar.text}
                                        onChange={(e) => setAnnouncementBar({ ...announcementBar, text: e.target.value })}
                                        className="input w-full"
                                        placeholder="e.g. Free shipping on orders over $50!"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary-900 mb-2">Link URL (Optional)</label>
                                    <input
                                        type="text"
                                        value={announcementBar.link}
                                        onChange={(e) => setAnnouncementBar({ ...announcementBar, link: e.target.value })}
                                        className="input w-full"
                                        placeholder="e.g. /products"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer mt-8">
                                        <input
                                            type="checkbox"
                                            checked={announcementBar.dismissible}
                                            onChange={(e) => setAnnouncementBar({ ...announcementBar, dismissible: e.target.checked })}
                                            className="w-4 h-4 accent-primary-900"
                                        />
                                        <span className="text-sm text-primary-700">Allow users to dismiss</span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary-900 mb-2">Background Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={announcementBar.backgroundColor}
                                            onChange={(e) => setAnnouncementBar({ ...announcementBar, backgroundColor: e.target.value })}
                                            className="h-10 w-20 p-1 rounded border"
                                        />
                                        <input
                                            type="text"
                                            value={announcementBar.backgroundColor}
                                            onChange={(e) => setAnnouncementBar({ ...announcementBar, backgroundColor: e.target.value })}
                                            className="input w-full uppercase"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary-900 mb-2">Text Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={announcementBar.textColor}
                                            onChange={(e) => setAnnouncementBar({ ...announcementBar, textColor: e.target.value })}
                                            className="h-10 w-20 p-1 rounded border"
                                        />
                                        <input
                                            type="text"
                                            value={announcementBar.textColor}
                                            onChange={(e) => setAnnouncementBar({ ...announcementBar, textColor: e.target.value })}
                                            className="input w-full uppercase"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-6">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Preview</h4>
                                <div
                                    style={{ backgroundColor: announcementBar.backgroundColor, color: announcementBar.textColor }}
                                    className="p-3 text-center text-sm font-medium rounded"
                                >
                                    {announcementBar.text || 'Preview Text'}
                                </div>
                            </div>

                            <div className="pt-4 border-t flex justify-end">
                                <button
                                    onClick={handleSaveAnnouncement}
                                    disabled={saving}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <FiSave /> {saving ? 'Saving...' : 'Save Announcement'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Home Sections Tab */}
                    {activeTab === 'sections' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Hero Section */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-primary-900 mb-4 pb-2 border-b">Hero Section</h3>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={homeSections.heroSection?.enabled ?? true}
                                            onChange={(e) => handleSectionChange('heroSection', 'enabled', e.target.checked)}
                                            className="accent-primary-900"
                                        />
                                        <span className="font-medium">Enable Hero Section</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Title</label>
                                            <input type="text" value={homeSections.heroSection?.title || ''} onChange={(e) => handleSectionChange('heroSection', 'title', e.target.value)} className="input w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Subtitle</label>
                                            <input type="text" value={homeSections.heroSection?.subtitle || ''} onChange={(e) => handleSectionChange('heroSection', 'subtitle', e.target.value)} className="input w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Primary Button</label>
                                            <input type="text" value={homeSections.heroSection?.primaryButtonText || ''} onChange={(e) => handleSectionChange('heroSection', 'primaryButtonText', e.target.value)} className="input w-full mb-1" placeholder="Text" />
                                            <input type="text" value={homeSections.heroSection?.primaryButtonLink || ''} onChange={(e) => handleSectionChange('heroSection', 'primaryButtonLink', e.target.value)} className="input w-full" placeholder="Link" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Secondary Button</label>
                                            <input type="text" value={homeSections.heroSection?.secondaryButtonText || ''} onChange={(e) => handleSectionChange('heroSection', 'secondaryButtonText', e.target.value)} className="input w-full mb-1" placeholder="Text" />
                                            <input type="text" value={homeSections.heroSection?.secondaryButtonLink || ''} onChange={(e) => handleSectionChange('heroSection', 'secondaryButtonLink', e.target.value)} className="input w-full" placeholder="Link" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Featured Products */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-primary-900 mb-4 pb-2 border-b">Featured Products</h3>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={homeSections.featuredProducts?.enabled ?? true}
                                            onChange={(e) => handleSectionChange('featuredProducts', 'enabled', e.target.checked)}
                                            className="accent-primary-900"
                                        />
                                        <span className="font-medium">Enable Featured Products</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Title</label>
                                            <input type="text" value={homeSections.featuredProducts?.title || ''} onChange={(e) => handleSectionChange('featuredProducts', 'title', e.target.value)} className="input w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Description</label>
                                            <input type="text" value={homeSections.featuredProducts?.description || ''} onChange={(e) => handleSectionChange('featuredProducts', 'description', e.target.value)} className="input w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Selection Strategy</label>
                                            <select
                                                value={homeSections.featuredProducts?.productSelection || 'latest'}
                                                onChange={(e) => handleSectionChange('featuredProducts', 'productSelection', e.target.value)}
                                                className="input w-full"
                                            >
                                                <option value="latest">Latest Products</option>
                                                <option value="top-rated">Top Rated</option>
                                                <option value="random">Random Selection</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Product Limit</label>
                                            <input
                                                type="number"
                                                min="4" max="24"
                                                value={homeSections.featuredProducts?.productLimit || 8}
                                                onChange={(e) => handleSectionChange('featuredProducts', 'productLimit', Number(e.target.value))}
                                                className="input w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Made To Order */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-primary-900 mb-4 pb-2 border-b">Made to Order Section</h3>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={homeSections.madeToOrder?.enabled ?? true}
                                            onChange={(e) => handleSectionChange('madeToOrder', 'enabled', e.target.checked)}
                                            className="accent-primary-900"
                                        />
                                        <span className="font-medium">Enable Section</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Title</label>
                                            <input type="text" value={homeSections.madeToOrder?.title || ''} onChange={(e) => handleSectionChange('madeToOrder', 'title', e.target.value)} className="input w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Description</label>
                                            <input type="text" value={homeSections.madeToOrder?.description || ''} onChange={(e) => handleSectionChange('madeToOrder', 'description', e.target.value)} className="input w-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Newsletter */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-primary-900 mb-4 pb-2 border-b">Newsletter Section</h3>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={homeSections.newsletter?.enabled ?? true}
                                            onChange={(e) => handleSectionChange('newsletter', 'enabled', e.target.checked)}
                                            className="accent-primary-900"
                                        />
                                        <span className="font-medium">Enable Newsletter</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Title</label>
                                            <input type="text" value={homeSections.newsletter?.title || ''} onChange={(e) => handleSectionChange('newsletter', 'title', e.target.value)} className="input w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Description</label>
                                            <input type="text" value={homeSections.newsletter?.description || ''} onChange={(e) => handleSectionChange('newsletter', 'description', e.target.value)} className="input w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Button Text</label>
                                            <input type="text" value={homeSections.newsletter?.buttonText || ''} onChange={(e) => handleSectionChange('newsletter', 'buttonText', e.target.value)} className="input w-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t flex justify-end">
                                <button
                                    onClick={handleSaveSections}
                                    disabled={saving}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <FiSave /> {saving ? 'Saving...' : 'Save Sections'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AdminLayout>
    );
}

