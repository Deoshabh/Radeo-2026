'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { adminAPI, settingsAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import ImageUploadWithEditor from '@/components/ImageUploadWithEditor';
import toast from 'react-hot-toast';
import { FiSave, FiImage, FiLayout, FiTrash2, FiPlus, FiArrowUp, FiArrowDown, FiFileText, FiPhone, FiSettings } from 'react-icons/fi';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function AdminCMSPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { refreshSettings } = useSiteSettings();

    const [activeTab, setActiveTab] = useState('announcement'); // Default to announcement
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data State
    // Note: Branding, Banners, HomeSections are now managed in Visual Editor
    // We still fetch them to avoid breaking the API call structure if needed, or we can just ignore.

    // Announcement Bar State
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

    // Advanced Settings State
    const [advancedSettings, setAdvancedSettings] = useState({});
    const [jsonError, setJsonError] = useState(null);
    const [selectedPolicy, setSelectedPolicy] = useState('shippingPolicy');

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
            const [mainSettingsRes, advancedSettingsRes] = await Promise.all([
                adminAPI.getAllSettings(),
                adminAPI.getAdvancedSettings()
            ]);

            const settings = mainSettingsRes.data.settings;
            setAdvancedSettings(advancedSettingsRes.data.settings || {});

            setBranding(settings.branding || { logo: {}, favicon: {}, siteName: '' });
            setBanners(settings.banners || settings.bannerSystem?.banners || []);
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
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                router.push('/auth/login');
            } else {
                toast.error('Failed to load settings');
            }
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
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                router.push('/auth/login');
            } else {
                toast.error('Failed to save branding settings');
            }
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
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                router.push('/auth/login');
            } else {
                toast.error('Failed to save announcement bar');
            }
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
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                router.push('/auth/login');
            } else {
                toast.error('Failed to save sections');
            }
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
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                router.push('/auth/login');
            } else {
                toast.error('Failed to save banners');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAdvanced = async (key, value) => {
        try {
            setSaving(true);
            setJsonError(null);

            await adminAPI.updateSetting(key, value);

            toast.success('Setting updated successfully');
            setAdvancedSettings(prev => ({ ...prev, [key]: value }));
            refreshSettings();
        } catch (error) {
            console.error(`Failed to save ${key}:`, error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                router.push('/auth/login');
            } else {
                toast.error(`Failed to save ${key}`);
            }
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
                    {/* Announcement Tab */}
                    {
                        activeTab === 'announcement' && (
                            <div className="bg-white rounded-lg shadow-md p-6 space-y-6 animate-fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary-900">Announcement Bar</h3>
                                        <p className="text-sm text-gray-500">Edit top-site announcement text and visibility.</p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/admin/visual-editor')}
                                        className="btn btn-secondary"
                                    >
                                        Open Theme Editor
                                    </button>
                                </div>

                                <div className="space-y-4 border rounded-lg p-4 bg-primary-50/40">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={announcementBar.enabled !== false}
                                            onChange={(e) =>
                                                setAnnouncementBar((prev) => ({ ...prev, enabled: e.target.checked }))
                                            }
                                            className="accent-primary-900"
                                        />
                                        <span className="text-sm font-medium text-primary-900">Enable Announcement Bar</span>
                                    </label>

                                    <div>
                                        <label className="block text-sm font-medium text-primary-900 mb-2">Announcement Text</label>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            value={announcementBar.text || ''}
                                            onChange={(e) =>
                                                setAnnouncementBar((prev) => ({ ...prev, text: e.target.value }))
                                            }
                                            placeholder="Free shipping on all orders above ₹999"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary-900 mb-2">Optional Link</label>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            value={announcementBar.link || ''}
                                            onChange={(e) =>
                                                setAnnouncementBar((prev) => ({ ...prev, link: e.target.value }))
                                            }
                                            placeholder="/products"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-primary-900 mb-2">Background Color</label>
                                            <input
                                                type="color"
                                                value={announcementBar.backgroundColor || '#10b981'}
                                                onChange={(e) =>
                                                    setAnnouncementBar((prev) => ({ ...prev, backgroundColor: e.target.value }))
                                                }
                                                className="h-10 w-20 border border-primary-200 rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary-900 mb-2">Text Color</label>
                                            <input
                                                type="color"
                                                value={announcementBar.textColor || '#ffffff'}
                                                onChange={(e) =>
                                                    setAnnouncementBar((prev) => ({ ...prev, textColor: e.target.value }))
                                                }
                                                className="h-10 w-20 border border-primary-200 rounded"
                                            />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={announcementBar.dismissible !== false}
                                            onChange={(e) =>
                                                setAnnouncementBar((prev) => ({ ...prev, dismissible: e.target.checked }))
                                            }
                                            className="accent-primary-900"
                                        />
                                        <span className="text-sm text-primary-900">Allow users to dismiss</span>
                                    </label>
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
                        )
                    }

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
                            onClick={() => setActiveTab('announcement')}
                            className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'announcement'
                                ? 'border-primary-900 text-primary-900 bg-primary-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span className="inline mr-2">📢</span> Announcement Bar
                        </button>
                        <button
                            onClick={() => setActiveTab('policies')}
                            className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'policies'
                                ? 'border-primary-900 text-primary-900 bg-primary-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FiFileText className="inline mr-2" /> Policies & Pages
                        </button>
                        <button
                            onClick={() => setActiveTab('contact')}
                            className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'contact'
                                ? 'border-primary-900 text-primary-900 bg-primary-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FiPhone className="inline mr-2" /> Contact Info
                        </button>
                        <button
                            onClick={() => setActiveTab('system')}
                            className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'system'
                                ? 'border-primary-900 text-primary-900 bg-primary-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FiSettings className="inline mr-2" /> System
                        </button>
                    </div>








                    {/* Policies Tab */}
                    {
                        activeTab === 'policies' && (
                            <div className="bg-white rounded-lg shadow-md p-6 space-y-6 animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary-900">Policy & Page Content</h3>
                                        <p className="text-sm text-gray-500">Edit detailed content for various site sections.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedPolicy}
                                            onChange={(e) => setSelectedPolicy(e.target.value)}
                                            className="input py-2"
                                        >
                                            <option value="shippingPolicy">Shipping Policy</option>
                                            <option value="returnsPolicy">Returns Policy</option>
                                            <option value="aboutPage">About Page</option>
                                            <option value="faqPage">FAQ Page</option>
                                            <option value="footerContent">Footer Content</option>
                                        </select>
                                        <button
                                            onClick={() => {
                                                try {
                                                    const value = JSON.parse(document.getElementById('policy-editor').value);
                                                    handleSaveAdvanced(selectedPolicy, value);
                                                } catch (e) {
                                                    toast.error('Invalid JSON format');
                                                }
                                            }}
                                            disabled={saving}
                                            className="btn btn-primary flex items-center gap-2"
                                        >
                                            <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>

                                <div className="relative">
                                    <textarea
                                        id="policy-editor"
                                        className="w-full h-[600px] font-mono text-sm p-4 border rounded-lg bg-gray-50 focus:bg-white transition-colors custom-scrollbar"
                                        defaultValue={JSON.stringify(advancedSettings[selectedPolicy] || {}, null, 2)}
                                        key={selectedPolicy}
                                        spellCheck={false}
                                    />
                                    <div className="absolute top-2 right-4 text-xs text-gray-400 pointer-events-none">
                                        JSON Editor
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    <span className="font-semibold text-yellow-600">Note:</span> Be careful when editing JSON structure. Ensure all quotes and commas are correct.
                                </p>
                            </div>
                        )
                    }

                    {/* Contact Tab */}
                    {
                        activeTab === 'contact' && (
                            <div className="bg-white rounded-lg shadow-md p-6 space-y-6 animate-fade-in">
                                <h3 className="text-lg font-semibold text-primary-900 mb-6 border-b pb-2">Contact Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-primary-900 mb-2">Business Address</label>
                                        <textarea
                                            rows={3}
                                            className="input w-full"
                                            value={advancedSettings.contactInfo?.address || ''}
                                            onChange={(e) => setAdvancedSettings(prev => ({
                                                ...prev,
                                                contactInfo: { ...prev.contactInfo, address: e.target.value }
                                            }))}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary-900 mb-2">Phone Number</label>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            value={advancedSettings.contactInfo?.phone || ''}
                                            onChange={(e) => setAdvancedSettings(prev => ({
                                                ...prev,
                                                contactInfo: { ...prev.contactInfo, phone: e.target.value }
                                            }))}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary-900 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            className="input w-full"
                                            value={advancedSettings.contactInfo?.email || ''}
                                            onChange={(e) => setAdvancedSettings(prev => ({
                                                ...prev,
                                                contactInfo: { ...prev.contactInfo, email: e.target.value }
                                            }))}
                                        />
                                    </div>

                                    <div className="md:col-span-2 grid grid-cols-3 gap-4 pt-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={advancedSettings.contactInfo?.showAddress ?? true}
                                                onChange={(e) => setAdvancedSettings(prev => ({
                                                    ...prev,
                                                    contactInfo: { ...prev.contactInfo, showAddress: e.target.checked }
                                                }))}
                                                className="accent-primary-900"
                                            />
                                            <span className="text-sm">Show Address</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={advancedSettings.contactInfo?.showPhone ?? true}
                                                onChange={(e) => setAdvancedSettings(prev => ({
                                                    ...prev,
                                                    contactInfo: { ...prev.contactInfo, showPhone: e.target.checked }
                                                }))}
                                                className="accent-primary-900"
                                            />
                                            <span className="text-sm">Show Phone</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={advancedSettings.contactInfo?.showEmail ?? true}
                                                onChange={(e) => setAdvancedSettings(prev => ({
                                                    ...prev,
                                                    contactInfo: { ...prev.contactInfo, showEmail: e.target.checked }
                                                }))}
                                                className="accent-primary-900"
                                            />
                                            <span className="text-sm">Show Email</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-6 border-t flex justify-end">
                                    <button
                                        onClick={() => handleSaveAdvanced('contactInfo', advancedSettings.contactInfo)}
                                        disabled={saving}
                                        className="btn btn-primary flex items-center gap-2"
                                    >
                                        <FiSave /> {saving ? 'Saving...' : 'Save Contact Info'}
                                    </button>
                                </div>
                            </div>
                        )
                    }

                    {/* System Tab */}
                    {
                        activeTab === 'system' && (
                            <div className="bg-white rounded-lg shadow-md p-6 space-y-6 animate-fade-in">
                                <h3 className="text-lg font-semibold text-primary-900 mb-6 border-b pb-2">System Settings</h3>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div>
                                            <h4 className="font-medium text-primary-900">Maintenance Mode</h4>
                                            <p className="text-sm text-gray-500">Temporarily disable the storefront for visitors.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={advancedSettings.maintenanceMode?.enabled ?? false}
                                                onChange={(e) => setAdvancedSettings(prev => ({
                                                    ...prev,
                                                    maintenanceMode: { ...prev.maintenanceMode, enabled: e.target.checked }
                                                }))}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>

                                    {advancedSettings.maintenanceMode?.enabled && (
                                        <div className="p-4 border rounded-lg animate-fade-in">
                                            <label className="block text-sm font-medium text-primary-900 mb-2">Maintenance Message</label>
                                            <textarea
                                                className="input w-full"
                                                rows={2}
                                                value={advancedSettings.maintenanceMode?.message || ''}
                                                onChange={(e) => setAdvancedSettings(prev => ({
                                                    ...prev,
                                                    maintenanceMode: { ...prev.maintenanceMode, message: e.target.value }
                                                }))}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t flex justify-end">
                                    <button
                                        onClick={() => handleSaveAdvanced('maintenanceMode', advancedSettings.maintenanceMode)}
                                        disabled={saving}
                                        className="btn btn-primary flex items-center gap-2"
                                    >
                                        <FiSave /> {saving ? 'Saving...' : 'Save System Settings'}
                                    </button>
                                </div>
                            </div>
                        )
                    }

                </div >
            </div >
        </AdminLayout >
    );
}

