'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  FiSearch, FiGlobe, FiImage, FiEye, FiEyeOff, FiSave,
  FiRefreshCw, FiChevronDown, FiChevronUp, FiAlertCircle,
  FiCheckCircle, FiExternalLink, FiTwitter, FiTag,
  FiUploadCloud, FiX, FiArrowRight, FiFilter,
  FiMaximize2, FiMinimize2, FiLink, FiCode, FiCopy,
  FiArrowDown, FiArrowUp, FiZap
} from 'react-icons/fi';
import { FaFacebook } from 'react-icons/fa';

// ───────────────────────────────────────────────────
// Config
// ───────────────────────────────────────────────────
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
    canonicalUrl: '',
    structuredData: '',
  };
});

const SEO_TEMPLATES = {
  ecommerce: {
    label: '🛒 E-Commerce',
    title: 'Shop [Category] - Premium Handcrafted Shoes | Radeo',
    description: 'Discover our premium collection of [category] shoes. Handcrafted with finest materials. Free shipping across India. Shop now at Radeo.',
    keywords: 'buy [category] online, premium [category] shoes, handcrafted [category], Radeo shoes',
  },
  info: {
    label: '📄 Info Page',
    title: '[Page Name] - Radeo',
    description: 'Learn about Radeo\'s [page topic]. We are committed to transparency and customer satisfaction.',
    keywords: 'Radeo [page topic], shoe store [page topic]',
  },
  landing: {
    label: '🎯 Landing',
    title: '[Offer/Feature] - Premium Shoes | Radeo',
    description: 'Exclusive [offer/feature] at Radeo. Shop premium handcrafted shoes with [benefit]. Limited time offer.',
    keywords: '[offer] shoes, premium footwear deals, Radeo sale, handcrafted shoes offer',
  },
};

// ───────────────────────────────────────────────────
// SEO Scoring
// ───────────────────────────────────────────────────
function getSeoScore(page) {
  let score = 0;
  const issues = [];
  const tips = [];

  // Title (30 pts)
  if (page.title && page.title.length >= 10) {
    score += 25;
    if (page.title.length >= 30 && page.title.length <= 60) {
      score += 5;
      tips.push('✅ Title length is ideal (30-60 chars)');
    }
  } else {
    issues.push({ text: page.title ? 'Title is too short (min 10 chars)' : 'Missing title', field: 'title' });
  }
  if (page.title && page.title.length > 60) {
    issues.push({ text: 'Title exceeds 60 chars — may be truncated in search results', field: 'title' });
  }

  // Description (30 pts)
  if (page.description && page.description.length >= 50) {
    score += 25;
    if (page.description.length >= 120 && page.description.length <= 160) {
      score += 5;
      tips.push('✅ Description length is ideal (120-160 chars)');
    }
  } else {
    issues.push({ text: page.description ? 'Description is too short (min 50 chars)' : 'Missing meta description', field: 'description' });
  }
  if (page.description && page.description.length > 160) {
    issues.push({ text: 'Description exceeds 160 chars — may be truncated', field: 'description' });
  }

  // Keywords (20 pts)
  if (page.keywords && page.keywords.trim().length > 0) {
    const kwCount = page.keywords.split(',').filter(k => k.trim()).length;
    score += 15;
    if (kwCount >= 3 && kwCount <= 10) {
      score += 5;
      tips.push(`✅ Good keyword count (${kwCount} keywords)`);
    } else if (kwCount < 3) {
      issues.push({ text: `Only ${kwCount} keyword(s) — aim for 3-10`, field: 'keywords' });
    } else {
      issues.push({ text: `Too many keywords (${kwCount}) — search engines may ignore them`, field: 'keywords' });
    }
  } else {
    issues.push({ text: 'Missing keywords', field: 'keywords' });
  }

  // OG Image (20 pts)
  if (page.ogImage && page.ogImage.trim().length > 0) {
    score += 20;
  } else {
    issues.push({ text: 'No custom OG image — using default', field: 'ogImage' });
  }

  return { score: Math.min(score, 100), issues, tips };
}

// ───────────────────────────────────────────────────
// Small Components
// ───────────────────────────────────────────────────
function ScoreRing({ score, size = 48, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = '#ef4444';
  if (score >= 75) color = '#22c55e';
  else if (score >= 50) color = '#eab308';
  else if (score >= 25) color = '#f97316';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
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

// ───────────────────────────────────────────────────
// OG Image Uploader
// ───────────────────────────────────────────────────
function OgImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    try {
      setUploading(true);
      const { data } = await adminAPI.getUploadUrl({
        fileName: file.name,
        fileType: file.type,
        productSlug: 'seo-og-images',
      });
      if (!data.success) throw new Error(data.message || 'Failed to get upload URL');

      const { signedUrl, publicUrl } = data.data;
      await axios.put(signedUrl, file, { headers: { 'Content-Type': file.type } });

      onChange(publicUrl);
      toast.success('OG image uploaded successfully');
    } catch (error) {
      console.error('OG image upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://radeo.in/og-image.jpg or upload"
          className="flex-1 px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown transition-colors"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-brand-brown text-white rounded-lg text-sm font-medium hover:bg-brand-brown/90 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? (
            <><FiRefreshCw className="w-4 h-4 animate-spin" /> Uploading...</>
          ) : (
            <><FiUploadCloud className="w-4 h-4" /> Upload</>
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </div>
      {value && (
        <div className="relative group w-full max-w-xs rounded-lg overflow-hidden border border-primary-200 bg-primary-50">
          <img
            src={value}
            alt="OG Preview"
            className="w-full h-32 object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove image"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <p className="text-xs text-primary-400">Recommended: 1200×630px. Used when sharing on social media.</p>
    </div>
  );
}

// ───────────────────────────────────────────────────
// Social Preview Tabs
// ───────────────────────────────────────────────────
function SocialPreview({ title, description, url, ogImage, defaultOgImage, siteUrl }) {
  const [tab, setTab] = useState('google');
  const fullTitle = title ? `${title} | Radeo` : 'Radeo - Premium Handcrafted Shoes';
  const displayUrl = url;
  const resolvedImage = ogImage || (defaultOgImage?.startsWith('http') ? defaultOgImage : `${siteUrl}${defaultOgImage || '/og-image.jpg'}`);
  const desc = description || 'No description set — search engines will auto-generate a snippet';

  return (
    <div className="mt-4 mb-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-3">
        {[
          { id: 'google', label: 'Google', icon: <FiSearch className="w-3.5 h-3.5" /> },
          { id: 'facebook', label: 'Facebook', icon: <FaFacebook className="w-3.5 h-3.5" /> },
          { id: 'twitter', label: 'Twitter/X', icon: <FiTwitter className="w-3.5 h-3.5" /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-brand-brown text-white'
                : 'text-primary-500 hover:bg-primary-100'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Google Preview */}
      {tab === 'google' && (
        <div className="p-4 bg-primary-50/50 rounded-lg border border-primary-100">
          <p className="text-xs text-primary-400 mb-2 font-medium uppercase tracking-wider">Google Search Result</p>
          <div className="max-w-xl">
            <p className="text-sm text-green-700 truncate">{displayUrl}</p>
            <p className="text-lg text-blue-700 font-medium truncate leading-snug">{fullTitle}</p>
            <p className="text-sm text-primary-500 line-clamp-2 mt-0.5">{desc}</p>
          </div>
        </div>
      )}

      {/* Facebook Preview */}
      {tab === 'facebook' && (
        <div className="p-4 bg-primary-50/50 rounded-lg border border-primary-100">
          <p className="text-xs text-primary-400 mb-2 font-medium uppercase tracking-wider">Facebook Share Preview</p>
          <div className="max-w-md border border-primary-200 rounded-lg overflow-hidden bg-white">
            {resolvedImage && (
              <div className="w-full h-44 bg-primary-100 relative overflow-hidden">
                <img src={resolvedImage} alt="OG" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <div className="p-3">
              <p className="text-[11px] text-primary-400 uppercase tracking-wide">{(siteUrl || 'radeo.in').replace(/^https?:\/\//, '')}</p>
              <p className="text-sm font-semibold text-primary-900 mt-0.5 line-clamp-2">{fullTitle}</p>
              <p className="text-xs text-primary-500 mt-1 line-clamp-2">{desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Twitter Preview */}
      {tab === 'twitter' && (
        <div className="p-4 bg-primary-50/50 rounded-lg border border-primary-100">
          <p className="text-xs text-primary-400 mb-2 font-medium uppercase tracking-wider">Twitter/X Card Preview</p>
          <div className="max-w-md border border-primary-200 rounded-2xl overflow-hidden bg-white">
            {resolvedImage && (
              <div className="w-full h-44 bg-primary-100 relative overflow-hidden">
                <img src={resolvedImage} alt="Card" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <div className="p-3">
              <p className="text-sm font-semibold text-primary-900 line-clamp-1">{fullTitle}</p>
              <p className="text-xs text-primary-500 mt-0.5 line-clamp-2">{desc}</p>
              <p className="text-xs text-primary-400 mt-1 flex items-center gap-1">
                <FiLink className="w-3 h-3" /> {(siteUrl || 'radeo.in').replace(/^https?:\/\//, '')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────
// Page SEO Card
// ───────────────────────────────────────────────────
function PageSeoCard({ config, data, globalData, onChange, siteUrl, forceExpanded, cardRef }) {
  const [expanded, setExpanded] = useState(false);
  const isExpanded = expanded || forceExpanded;
  const { score, issues, tips } = getSeoScore(data);
  const displayUrl = `${siteUrl || 'https://radeo.in'}${config.path}`;

  const applyTemplate = (templateKey) => {
    const t = SEO_TEMPLATES[templateKey];
    if (!t) return;
    onChange(config.key, 'title', t.title.replace(/\[.*?\]/g, config.label));
    onChange(config.key, 'description', t.description.replace(/\[.*?\]/g, config.label.toLowerCase()));
    onChange(config.key, 'keywords', t.keywords.replace(/\[.*?\]/g, config.label.toLowerCase()));
    toast.success(`Applied "${t.label}" template`);
  };

  const copyMetaTags = () => {
    const fullTitle = data.title ? `${data.title} | Radeo` : '';
    const tags = [
      `<title>${fullTitle}</title>`,
      data.description ? `<meta name="description" content="${data.description}" />` : '',
      data.keywords ? `<meta name="keywords" content="${data.keywords}" />` : '',
      data.ogImage ? `<meta property="og:image" content="${data.ogImage}" />` : '',
      data.canonicalUrl ? `<link rel="canonical" href="${data.canonicalUrl}" />` : '',
      data.noindex ? `<meta name="robots" content="noindex, nofollow" />` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard?.writeText(tags);
    toast.success('Meta tags copied to clipboard');
  };

  return (
    <div ref={cardRef} className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all ${forceExpanded ? 'border-brand-brown shadow-md ring-2 ring-brand-brown/20' : 'border-primary-200'}`}>
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
          <ScoreRing score={score} size={36} strokeWidth={3} />
          {isExpanded ? <FiChevronUp className="w-5 h-5 text-primary-400" /> : <FiChevronDown className="w-5 h-5 text-primary-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-primary-100">
          {/* Quick actions bar */}
          <div className="flex items-center gap-2 mt-3 mb-2 flex-wrap">
            <div className="flex items-center gap-1 mr-auto">
              <span className="text-xs text-primary-400 font-medium">Quick fill:</span>
              {Object.entries(SEO_TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key)}
                  className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-600 hover:bg-brand-brown/10 hover:text-brand-brown transition-colors"
                  title={`Apply ${t.label} template`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={copyMetaTags}
              className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-500 hover:bg-primary-100 flex items-center gap-1"
              title="Copy meta tags"
            >
              <FiCopy className="w-3 h-3" /> Copy Tags
            </button>
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-500 hover:bg-primary-100 flex items-center gap-1"
            >
              <FiExternalLink className="w-3 h-3" /> View Page
            </a>
          </div>

          {/* Social Previews */}
          <SocialPreview
            title={data.title}
            description={data.description}
            url={displayUrl}
            ogImage={data.ogImage}
            defaultOgImage={globalData?.defaultOgImage}
            siteUrl={siteUrl}
          />

          {/* Issues & Tips */}
          {(issues.length > 0 || tips.length > 0) && (
            <div className="mb-4 space-y-2">
              {issues.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-800 mb-1.5 flex items-center gap-1">
                    <FiAlertCircle className="w-3.5 h-3.5" /> Issues ({issues.length})
                  </p>
                  <ul className="space-y-1">
                    {issues.map((issue, idx) => (
                      <li key={idx} className="text-xs text-yellow-700 flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full bg-yellow-500 flex-shrink-0" />
                        {issue.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tips.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <ul className="space-y-1">
                    {tips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-green-700">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-4">
            {/* Title */}
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
              {/* Live character progress bar */}
              <div className="mt-1.5 h-1 bg-primary-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (data.title?.length || 0) > 60 ? 'bg-red-400' :
                    (data.title?.length || 0) >= 30 ? 'bg-green-400' :
                    (data.title?.length || 0) > 0 ? 'bg-yellow-400' : 'bg-primary-200'
                  }`}
                  style={{ width: `${Math.min(((data.title?.length || 0) / 60) * 100, 100)}%` }}
                />
              </div>
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
              <div className="mt-1.5 h-1 bg-primary-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (data.description?.length || 0) > 160 ? 'bg-red-400' :
                    (data.description?.length || 0) >= 120 ? 'bg-green-400' :
                    (data.description?.length || 0) >= 50 ? 'bg-yellow-400' :
                    (data.description?.length || 0) > 0 ? 'bg-orange-400' : 'bg-primary-200'
                  }`}
                  style={{ width: `${Math.min(((data.description?.length || 0) / 160) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Keywords */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-primary-700 flex items-center gap-1.5">
                  <FiTag className="w-3.5 h-3.5" /> Keywords
                </label>
                {data.keywords && (
                  <span className="text-xs text-primary-400">
                    {data.keywords.split(',').filter(k => k.trim()).length} keywords
                  </span>
                )}
              </div>
              <input
                type="text"
                value={data.keywords || ''}
                onChange={(e) => onChange(config.key, 'keywords', e.target.value)}
                placeholder="comma-separated keywords, e.g. premium shoes, leather footwear"
                className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown transition-colors"
              />
              {/* Keyword pills preview */}
              {data.keywords && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {data.keywords.split(',').filter(k => k.trim()).map((kw, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 text-xs">
                      {kw.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* OG Image */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-primary-700 flex items-center gap-1.5">
                  <FiImage className="w-3.5 h-3.5" /> OG Image
                </label>
              </div>
              <OgImageUploader
                value={data.ogImage || ''}
                onChange={(url) => onChange(config.key, 'ogImage', url)}
              />
            </div>

            {/* Canonical URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-primary-700 flex items-center gap-1.5">
                  <FiLink className="w-3.5 h-3.5" /> Canonical URL
                </label>
              </div>
              <input
                type="text"
                value={data.canonicalUrl || ''}
                onChange={(e) => onChange(config.key, 'canonicalUrl', e.target.value)}
                placeholder={`${siteUrl || 'https://radeo.in'}${config.path} (leave empty for auto)`}
                className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown transition-colors"
              />
              <p className="text-xs text-primary-400 mt-1">Override the canonical URL if this page has duplicate content elsewhere</p>
            </div>

            {/* Structured Data */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-primary-700 flex items-center gap-1.5">
                  <FiCode className="w-3.5 h-3.5" /> Structured Data (JSON-LD)
                </label>
                <span className="text-xs text-primary-400">Optional</span>
              </div>
              <textarea
                value={data.structuredData || ''}
                onChange={(e) => onChange(config.key, 'structuredData', e.target.value)}
                placeholder='{"@context":"https://schema.org","@type":"WebPage","name":"..."}'
                rows={3}
                className="w-full px-3 py-2.5 border border-primary-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown transition-colors resize-none"
              />
              {data.structuredData && (
                <div className="mt-1">
                  {(() => {
                    try { JSON.parse(data.structuredData); return <span className="text-xs text-green-600 flex items-center gap-1"><FiCheckCircle className="w-3 h-3" /> Valid JSON</span>; }
                    catch { return <span className="text-xs text-red-500 flex items-center gap-1"><FiAlertCircle className="w-3 h-3" /> Invalid JSON</span>; }
                  })()}
                </div>
              )}
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

// ───────────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────────
export default function AdminSeoPage() {
  const [seoSettings, setSeoSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeCardFilter, setActiveCardFilter] = useState(null);
  const [focusedPageKey, setFocusedPageKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [expandAll, setExpandAll] = useState(false);
  const pageCardRefs = useRef({});
  const pageSectionRef = useRef(null);
  const saveRef = useRef(null);

  // Keep handleSave accessible to keyboard shortcut via ref
  const handleSave = useCallback(async () => {
    if (!saveRef.current?.hasChanges || saveRef.current?.saving) return;
    try {
      setSaving(true);
      await adminAPI.updateSeoSettings(saveRef.current.seoSettings);
      toast.success('SEO settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save SEO settings:', error);
      toast.error('Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  }, []);

  // Keep ref in sync
  useEffect(() => {
    saveRef.current = { hasChanges, saving, seoSettings };
  }, [hasChanges, saving, seoSettings]);

  // Ctrl+S keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSeoSettings();
      const data = response.data?.seoSettings || {};

      const merged = {
        global: { ...DEFAULTS.global, ...(data.global || {}) },
        pages: { ...DEFAULTS.pages },
      };

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

  // ── Computed data ──
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

  const pagesOptimized = seoSettings?.pages
    ? PAGE_CONFIGS.filter(config => getSeoScore(seoSettings.pages[config.key] || {}).score >= 75).length
    : 0;

  const allPageIssues = seoSettings?.pages
    ? PAGE_CONFIGS.map(config => {
      const d = seoSettings.pages[config.key] || {};
      const { score, issues } = getSeoScore(d);
      return { config, score, issues };
    }).filter(p => p.issues.length > 0)
    : [];

  // ── Filtering, searching, sorting ──
  const filteredPages = useMemo(() => {
    let pages = [...PAGE_CONFIGS];

    if (activeCardFilter === 'issues') {
      pages = pages.filter(config => {
        const d = seoSettings?.pages?.[config.key] || {};
        return getSeoScore(d).issues.length > 0;
      });
    } else if (activeCardFilter === 'score') {
      pages = pages.filter(config => {
        const d = seoSettings?.pages?.[config.key] || {};
        return getSeoScore(d).score < 75;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      pages = pages.filter(config => {
        const d = seoSettings?.pages?.[config.key] || {};
        return (
          config.label.toLowerCase().includes(q) ||
          config.path.toLowerCase().includes(q) ||
          config.key.toLowerCase().includes(q) ||
          (d.title || '').toLowerCase().includes(q) ||
          (d.keywords || '').toLowerCase().includes(q)
        );
      });
    }

    if (sortBy !== 'default' && seoSettings?.pages) {
      pages.sort((a, b) => {
        const scoreA = getSeoScore(seoSettings.pages[a.key] || {}).score;
        const scoreB = getSeoScore(seoSettings.pages[b.key] || {}).score;
        return sortBy === 'score-asc' ? scoreA - scoreB : scoreB - scoreA;
      });
    }

    return pages;
  }, [activeCardFilter, searchQuery, sortBy, seoSettings]);

  const scrollToPage = (pageKey) => {
    setFocusedPageKey(pageKey);
    setActiveCardFilter(null);
    setSearchQuery('');
    setTimeout(() => {
      pageCardRefs.current[pageKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setFocusedPageKey(null), 3500);
  };

  const handleCardClick = (filter) => {
    if (activeCardFilter === filter) {
      setActiveCardFilter(null);
      return;
    }
    setActiveCardFilter(filter);
    setTimeout(() => {
      pageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ── Loading ──
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
            <div className="flex items-center gap-2">
              <button
                onClick={fetchSettings}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors"
                title="Reload settings"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
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
                {hasChanges && <span className="text-xs opacity-75 hidden sm:inline">(Ctrl+S)</span>}
              </button>
            </div>
          </div>

          {/* Overview Cards — Clickable */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {/* Score Card */}
            <button
              onClick={() => handleCardClick('score')}
              className={`bg-white rounded-xl p-5 border text-left transition-all hover:shadow-md group ${
                activeCardFilter === 'score' ? 'border-brand-brown ring-2 ring-brand-brown/20' : 'border-primary-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-500">SEO Score</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">{overallScore}%</p>
                </div>
                <ScoreRing score={overallScore} size={48} strokeWidth={4} />
              </div>
              <p className="text-[11px] text-primary-400 mt-2 flex items-center gap-1 group-hover:text-brand-brown transition-colors">
                Pages below 75% <FiArrowRight className="w-3 h-3" />
              </p>
            </button>

            {/* Pages Card */}
            <button
              onClick={() => handleCardClick('pages')}
              className={`bg-white rounded-xl p-5 border text-left transition-all hover:shadow-md group ${
                activeCardFilter === 'pages' ? 'border-brand-brown ring-2 ring-brand-brown/20' : 'border-primary-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-500">Pages</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">{PAGE_CONFIGS.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <FiGlobe className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-[11px] text-primary-400 mt-2 flex items-center gap-1 group-hover:text-brand-brown transition-colors">
                Show all <FiArrowRight className="w-3 h-3" />
              </p>
            </button>

            {/* Optimized Card */}
            <button
              onClick={() => {
                setActiveCardFilter(null);
                pageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="bg-white rounded-xl p-5 border border-primary-200 text-left transition-all hover:shadow-md group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-500">Optimized</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">{pagesOptimized}/{PAGE_CONFIGS.length}</p>
                </div>
                <div className={`p-3 rounded-lg ${pagesOptimized === PAGE_CONFIGS.length ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {pagesOptimized === PAGE_CONFIGS.length
                    ? <FiCheckCircle className="w-5 h-5 text-green-600" />
                    : <FiZap className="w-5 h-5 text-yellow-600" />
                  }
                </div>
              </div>
              <p className="text-[11px] text-primary-400 mt-2 flex items-center gap-1 group-hover:text-brand-brown transition-colors">
                Pages scoring 75%+ <FiArrowRight className="w-3 h-3" />
              </p>
            </button>

            {/* Issues Card */}
            <button
              onClick={() => handleCardClick('issues')}
              className={`bg-white rounded-xl p-5 border text-left transition-all hover:shadow-md group ${
                activeCardFilter === 'issues' ? 'border-brand-brown ring-2 ring-brand-brown/20' : 'border-primary-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-500">Issues</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">{totalIssues}</p>
                </div>
                <div className={`p-3 rounded-lg ${totalIssues === 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                  <FiAlertCircle className={`w-5 h-5 ${totalIssues === 0 ? 'text-green-600' : 'text-orange-600'}`} />
                </div>
              </div>
              <p className="text-[11px] text-primary-400 mt-2 flex items-center gap-1 group-hover:text-brand-brown transition-colors">
                {totalIssues > 0 ? 'View all issues' : 'All clear!'} <FiArrowRight className="w-3 h-3" />
              </p>
            </button>
          </div>

          {/* Issues Drill-Down Panel */}
          {activeCardFilter === 'issues' && allPageIssues.length > 0 && (
            <div className="bg-white rounded-xl border border-orange-200 p-5 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-primary-900 flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 text-orange-500" />
                  All SEO Issues ({totalIssues})
                </h3>
                <button
                  onClick={() => setActiveCardFilter(null)}
                  className="text-xs text-primary-400 hover:text-primary-600 flex items-center gap-1"
                >
                  <FiX className="w-3.5 h-3.5" /> Close
                </button>
              </div>
              <div className="space-y-3">
                {allPageIssues.map(({ config, score, issues }) => (
                  <div key={config.key} className="border border-primary-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className="font-medium text-primary-800 text-sm">{config.label}</span>
                        <ScoreBadge score={score} />
                      </div>
                      <button
                        onClick={() => scrollToPage(config.key)}
                        className="text-xs text-brand-brown hover:underline flex items-center gap-1 font-medium"
                      >
                        Fix now <FiArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {issues.map((issue, idx) => (
                        <li
                          key={idx}
                          onClick={() => scrollToPage(config.key)}
                          className="text-xs text-orange-700 flex items-center gap-1.5 cursor-pointer hover:text-orange-900 hover:bg-orange-50 rounded px-2 py-1 -mx-2 transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                          {issue.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Filter Panel */}
          {activeCardFilter === 'score' && (
            <div className="bg-white rounded-xl border border-yellow-200 p-5 mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-primary-900 flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 text-yellow-500" />
                  Pages Scoring Below 75%
                </h3>
                <button
                  onClick={() => setActiveCardFilter(null)}
                  className="text-xs text-primary-400 hover:text-primary-600 flex items-center gap-1"
                >
                  <FiX className="w-3.5 h-3.5" /> Close
                </button>
              </div>
              {filteredPages.length === 0 ? (
                <p className="text-sm text-green-600 flex items-center gap-1.5">
                  <FiCheckCircle className="w-4 h-4" /> All pages are scoring 75% or above!
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredPages.map(config => {
                    const pageData = seoSettings?.pages?.[config.key] || {};
                    const { score, issues } = getSeoScore(pageData);
                    return (
                      <button
                        key={config.key}
                        onClick={() => scrollToPage(config.key)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-primary-100 hover:bg-primary-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          <span className="text-sm font-medium text-primary-800">{config.label}</span>
                          <ScoreRing score={score} size={28} strokeWidth={2.5} />
                        </div>
                        <span className="text-xs text-primary-400">{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
                <OgImageUploader
                  value={seoSettings.global.defaultOgImage}
                  onChange={(url) => handleGlobalChange('defaultOgImage', url)}
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
          <div ref={pageSectionRef} className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                  <FiTag className="w-5 h-5 text-brand-brown" />
                  Page-Level SEO
                  {(activeCardFilter || searchQuery) && (
                    <span className="text-xs font-normal bg-brand-brown/10 text-brand-brown px-2 py-0.5 rounded-full">
                      {filteredPages.length} of {PAGE_CONFIGS.length}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-primary-500 mt-1">Click on a page to expand and edit its SEO metadata</p>
              </div>
              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pages..."
                    className="pl-8 pr-3 py-2 border border-primary-200 rounded-lg text-xs w-40 focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <FiX className="w-3 h-3 text-primary-400 hover:text-primary-600" />
                    </button>
                  )}
                </div>
                {/* Sort */}
                <button
                  onClick={() => {
                    const next = sortBy === 'default' ? 'score-asc' : sortBy === 'score-asc' ? 'score-desc' : 'default';
                    setSortBy(next);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-2 border rounded-lg text-xs transition-colors ${
                    sortBy !== 'default' ? 'border-brand-brown text-brand-brown bg-brand-brown/5' : 'border-primary-200 text-primary-500 hover:bg-primary-50'
                  }`}
                  title={sortBy === 'default' ? 'Sort by score' : sortBy === 'score-asc' ? 'Lowest score first' : 'Highest score first'}
                >
                  {sortBy === 'score-asc' ? <FiArrowUp className="w-3 h-3" /> : sortBy === 'score-desc' ? <FiArrowDown className="w-3 h-3" /> : <FiFilter className="w-3 h-3" />}
                  {sortBy === 'default' ? 'Sort' : sortBy === 'score-asc' ? 'Low→High' : 'High→Low'}
                </button>
                {/* Expand/Collapse All */}
                <button
                  onClick={() => setExpandAll(!expandAll)}
                  className="flex items-center gap-1 px-2.5 py-2 border border-primary-200 rounded-lg text-xs text-primary-500 hover:bg-primary-50 transition-colors"
                  title={expandAll ? 'Collapse all' : 'Expand all'}
                >
                  {expandAll ? <FiMinimize2 className="w-3 h-3" /> : <FiMaximize2 className="w-3 h-3" />}
                  {expandAll ? 'Collapse' : 'Expand'}
                </button>
                {/* Clear filters */}
                {(activeCardFilter || searchQuery || sortBy !== 'default') && (
                  <button
                    onClick={() => { setActiveCardFilter(null); setSearchQuery(''); setSortBy('default'); }}
                    className="text-xs text-primary-400 hover:text-primary-600 flex items-center gap-1"
                  >
                    <FiX className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredPages.length === 0 ? (
            <div className="bg-white rounded-xl border border-primary-200 p-8 text-center">
              <FiSearch className="w-8 h-8 text-primary-300 mx-auto mb-2" />
              <p className="text-sm text-primary-500">No pages match your search</p>
              <button onClick={() => { setSearchQuery(''); setActiveCardFilter(null); }} className="text-xs text-brand-brown hover:underline mt-2">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPages.map((config) => (
                <PageSeoCard
                  key={config.key}
                  config={config}
                  data={seoSettings.pages[config.key] || {}}
                  globalData={seoSettings.global}
                  onChange={handlePageChange}
                  siteUrl={seoSettings.global.siteUrl}
                  forceExpanded={focusedPageKey === config.key || expandAll}
                  cardRef={(el) => { pageCardRefs.current[config.key] = el; }}
                />
              ))}
            </div>
          )}

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
              <li>• <strong>Canonical URL:</strong> Tells search engines which URL is the &quot;official&quot; version of a page</li>
              <li>• <strong>Structured Data:</strong> JSON-LD schema markup for rich search results (e.g. breadcrumbs, FAQ)</li>
              <li>• <strong>noindex:</strong> Hides the page from search engines (useful for private/auth pages)</li>
              <li>• <strong>Product pages</strong> generate their SEO tags automatically from product data</li>
              <li>• Press <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">Ctrl+S</kbd> to save quickly</li>
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
