'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { adminAPI } from '@/utils/api';

const SETTING_GROUPS = [
  { key: 'heroSection', label: 'Hero Section', category: 'Home' },
  { key: 'trustBadges', label: 'Trust Badges', category: 'Home' },
  { key: 'featuredProducts', label: 'Featured Products', category: 'Home' },
  { key: 'homeSections', label: 'Home Extra Sections', category: 'Home' },
  { key: 'bannerSystem', label: 'Banner System', category: 'Marketing' },
  { key: 'announcementBar', label: 'Announcement Bar', category: 'Marketing' },
  { key: 'contactInfo', label: 'Contact Information', category: 'Contact' },
  { key: 'socialLinks', label: 'Social Links', category: 'Contact' },
  { key: 'contactPage', label: 'Contact Page', category: 'Contact' },
  { key: 'faqPage', label: 'FAQ System', category: 'FAQ' },
  { key: 'footerContent', label: 'Footer Content', category: 'Footer' },
  { key: 'aboutPage', label: 'About Page', category: 'Pages' },
  { key: 'shippingPolicy', label: 'Shipping Policy', category: 'Policies' },
  { key: 'returnsPolicy', label: 'Returns Policy', category: 'Policies' },
  { key: 'maintenanceMode', label: 'Maintenance Mode', category: 'System' },
];

export default function AdminContentPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { refreshSettings } = useSiteSettings();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [settingsMap, setSettingsMap] = useState({});
  const [historyMap, setHistoryMap] = useState({});
  const [selectedKey, setSelectedKey] = useState(SETTING_GROUPS[0].key);
  const [editorValue, setEditorValue] = useState('');
  const [parseError, setParseError] = useState('');

  const selectedSetting = settingsMap[selectedKey];

  const groupedSettings = useMemo(() => {
    const groups = new Map();
    for (const item of SETTING_GROUPS) {
      if (!groups.has(item.category)) {
        groups.set(item.category, []);
      }
      groups.get(item.category).push(item);
    }
    return Array.from(groups.entries());
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoadingData(true);
      const response = await adminAPI.getAllSettings();
      const list = response?.data?.settings || [];
      const nextMap = list.reduce((acc, item) => {
        acc[item.key] = item;
        return acc;
      }, {});
      setSettingsMap(nextMap);
    } catch (error) {
      console.error('Failed to load admin settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadHistory = async (key) => {
    try {
      const response = await adminAPI.getSettingHistory(key, 10);
      setHistoryMap((prev) => ({
        ...prev,
        [key]: response?.data?.history || [],
      }));
    } catch (error) {
      console.error('Failed to load setting history:', error);
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!loading && user?.role !== 'admin') {
      router.push('/');
      return;
    }

    if (!loading && isAuthenticated && user?.role === 'admin') {
      loadSettings();
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!selectedSetting) {
      setEditorValue('');
      return;
    }

    setEditorValue(JSON.stringify(selectedSetting.value, null, 2));
    setParseError('');
    loadHistory(selectedKey);
  }, [selectedKey, selectedSetting]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const parsedValue = JSON.parse(editorValue);
      setParseError('');

      await adminAPI.updateSetting(selectedKey, parsedValue);
      await loadSettings();
      await loadHistory(selectedKey);
      await refreshSettings();
      toast.success('Setting updated successfully');
    } catch (error) {
      if (error instanceof SyntaxError) {
        setParseError(error.message);
        toast.error('Invalid JSON');
      } else {
        console.error('Failed to save setting:', error);
        toast.error(error.response?.data?.message || 'Failed to save setting');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      await adminAPI.resetSetting(selectedKey);
      await loadSettings();
      await loadHistory(selectedKey);
      await refreshSettings();
      toast.success('Setting reset to default');
    } catch (error) {
      console.error('Failed to reset setting:', error);
      toast.error(error.response?.data?.message || 'Failed to reset setting');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoadingData) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-primary-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">Content CMS</h1>
            <p className="text-sm sm:text-base text-primary-600">
              Manage all admin-controllable site content from one place.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            <aside className="bg-white rounded-lg shadow-md p-4 h-fit lg:sticky lg:top-24">
              <div className="space-y-4">
                {groupedSettings.map(([category, items]) => (
                  <div key={category}>
                    <h2 className="text-xs uppercase tracking-wide text-primary-500 font-semibold mb-2">
                      {category}
                    </h2>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const active = selectedKey === item.key;
                        return (
                          <button
                            type="button"
                            key={item.key}
                            onClick={() => setSelectedKey(item.key)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              active
                                ? 'bg-primary-900 text-white'
                                : 'hover:bg-primary-100 text-primary-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <section className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-primary-900">
                      {SETTING_GROUPS.find((item) => item.key === selectedKey)?.label}
                    </h2>
                    <p className="text-sm text-primary-600">
                      Key: <code>{selectedKey}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reset to Default
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                {selectedSetting && (
                  <div className="mb-4 text-sm text-primary-600">
                    <span className="mr-4">Version: {selectedSetting.version || 1}</span>
                    <span>
                      Last Updated:{' '}
                      {selectedSetting.updatedAt
                        ? new Date(selectedSetting.updatedAt).toLocaleString()
                        : 'Default value'}
                    </span>
                  </div>
                )}

                <textarea
                  value={editorValue}
                  onChange={(e) => setEditorValue(e.target.value)}
                  className="w-full min-h-[420px] font-mono text-sm p-4 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  spellCheck={false}
                />
                {parseError && (
                  <p className="mt-3 text-sm text-red-600">JSON Error: {parseError}</p>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">Recent History</h3>
                {(historyMap[selectedKey] || []).length === 0 ? (
                  <p className="text-primary-600 text-sm">No history available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(historyMap[selectedKey] || []).map((entry) => (
                      <div key={entry._id} className="border border-primary-100 rounded-lg p-3">
                        <div className="text-sm text-primary-800 font-medium">
                          {entry.action.toUpperCase()} at {new Date(entry.createdAt).toLocaleString()}
                        </div>
                        <div className="text-xs text-primary-600 mt-1">
                          By: {entry.updatedBy?.name || entry.updatedBy?.email || 'Unknown'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
