'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FiArrowLeft, FiAlertTriangle, FiSave, FiToggleRight,
  FiSmartphone, FiShield, FiFlag, FiMessageSquare,
} from 'react-icons/fi';

export default function AppConfigPage() {
  const qc = useQueryClient();
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const debounceTimer = useRef(null);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);

  // Fetch config
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'app', 'config'],
    queryFn: async () => {
      const res = await adminAPI.getAppConfig();
      return res.data?.data ?? res.data;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data && !config) setConfig(data);
  }, [data, config]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data) => adminAPI.updateAppConfig(data),
    onSuccess: () => {
      toast.success('Config saved');
      qc.invalidateQueries({ queryKey: ['admin', 'app', 'config'] });
      qc.invalidateQueries({ queryKey: ['admin', 'app', 'stats'] });
      setSaving(false);
    },
    onError: () => {
      toast.error('Failed to save');
      setSaving(false);
    },
  });

  // Debounced auto-save
  const autoSave = useCallback((updatedConfig) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSaving(true);
      saveMutation.mutate(updatedConfig);
    }, 1500);
  }, [saveMutation]);

  const update = (path, value) => {
    setConfig((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      autoSave(next);
      return next;
    });
  };

  const handleManualSave = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSaving(true);
    saveMutation.mutate(config);
  };

  if (isLoading || !config) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/app" className="text-gray-400 hover:text-gray-600 transition-colors">
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">App Configuration</h1>
              <p className="text-sm text-gray-500 mt-0.5">Changes take effect within 5 minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-amber-600 font-medium animate-pulse">Saving...</span>}
            <button
              onClick={handleManualSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <FiSave className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        <div className="space-y-6">

          {/* ─── Maintenance Mode ─────────────────────────── */}
          <Section icon={<FiShield className="w-4 h-4 text-red-500" />} title="Maintenance Mode" badge={config.maintenanceMode ? 'ON' : null} badgeColor="bg-red-100 text-red-700">
            <div className="space-y-4">
              <Toggle
                label="Enable Maintenance Mode"
                checked={config.maintenanceMode}
                onChange={(val) => {
                  if (val && !config.maintenanceMode) {
                    setShowMaintenanceConfirm(true);
                  } else {
                    update('maintenanceMode', val);
                  }
                }}
              />
              {config.maintenanceMode && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-medium flex items-center gap-1.5 mb-2">
                    <FiAlertTriangle className="w-3.5 h-3.5" /> App is showing maintenance screen to all users
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Maintenance Message</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
                  rows={3}
                  value={config.maintenanceMessage || ''}
                  onChange={(e) => update('maintenanceMessage', e.target.value)}
                  placeholder="We are performing scheduled maintenance..."
                />
              </div>
            </div>
          </Section>

          {/* ─── App Version Control ─────────────────────── */}
          <Section icon={<FiSmartphone className="w-4 h-4 text-blue-500" />} title="App Version Control">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Minimum App Version</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                    value={config.minAppVersion || ''}
                    onChange={(e) => update('minAppVersion', e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Latest App Version</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                    value={config.latestAppVersion || ''}
                    onChange={(e) => update('latestAppVersion', e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>
              </div>
              <Toggle
                label="Force Update"
                checked={config.forceUpdate}
                onChange={(val) => update('forceUpdate', val)}
              />
              {config.forceUpdate && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                    <FiAlertTriangle className="w-3.5 h-3.5" /> Users below v{config.minAppVersion} will be forced to update before using the app
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* ─── Brand Customization ─────────────────────── */}
          <Section icon={<span className="w-4 h-4 rounded-full border-2 border-gray-300" style={{ backgroundColor: config.primaryColor || '#000' }} />} title="Brand Customization">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    value={config.primaryColor || '#000000'}
                    onChange={(e) => update('primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-28 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                    value={config.primaryColor || ''}
                    onChange={(e) => update('primaryColor', e.target.value)}
                    placeholder="#000000"
                  />
                  {/* Preview */}
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      className="px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors"
                      style={{ backgroundColor: config.primaryColor || '#000' }}
                    >
                      Button Preview
                    </button>
                    <span className="text-xs font-medium" style={{ color: config.primaryColor || '#000' }}>Accent Text</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">This color is pushed to all active app sessions within 5 minutes</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    value={config.accentColor || '#E53E3E'}
                    onChange={(e) => update('accentColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-28 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                    value={config.accentColor || ''}
                    onChange={(e) => update('accentColor', e.target.value)}
                    placeholder="#E53E3E"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ─── Announcement Banner ─────────────────────── */}
          <Section icon={<FiMessageSquare className="w-4 h-4 text-amber-500" />} title="Announcement Banner">
            <div className="space-y-4">
              <Toggle
                label="Show Announcement"
                checked={config.announcementBanner?.enabled}
                onChange={(val) => update('announcementBanner.enabled', val)}
              />
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Announcement Text</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                  value={config.announcementBanner?.text || ''}
                  onChange={(e) => update('announcementBanner.text', e.target.value)}
                  placeholder="Free shipping on orders above ₹999!"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty to hide the banner</p>
              </div>
              {config.announcementBanner?.enabled && config.announcementBanner?.text && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div
                    className="px-4 py-2 text-center text-sm font-medium"
                    style={{
                      backgroundColor: config.announcementBanner?.bgColor || '#000',
                      color: config.announcementBanner?.textColor || '#FFF',
                    }}
                  >
                    {config.announcementBanner.text}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded border cursor-pointer" value={config.announcementBanner?.bgColor || '#000000'} onChange={(e) => update('announcementBanner.bgColor', e.target.value)} />
                    <input type="text" className="w-24 px-2 py-1.5 rounded border border-gray-200 text-xs font-mono outline-none" value={config.announcementBanner?.bgColor || ''} onChange={(e) => update('announcementBanner.bgColor', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded border cursor-pointer" value={config.announcementBanner?.textColor || '#FFFFFF'} onChange={(e) => update('announcementBanner.textColor', e.target.value)} />
                    <input type="text" className="w-24 px-2 py-1.5 rounded border border-gray-200 text-xs font-mono outline-none" value={config.announcementBanner?.textColor || ''} onChange={(e) => update('announcementBanner.textColor', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ─── Feature Flags ───────────────────────────── */}
          <Section icon={<FiFlag className="w-4 h-4 text-green-500" />} title="Feature Flags">
            <div className="space-y-3">
              <Toggle label="COD Available" checked={config.features?.cod} onChange={(val) => update('features.cod', val)} />
              <Toggle label="Reviews Enabled" checked={config.features?.reviews} onChange={(val) => update('features.reviews', val)} />
              <Toggle label="Wishlist Enabled" checked={config.features?.wishlist} onChange={(val) => update('features.wishlist', val)} />
              <Toggle label="Coupons Enabled" checked={config.features?.coupons} onChange={(val) => update('features.coupons', val)} />
              <Toggle label="Razorpay Enabled" checked={config.features?.razorpay} onChange={(val) => update('features.razorpay', val)} />
              <Toggle label="Push Notifications" checked={config.features?.pushNotifications} onChange={(val) => update('features.pushNotifications', val)} />
              <Toggle label="Recently Viewed" checked={config.features?.recentlyViewed} onChange={(val) => update('features.recentlyViewed', val)} />
            </div>
          </Section>

          {/* ─── Shipping ────────────────────────────────── */}
          <Section icon={<FiToggleRight className="w-4 h-4 text-purple-500" />} title="Shipping Defaults">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                  value={config.freeShippingThreshold ?? ''}
                  onChange={(e) => update('freeShippingThreshold', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Default Shipping Cost (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                  value={config.defaultShippingCost ?? ''}
                  onChange={(e) => update('defaultShippingCost', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </Section>

        </div>

        {/* Maintenance Confirmation Modal */}
        {showMaintenanceConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Enable Maintenance Mode?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                All app users will immediately see a maintenance screen and will not be able to browse products or place orders. This action takes effect within 5 minutes.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowMaintenanceConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
                <button
                  onClick={() => {
                    update('maintenanceMode', true);
                    setShowMaintenanceConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Turn On Maintenance
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Reusable Components ─────────────────────────────────

function Section({ icon, title, badge, badgeColor, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        {icon}
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        {badge && <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor || 'bg-amber-100 text-amber-700'}`}>{badge}</span>}
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}>
        <input type="checkbox" className="sr-only" checked={checked || false} onChange={(e) => onChange(e.target.checked)} />
        <span className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}
