'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import {
  FiSearch, FiGlobe, FiImage, FiEye, FiEyeOff, FiSave,
  FiRefreshCw, FiChevronDown, FiChevronUp, FiAlertCircle,
  FiCheckCircle, FiExternalLink, FiTwitter, FiTag
} from 'react-icons/fi';

const PAGE_CONFIGS = [
  { key: 'home', label: 'Homepage', path: '/', icon: '🏠', indexable: true },
  { key: 'products', label: 'Products', path: '/products', icon: '🛍️', indexable: true },
  { key: 'categories', label: 'Categories', path: '/categories', icon: '📂', indexable: true },
  { key: 'about', label: 'About Us', path: '/about', icon: '📖', indexable: true },
  { key: 'contact', label: 'Contact', path: '/contact', icon: '📧', indexable: true },
  { key: 'faq', label: 'FAQ', path: '/faq', icon: '❓', indexable: true },
  { key: 'shipping', label: 'Shipping', path: '/shipping', icon: '🚚', indexable: true },
  { key: 'returns', label: 'Returns', path: '/returns', icon: '↩️', indexable: true },
  { key: 'privacy', label: 'Privacy Policy', path: '/privacy', icon: '🔒', indexable: true },
  { key: 'terms', label: 'Terms of Service', path: '/terms', icon: '📋', indexable: true },
];

const DEFAULTS = {
  global: {
    siteName: 'Radeo',
    siteUrl: 'https://radeo.in',
    defaultOgImage: '/og-image.jpg',
    twitterHandle: '@radeo_in',
    googleVerification: '',
    yandexVerification: '',
  },
  pages: {},
};

PAGE_CONFIGS.forEach(p => {
  DEFAULTS.pages[p.key] = {
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
    noindex: !p.indexable,
  };
});

function getSeoScore(page) {
  let score = 0;
  const issues = [];

  if (page.title && page.title.length >= 10) {
    score += 25;
  } else {
    issues.push(page.title ? 'Title is too short (min 10 chars)' : 'Missing title');
  }

  if (page.title && page.title.length > 60) {
    issues.push('Title exceeds 60 chars — may be truncated in search results');
  }

  if (page.description && page.description.length >= 50) {
    score += 30;
  } else {
    issues.push(page.description ? 'Description is too short (min 50 chars)' : 'Missing meta description');
  }

  if (page.description && page.description.length > 160) {
    issues.push('Description exceeds 160 chars — may be truncated');
  }

  if (page.keywords && page.keywords.trim().length > 0) {
    score += 20;
  } else {
    issues.push('Missing keywords');
  }

  if (page.ogImage && page.ogImage.trim().length > 0) {
    score += 25;
  } else {
    issues.push('No custom OG image — using default');
  }

  return { score, issues };
}

function ScoreBadge({ score }) {
  let color = 'bg-red-100 text-red-700';
  if (score >= 75) color = 'bg-green-100 text-green-700';
  else if (score >= 50) color = 'bg-yellow-100 text-yellow-700';
  else if (score >= 25) color = 'bg-orange-100 text-orange-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score}%
    </span>
  );
}

function CharCount({ value, max, label }) {
  const len = (value || '').length;
  let color = 'text-primary-400';
  if (len > max) color = 'text-red-500 font-medium';
  else if (len > max * 0.85) color = 'text-yellow-600';
  else if (len > 0) color = 'text-green-600';

  return (
    <span className={`text-xs ${color}`}>
      {len}/{max} {label}
    </span>
  );
}

function PageSeoCard({ config, data, onChange, siteUrl }) {
  const [expanded, setExpanded] = useState(false);
  const { score, issues } = getSeoScore(data);

  const fullTitle = data.title
    ? `${data.title} | Radeo`
    : 'Radeo - Premium Handcrafted Shoes';
  const displayUrl = `${siteUrl || 'https://radeo.in'}${config.path}`;

  return (
    <div className="bg-white border border-primary-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-primary-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{config.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-primary-900">{config.label}</h3>
              {data.noindex && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-600 text-xs font-medium">
                  <FiEyeOff className="w-3 h-3" /> noindex
                </span>
              )}
            </div>
            <p className="text-xs text-primary-400 mt-0.5">{config.path}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={score} />
          {expanded ? <FiChevronUp className="w-5 h-5 text-primary-400" /> : <FiChevronDown className="w-5 h-5 text-primary-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-primary-100">
          {/* Google Preview */}
          <div className="mt-4 mb-5 p-4 bg-primary-50/50 rounded-lg border border-primary-100">
            <p className="text-xs text-primary-400 mb-2 font-medium uppercase tracking-wider">Google Preview</p>
            <div className="max-w-xl">
              <p className="text-sm text-green-700 truncate">{displayUrl}</p>
              <p className="text-lg text-blue-700 hover:underline cursor-pointer font-medium truncate leading-snug">
                {fullTitle}
              </p>
              <p className="text-sm text-primary-500 line-clamp-2 mt-0.5">
                {data.description || 'No description set — search engines will auto-generate a snippet'}
              </p>
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-800 mb-1.5 flex items-center gap-1">
                <FiAlertCircle className="w-3.5 h-3.5" /> SEO Issues ({issues.length})
              </p>
              <ul className="space-y-1">
                {issues.map((issue, idx) => (
                  <li key={idx} className="text-xs text-yellow-700 flex items-start gap-1.5">
                    <span className="mt-1 w-1 h-1 rounded-full bg-yellow-500 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Title */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-primary-700 flex items-center gap-1.5">
                  <FiTag className="w-3.5 h-3.5" /> Page Title
                </label>
                <CharCount value={data.title} max={60} label="chars" />
              </div>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => onChange(config.key, 'title', e.target.value)}
                placeholder="e.g. Shop Premium Handcrafted Shoes"
                className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown transition-colors"
              />
              <p className="text-xs text-primary-400 mt-1">Appears as &quot;{data.title || 'Your Title'} | Radeo&quot; in search results</p>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-primary-700 flex items-center gap-1.5">
                  <FiSearch className="w-3.5 h-3.5" /> Meta Description
                </label>
                <CharCount value={data.description} max={160} label="chars" />
              </div>
              <textarea
                value={data.description || ''}
                onChange={(e) => onChange(config.key, 'description', e.target.value)}
                placeholder="A concise description of this page (50-160 characters)"
                rows={3}
                className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown transition-colors resize-none"
              />
            </div>

            {/* Keywords */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-primary-700 flex items-center gap-1.5">
                  <FiTag className="w-3.5 h-3.5" /> Keywords
                </label>
              </div>
              <input
                type="text"
                value={data.keywords || ''}
                onChange={(e) => onChange(config.key, 'keywords', e.target.value)}
                placeholder="comma-separated keywords, e.g. premium shoes, leather footwear, buy online"
                className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown transition-colors"
              />
            </div>

            {/* OG Image */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-primary-700 flex items-center gap-1.5">
                  <FiImage className="w-3.5 h-3.5" /> OG Image URL
                </label>
              </div>
              <input
                type="text"
                value={data.ogImage || ''}
                onChange={(e) => onChange(config.key, 'ogImage', e.target.value)}
                placeholder="https://radeo.in/og-image-home.jpg (leave empty for default)"
                className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown transition-colors"
              />
              <p className="text-xs text-primary-400 mt-1">Recommended: 1200×630px. Used when sharing on social media.</p>
            </div>

            {/* noindex toggle */}
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-primary-700">Hide from search engines</p>
                <p className="text-xs text-primary-400">
                  When enabled, adds <code className="bg-primary-200 px-1 rounded text-primary-600">noindex, nofollow</code> meta tag
                </p>
              </div>
              <button
                onClick={() => onChange(config.key, 'noindex', !data.noindex)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.noindex ? 'bg-red-500' : 'bg-primary-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.noindex ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSeoPage() {
  const [seoSettings, setSeoSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSeoSettings();
      const data = response.data?.seoSettings || {};

      // Merge with defaults
      const merged = {
        global: { ...DEFAULTS.global, ...(data.global || {}) },
        pages: { ...DEFAULTS.pages },
      };

      // Merge page-level settings
      if (data.pages) {
        for (const [key, val] of Object.entries(data.pages)) {
          merged.pages[key] = { ...(DEFAULTS.pages[key] || {}), ...val };
        }
      }

      setSeoSettings(merged);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to fetch SEO settings:', error);
      toast.error('Failed to load SEO settings');
      setSeoSettings({ ...DEFAULTS });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleGlobalChange = (field, value) => {
    setSeoSettings(prev => ({
      ...prev,
      global: { ...prev.global, [field]: value },
    }));
    setHasChanges(true);
  };

  const handlePageChange = (pageKey, field, value) => {
    setSeoSettings(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageKey]: { ...prev.pages[pageKey], [field]: value },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminAPI.updateSeoSettings(seoSettings);
      toast.success('SEO settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save SEO settings:', error);
      toast.error('Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  // Calculate overall score
  const overallScore = seoSettings?.pages
    ? Math.round(
      Object.entries(seoSettings.pages)
        .filter(([key]) => PAGE_CONFIGS.find(p => p.key === key))
        .reduce((sum, [, page]) => sum + getSeoScore(page).score, 0) /
      PAGE_CONFIGS.length
    )
    : 0;

  const totalIssues = seoSettings?.pages
    ? Object.entries(seoSettings.pages)
      .filter(([key]) => PAGE_CONFIGS.find(p => p.key === key))
      .reduce((sum, [, page]) => sum + getSeoScore(page).issues.length, 0)
    : 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-primary-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-primary-500">
            <FiRefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading SEO settings...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-primary-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 flex items-center gap-3">
                <FiSearch className="w-7 h-7 text-brand-brown" />
                SEO Manager
              </h1>
              <p className="text-primary-500 mt-1">Manage search engine optimization for all pages</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                hasChanges
                  ? 'bg-brand-brown text-white hover:bg-brand-brown/90 shadow-md'
                  : 'bg-primary-200 text-primary-400 cursor-not-allowed'
              }`}
            >
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-500">Overall SEO Score</p>
                  <p className="text-3xl font-bold text-primary-900 mt-1">{overallScore}%</p>
                </div>
                <div className={`p-3 rounded-lg ${overallScore >= 75 ? 'bg-green-100' : overallScore >= 50 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  {overallScore >= 75
                    ? <FiCheckCircle className="w-6 h-6 text-green-600" />
                    : <FiAlertCircle className="w-6 h-6 text-yellow-600" />
                  }
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-500">Pages Managed</p>
                  <p className="text-3xl font-bold text-primary-900 mt-1">{PAGE_CONFIGS.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <FiGlobe className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-500">SEO Issues</p>
                  <p className="text-3xl font-bold text-primary-900 mt-1">{totalIssues}</p>
                </div>
                <div className={`p-3 rounded-lg ${totalIssues === 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                  <FiAlertCircle className={`w-6 h-6 ${totalIssues === 0 ? 'text-green-600' : 'text-orange-600'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Global Settings */}
          <div className="bg-white rounded-xl border border-primary-200 p-5 mb-8">
            <h2 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
              <FiGlobe className="w-5 h-5 text-brand-brown" />
              Global SEO Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Site Name</label>
                <input
                  type="text"
                  value={seoSettings.global.siteName}
                  onChange={(e) => handleGlobalChange('siteName', e.target.value)}
                  className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Site URL</label>
                <input
                  type="text"
                  value={seoSettings.global.siteUrl}
                  onChange={(e) => handleGlobalChange('siteUrl', e.target.value)}
                  className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5 flex items-center gap-1.5">
                  <FiImage className="w-3.5 h-3.5" /> Default OG Image
                </label>
                <input
                  type="text"
                  value={seoSettings.global.defaultOgImage}
                  onChange={(e) => handleGlobalChange('defaultOgImage', e.target.value)}
                  placeholder="/og-image.jpg"
                  className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5 flex items-center gap-1.5">
                  <FiTwitter className="w-3.5 h-3.5" /> Twitter Handle
                </label>
                <input
                  type="text"
                  value={seoSettings.global.twitterHandle}
                  onChange={(e) => handleGlobalChange('twitterHandle', e.target.value)}
                  placeholder="@radeo_in"
                  className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Google Verification Code</label>
                <input
                  type="text"
                  value={seoSettings.global.googleVerification}
                  onChange={(e) => handleGlobalChange('googleVerification', e.target.value)}
                  placeholder="Google Search Console verification meta content"
                  className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Yandex Verification Code</label>
                <input
                  type="text"
                  value={seoSettings.global.yandexVerification}
                  onChange={(e) => handleGlobalChange('yandexVerification', e.target.value)}
                  placeholder="Yandex verification meta content"
                  className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                />
              </div>
            </div>
          </div>

          {/* Per-Page SEO */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <FiTag className="w-5 h-5 text-brand-brown" />
              Page-Level SEO
            </h2>
            <p className="text-sm text-primary-500 mt-1">Click on a page to expand and edit its SEO metadata</p>
          </div>

          <div className="space-y-3">
            {PAGE_CONFIGS.map((config) => (
              <PageSeoCard
                key={config.key}
                config={config}
                data={seoSettings.pages[config.key] || {}}
                onChange={handlePageChange}
                siteUrl={seoSettings.global.siteUrl}
              />
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FiExternalLink className="w-4 h-4" />
              How It Works
            </h3>
            <ul className="space-y-1.5 text-sm text-blue-800">
              <li>• <strong>Title:</strong> Appears in browser tab and search results as &quot;Your Title | Radeo&quot;</li>
              <li>• <strong>Meta Description:</strong> The snippet shown below your link in search results (50-160 chars ideal)</li>
              <li>• <strong>Keywords:</strong> Comma-separated terms relevant to the page content</li>
              <li>• <strong>OG Image:</strong> The image shown when your page is shared on social media (1200×630px recommended)</li>
              <li>• <strong>noindex:</strong> Hides the page from search engines (useful for private/auth pages)</li>
              <li>• <strong>Product pages</strong> generate their SEO tags automatically from product data</li>
            </ul>
          </div>

          {/* Sticky Save Bar */}
          {hasChanges && (
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-primary-200 shadow-lg px-6 py-3 flex items-center justify-between z-50">
              <p className="text-sm text-primary-600">You have unsaved SEO changes</p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-brand-brown text-white rounded-lg font-medium hover:bg-brand-brown/90 transition-colors"
              >
                <FiSave className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
