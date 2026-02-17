'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import toast from 'react-hot-toast';
import {
  FiSave, FiImage, FiLayout, FiTrash2, FiPlus, FiArrowUp, FiArrowDown,
  FiFileText, FiPhone, FiSettings, FiHome, FiChevronDown, FiChevronUp,
} from 'react-icons/fi';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { SITE_SETTINGS_DEFAULTS } from '@/constants/siteSettingsDefaults';

/* ═══════════════════════════════════════════════════════════
   Re-usable small UI pieces for Admin CMS
   ═══════════════════════════════════════════════════════════ */
function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>{children}</div>;
}

function SectionToggle({ label, enabled, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
        <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
        <span className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, ...rest }) {
  return (
    <input
      type="text" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all outline-none"
      value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} {...rest}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all outline-none"
      value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    />
  );
}

function CollapsibleSection({ title, icon, defaultOpen = false, children, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/60 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          {icon} {title}
          {badge && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{badge}</span>}
        </span>
        {open ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
      </button>
      {open && <div className="px-5 py-5 space-y-4 bg-white">{children}</div>}
    </div>
  );
}

function SaveButton({ onClick, saving, label = 'Save Changes' }) {
  return (
    <button onClick={onClick} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
      <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADMIN CMS PAGE
   ═══════════════════════════════════════════════════════════ */
export default function AdminCMSPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { refreshSettings } = useSiteSettings();

  const [activeTab, setActiveTab] = useState('homepage');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── State ──
  const [branding, setBranding] = useState({ logo: { url: '', alt: 'Logo' }, favicon: { url: '' }, siteName: 'Radeo' });
  const [banners, setBanners] = useState([]);
  const [announcementBar, setAnnouncementBar] = useState({ enabled: true, text: '', link: '', backgroundColor: '#10b981', textColor: '#ffffff', dismissible: true });
  const [homePage, setHomePage] = useState(SITE_SETTINGS_DEFAULTS.homePage);
  const [advancedSettings, setAdvancedSettings] = useState({});
  const [selectedPolicy, setSelectedPolicy] = useState('shippingPolicy');

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) router.push('/');
  }, [user, isAuthenticated, authLoading, router]);

  // ── Fetch settings ──
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') fetchSettings();
  }, [isAuthenticated, user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [mainRes, advRes] = await Promise.all([adminAPI.getAllSettings(), adminAPI.getAdvancedSettings()]);
      const s = mainRes.data.settings;
      setAdvancedSettings({ ...(advRes.data.settings || {}), theme: { ...(s.theme || {}), ...(advRes.data.settings?.theme || {}) } });
      setBranding(s.branding || { logo: {}, favicon: {}, siteName: '' });
      setBanners(s.banners || s.bannerSystem?.banners || []);
      setAnnouncementBar(s.announcementBar || { enabled: true, text: '', link: '', backgroundColor: '#10b981', textColor: '#ffffff', dismissible: true });

      // Deep merge homepage with defaults
      const def = SITE_SETTINGS_DEFAULTS.homePage;
      const live = s.homePage || {};
      setHomePage({
        hero: { ...def.hero, ...(live.hero || {}), stats: live.hero?.stats?.length ? live.hero.stats : def.hero.stats },
        marquee: { ...def.marquee, ...(live.marquee || {}) },
        collection: { ...def.collection, ...(live.collection || {}) },
        craft: { ...def.craft, ...(live.craft || {}), images: live.craft?.images?.length ? live.craft.images : def.craft.images, features: live.craft?.features?.length ? live.craft.features : def.craft.features },
        heritage: { ...def.heritage, ...(live.heritage || {}), points: live.heritage?.points?.length ? live.heritage.points : def.heritage.points },
        story: { ...def.story, ...(live.story || {}), paragraphs: live.story?.paragraphs?.length ? live.story.paragraphs : def.story.paragraphs },
        testimonials: { ...def.testimonials, ...(live.testimonials || {}), items: live.testimonials?.items?.length ? live.testimonials.items : def.testimonials.items },
        ctaBanner: { ...def.ctaBanner, ...(live.ctaBanner || {}) },
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      if (error.response?.status === 401) { toast.error('Session expired.'); router.push('/auth/login'); }
      else toast.error('Failed to load settings');
    } finally { setLoading(false); }
  };

  // ── Upload helper ──
  const handleUploadImage = async (file) => {
    if (!file) return null;
    const { data: rd } = await adminAPI.getUploadUrl({ fileName: file.name, fileType: file.type, folder: 'cms' });
    const uld = rd?.data || rd;
    await fetch(uld.signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    return uld.publicUrl;
  };

  // ── Save helpers ──
  const save = useCallback(async (key, value, label) => {
    try {
      setSaving(true);
      await adminAPI.updateSettings({ [key]: value });
      toast.success(`${label} saved!`);
      refreshSettings();
    } catch (error) {
      console.error(`Save ${key} failed:`, error);
      if (error.response?.status === 401) { toast.error('Session expired.'); router.push('/auth/login'); }
      else toast.error(`Failed to save ${label}`);
    } finally { setSaving(false); }
  }, [refreshSettings, router]);

  const saveAdvanced = useCallback(async (key, value) => {
    try {
      setSaving(true);
      await adminAPI.updateSetting(key, value);
      toast.success('Setting saved!');
      setAdvancedSettings(prev => ({ ...prev, [key]: value }));
      refreshSettings();
    } catch (error) {
      console.error(`Save ${key} failed:`, error);
      toast.error('Failed to save');
    } finally { setSaving(false); }
  }, [refreshSettings]);

  // ── Homepage helpers ──
  const hpUpdate = useCallback((section, field, value) => {
    setHomePage(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  }, []);

  const hpArrayUpdate = useCallback((section, arrayKey, index, field, value) => {
    setHomePage(prev => {
      const arr = [...(prev[section]?.[arrayKey] || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [section]: { ...prev[section], [arrayKey]: arr } };
    });
  }, []);

  const hpArrayAdd = useCallback((section, arrayKey, template) => {
    setHomePage(prev => {
      const arr = [...(prev[section]?.[arrayKey] || []), template];
      return { ...prev, [section]: { ...prev[section], [arrayKey]: arr } };
    });
  }, []);

  const hpArrayRemove = useCallback((section, arrayKey, index) => {
    setHomePage(prev => {
      const arr = (prev[section]?.[arrayKey] || []).filter((_, i) => i !== index);
      return { ...prev, [section]: { ...prev[section], [arrayKey]: arr } };
    });
  }, []);

  // ── Banner helpers ──
  const handleAddBanner = () => setBanners(prev => [...prev, { id: Date.now().toString(), imageUrl: '', title: 'New Banner', subtitle: '', link: '/products', buttonText: 'Shop Now', isActive: true, order: prev.length }]);
  const handleRemoveBanner = (i) => setBanners(prev => prev.filter((_, idx) => idx !== i));
  const handleBannerChange = (i, f, v) => setBanners(prev => { const n = [...prev]; n[i] = { ...n[i], [f]: v }; return n; });
  const handleMoveBanner = (i, dir) => {
    setBanners(prev => {
      const n = [...prev]; const t = i + dir;
      if (t < 0 || t >= n.length) return n;
      [n[i], n[t]] = [n[t], n[i]];
      n.forEach((b, idx) => b.order = idx);
      return n;
    });
  };

  // ── Loading ──
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  // ═══════════════════ TABS CONFIG ═══════════════════
  const tabs = [
    { key: 'homepage', label: 'Homepage', icon: <FiHome className="w-4 h-4" /> },
    { key: 'branding', label: 'Branding', icon: <FiImage className="w-4 h-4" /> },
    { key: 'banners', label: 'Banners', icon: <FiLayout className="w-4 h-4" /> },
    { key: 'announcement', label: 'Announcement', icon: <span className="text-sm">📢</span> },
    { key: 'theme', label: 'Theme', icon: <span className="text-sm">🎨</span> },
    { key: 'about', label: 'About', icon: <span className="text-sm">📄</span> },
    { key: 'policies', label: 'Policies', icon: <FiFileText className="w-4 h-4" /> },
    { key: 'contact', label: 'Contact', icon: <FiPhone className="w-4 h-4" /> },
    { key: 'system', label: 'System', icon: <FiSettings className="w-4 h-4" /> },
  ];

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Header ── */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Site Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your website&apos;s content, appearance, and configuration.</p>
          </div>

          {/* ── Tab bar ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 flex overflow-x-auto no-scrollbar">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'border-gray-900 text-gray-900 bg-gray-50/50'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════
              HOMEPAGE TAB
              ══════════════════════════════════════════════════════ */}
          {activeTab === 'homepage' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Homepage Sections</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Control every section of your storefront landing page.</p>
                  </div>
                  <SaveButton onClick={() => save('homePage', homePage, 'Homepage')} saving={saving} />
                </div>
              </Card>

              {/* ── Hero Section ── */}
              <CollapsibleSection title="Hero Section" icon="🖼️" defaultOpen badge={homePage.hero?.enabled !== false ? 'ON' : 'OFF'}>
                <SectionToggle label="Enable Hero Section" enabled={homePage.hero?.enabled !== false} onChange={(v) => hpUpdate('hero', 'enabled', v)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Field label="Eyebrow Text"><TextInput value={homePage.hero?.eyebrow} onChange={(v) => hpUpdate('hero', 'eyebrow', v)} placeholder="Est. 2008 — Handcrafted in Agra" /></Field>
                  <Field label="Hero Image URL" hint="Upload or paste URL">
                    <div className="flex gap-2">
                      <TextInput value={homePage.hero?.image} onChange={(v) => hpUpdate('hero', 'image', v)} placeholder="https://... or leave blank" />
                      <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                        <FiImage className="w-3.5 h-3.5" /> Upload
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                          try {
                            toast.loading('Uploading...', { id: 'hero-upload' });
                            const url = await handleUploadImage(file);
                            if (url) hpUpdate('hero', 'image', url);
                            toast.success('Uploaded!', { id: 'hero-upload' });
                          } catch { toast.error('Upload failed', { id: 'hero-upload' }); }
                        }} />
                      </label>
                    </div>
                  </Field>
                  <Field label="Title Line 1"><TextInput value={homePage.hero?.titleLine1} onChange={(v) => hpUpdate('hero', 'titleLine1', v)} /></Field>
                  <Field label="Title Line 2 (italic)"><TextInput value={homePage.hero?.titleLine2} onChange={(v) => hpUpdate('hero', 'titleLine2', v)} /></Field>
                  <Field label="Title Line 3"><TextInput value={homePage.hero?.titleLine3} onChange={(v) => hpUpdate('hero', 'titleLine3', v)} /></Field>
                  <Field label="Description"><TextArea value={homePage.hero?.description} onChange={(v) => hpUpdate('hero', 'description', v)} /></Field>
                  <Field label="Primary Button Text"><TextInput value={homePage.hero?.primaryButtonText} onChange={(v) => hpUpdate('hero', 'primaryButtonText', v)} /></Field>
                  <Field label="Primary Button Link"><TextInput value={homePage.hero?.primaryButtonLink} onChange={(v) => hpUpdate('hero', 'primaryButtonLink', v)} /></Field>
                  <Field label="Secondary Button Text"><TextInput value={homePage.hero?.secondaryButtonText} onChange={(v) => hpUpdate('hero', 'secondaryButtonText', v)} /></Field>
                  <Field label="Secondary Button Link"><TextInput value={homePage.hero?.secondaryButtonLink} onChange={(v) => hpUpdate('hero', 'secondaryButtonLink', v)} /></Field>
                </div>
                {/* Stats */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hero Stats</span>
                    <button onClick={() => hpArrayAdd('hero', 'stats', { label: 'Label', value: 0, suffix: '' })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Stat</button>
                  </div>
                  {(homePage.hero?.stats || []).map((st, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <TextInput value={st.label} onChange={(v) => hpArrayUpdate('hero', 'stats', i, 'label', v)} placeholder="Label" />
                      <input type="number" className="w-20 px-2 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-amber-200" value={st.value || 0} onChange={(e) => hpArrayUpdate('hero', 'stats', i, 'value', parseInt(e.target.value) || 0)} />
                      <TextInput value={st.suffix} onChange={(v) => hpArrayUpdate('hero', 'stats', i, 'suffix', v)} placeholder="+" />
                      <button onClick={() => hpArrayRemove('hero', 'stats', i)} className="text-red-400 hover:text-red-600"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* ── Marquee ── */}
              <CollapsibleSection title="Marquee Banner" icon="📜" badge={homePage.marquee?.enabled !== false ? 'ON' : 'OFF'}>
                <SectionToggle label="Enable Marquee" enabled={homePage.marquee?.enabled !== false} onChange={(v) => hpUpdate('marquee', 'enabled', v)} />
                <Field label="Scrolling Text" hint="Use ◆ as separators"><TextArea value={homePage.marquee?.text} onChange={(v) => hpUpdate('marquee', 'text', v)} /></Field>
              </CollapsibleSection>

              {/* ── Collection ── */}
              <CollapsibleSection title="Collection / Products" icon="👟" badge={homePage.collection?.enabled !== false ? 'ON' : 'OFF'}>
                <SectionToggle label="Enable Collection Section" enabled={homePage.collection?.enabled !== false} onChange={(v) => hpUpdate('collection', 'enabled', v)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Field label="Section Label"><TextInput value={homePage.collection?.label} onChange={(v) => hpUpdate('collection', 'label', v)} /></Field>
                  <Field label="Section Title"><TextInput value={homePage.collection?.title} onChange={(v) => hpUpdate('collection', 'title', v)} /></Field>
                  <Field label="Product Source">
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                      value={homePage.collection?.productSelection || 'latest'}
                      onChange={(e) => hpUpdate('collection', 'productSelection', e.target.value)}
                    >
                      <option value="latest">Latest Products</option>
                      <option value="top-rated">Top Rated</option>
                      <option value="featured">Featured</option>
                    </select>
                  </Field>
                  <Field label="Product Limit">
                    <input type="number" min={1} max={12}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                      value={homePage.collection?.productLimit || 4}
                      onChange={(e) => hpUpdate('collection', 'productLimit', parseInt(e.target.value) || 4)}
                    />
                  </Field>
                </div>
              </CollapsibleSection>

              {/* ── Craft ── */}
              <CollapsibleSection title="Craft / Process" icon="🔨" badge={homePage.craft?.enabled !== false ? 'ON' : 'OFF'}>
                <SectionToggle label="Enable Craft Section" enabled={homePage.craft?.enabled !== false} onChange={(v) => hpUpdate('craft', 'enabled', v)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Field label="Section Label"><TextInput value={homePage.craft?.label} onChange={(v) => hpUpdate('craft', 'label', v)} /></Field>
                  <div />
                  <Field label="Title Line 1"><TextInput value={homePage.craft?.titleLine1} onChange={(v) => hpUpdate('craft', 'titleLine1', v)} /></Field>
                  <Field label="Title Line 2"><TextInput value={homePage.craft?.titleLine2} onChange={(v) => hpUpdate('craft', 'titleLine2', v)} /></Field>
                </div>
                {/* Craft Images */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Process Images (4 recommended)</span>
                    <button onClick={() => hpArrayAdd('craft', 'images', { id: `craft-${Date.now()}`, url: '', alt: 'New image' })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Image</button>
                  </div>
                  {(homePage.craft?.images || []).map((img, i) => (
                    <div key={img.id || i} className="flex items-center gap-2 mb-2">
                      <TextInput value={img.url} onChange={(v) => hpArrayUpdate('craft', 'images', i, 'url', v)} placeholder="Image URL (leave empty for default)" />
                      <TextInput value={img.alt} onChange={(v) => hpArrayUpdate('craft', 'images', i, 'alt', v)} placeholder="Alt text" />
                      <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                        <FiImage className="w-3.5 h-3.5" />
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                          try {
                            toast.loading('Uploading...', { id: `craft-upload-${i}` });
                            const url = await handleUploadImage(file);
                            if (url) hpArrayUpdate('craft', 'images', i, 'url', url);
                            toast.success('Uploaded!', { id: `craft-upload-${i}` });
                          } catch { toast.error('Upload failed', { id: `craft-upload-${i}` }); }
                        }} />
                      </label>
                      <button onClick={() => hpArrayRemove('craft', 'images', i)} className="text-red-400 hover:text-red-600 shrink-0"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                {/* Craft Features */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Features (4 recommended)</span>
                    <button onClick={() => hpArrayAdd('craft', 'features', { num: `0${(homePage.craft?.features?.length || 0) + 1}`, name: 'Feature Name', desc: 'Description' })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Feature</button>
                  </div>
                  {(homePage.craft?.features || []).map((f, i) => (
                    <div key={i} className="grid grid-cols-[60px_1fr_2fr_auto] gap-2 mb-2 items-start">
                      <TextInput value={f.num} onChange={(v) => hpArrayUpdate('craft', 'features', i, 'num', v)} placeholder="01" />
                      <TextInput value={f.name} onChange={(v) => hpArrayUpdate('craft', 'features', i, 'name', v)} placeholder="Name" />
                      <TextInput value={f.desc} onChange={(v) => hpArrayUpdate('craft', 'features', i, 'desc', v)} placeholder="Description" />
                      <button onClick={() => hpArrayRemove('craft', 'features', i)} className="text-red-400 hover:text-red-600 mt-2"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* ── Heritage / Agra ── */}
              <CollapsibleSection title="Heritage / Agra" icon="🏛️" badge={homePage.heritage?.enabled !== false ? 'ON' : 'OFF'}>
                <SectionToggle label="Enable Heritage Section" enabled={homePage.heritage?.enabled !== false} onChange={(v) => hpUpdate('heritage', 'enabled', v)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Field label="Section Label"><TextInput value={homePage.heritage?.label} onChange={(v) => hpUpdate('heritage', 'label', v)} /></Field>
                  <Field label="Image URL" hint="Upload or paste URL">
                    <div className="flex gap-2">
                      <TextInput value={homePage.heritage?.image} onChange={(v) => hpUpdate('heritage', 'image', v)} placeholder="https://... or leave blank" />
                      <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                        <FiImage className="w-3.5 h-3.5" /> Upload
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                          try {
                            toast.loading('Uploading...', { id: 'heritage-upload' });
                            const url = await handleUploadImage(file);
                            if (url) hpUpdate('heritage', 'image', url);
                            toast.success('Uploaded!', { id: 'heritage-upload' });
                          } catch { toast.error('Upload failed', { id: 'heritage-upload' }); }
                        }} />
                      </label>
                    </div>
                  </Field>
                  <Field label="Title Line 1"><TextInput value={homePage.heritage?.titleLine1} onChange={(v) => hpUpdate('heritage', 'titleLine1', v)} /></Field>
                  <Field label="Title Line 2 (italic)"><TextInput value={homePage.heritage?.titleLine2} onChange={(v) => hpUpdate('heritage', 'titleLine2', v)} /></Field>
                  <div className="md:col-span-2">
                    <Field label="Description"><TextArea value={homePage.heritage?.description} onChange={(v) => hpUpdate('heritage', 'description', v)} rows={4} /></Field>
                  </div>
                </div>
                {/* Heritage Points */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Heritage Points</span>
                    <button onClick={() => hpArrayAdd('heritage', 'points', { icon: '✨', title: 'New Point', desc: 'Description' })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Point</button>
                  </div>
                  {(homePage.heritage?.points || []).map((pt, i) => (
                    <div key={i} className="grid grid-cols-[50px_1fr_2fr_auto] gap-2 mb-2 items-start">
                      <TextInput value={pt.icon} onChange={(v) => hpArrayUpdate('heritage', 'points', i, 'icon', v)} placeholder="🏛️" />
                      <TextInput value={pt.title} onChange={(v) => hpArrayUpdate('heritage', 'points', i, 'title', v)} placeholder="Title" />
                      <TextInput value={pt.desc} onChange={(v) => hpArrayUpdate('heritage', 'points', i, 'desc', v)} placeholder="Description" />
                      <button onClick={() => hpArrayRemove('heritage', 'points', i)} className="text-red-400 hover:text-red-600 mt-2"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* ── Story ── */}
              <CollapsibleSection title="Our Story" icon="📖" badge={homePage.story?.enabled !== false ? 'ON' : 'OFF'}>
                <SectionToggle label="Enable Story Section" enabled={homePage.story?.enabled !== false} onChange={(v) => hpUpdate('story', 'enabled', v)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Field label="Section Label"><TextInput value={homePage.story?.label} onChange={(v) => hpUpdate('story', 'label', v)} /></Field>
                  <Field label="Image URL" hint="Upload or paste URL">
                    <div className="flex gap-2">
                      <TextInput value={homePage.story?.image} onChange={(v) => hpUpdate('story', 'image', v)} placeholder="https://... or leave blank" />
                      <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                        <FiImage className="w-3.5 h-3.5" /> Upload
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                          try {
                            toast.loading('Uploading...', { id: 'story-upload' });
                            const url = await handleUploadImage(file);
                            if (url) hpUpdate('story', 'image', url);
                            toast.success('Uploaded!', { id: 'story-upload' });
                          } catch { toast.error('Upload failed', { id: 'story-upload' }); }
                        }} />
                      </label>
                    </div>
                  </Field>
                  <Field label="Title Line 1"><TextInput value={homePage.story?.titleLine1} onChange={(v) => hpUpdate('story', 'titleLine1', v)} /></Field>
                  <Field label="Title Line 2"><TextInput value={homePage.story?.titleLine2} onChange={(v) => hpUpdate('story', 'titleLine2', v)} /></Field>
                  <Field label="Quote"><TextArea value={homePage.story?.quote} onChange={(v) => hpUpdate('story', 'quote', v)} /></Field>
                  <div>
                    <Field label="CTA Button Text"><TextInput value={homePage.story?.ctaText} onChange={(v) => hpUpdate('story', 'ctaText', v)} /></Field>
                    <div className="mt-3"><Field label="CTA Button Link"><TextInput value={homePage.story?.ctaLink} onChange={(v) => hpUpdate('story', 'ctaLink', v)} /></Field></div>
                  </div>
                </div>
                {/* Story Paragraphs */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paragraphs</span>
                    <button onClick={() => hpUpdate('story', 'paragraphs', [...(homePage.story?.paragraphs || []), ''])} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Paragraph</button>
                  </div>
                  {(homePage.story?.paragraphs || []).map((p, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <TextArea value={p} onChange={(v) => {
                        const arr = [...(homePage.story?.paragraphs || [])];
                        arr[i] = v;
                        hpUpdate('story', 'paragraphs', arr);
                      }} rows={2} />
                      <button onClick={() => hpUpdate('story', 'paragraphs', (homePage.story?.paragraphs || []).filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 mt-2 shrink-0"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* ── Testimonials ── */}
              <CollapsibleSection title="Testimonials" icon="⭐" badge={homePage.testimonials?.enabled !== false ? 'ON' : 'OFF'}>
                <SectionToggle label="Enable Testimonials" enabled={homePage.testimonials?.enabled !== false} onChange={(v) => hpUpdate('testimonials', 'enabled', v)} />
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Testimonial Items</span>
                    <button onClick={() => hpArrayAdd('testimonials', 'items', { id: `t-${Date.now()}`, text: 'Customer quote...', author: 'Name, City', rating: 5 })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Testimonial</button>
                  </div>
                  {(homePage.testimonials?.items || []).map((t, i) => (
                    <div key={t.id || i} className="border border-gray-100 rounded-lg p-4 mb-3 space-y-2 bg-gray-50/40">
                      <TextArea value={t.text} onChange={(v) => hpArrayUpdate('testimonials', 'items', i, 'text', v)} placeholder="Customer testimonial text" />
                      <div className="grid grid-cols-[1fr_80px_auto] gap-2 items-center">
                        <TextInput value={t.author} onChange={(v) => hpArrayUpdate('testimonials', 'items', i, 'author', v)} placeholder="Author Name, City" />
                        <input type="number" min={1} max={5}
                          className="px-2 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                          value={t.rating || 5}
                          onChange={(e) => hpArrayUpdate('testimonials', 'items', i, 'rating', parseInt(e.target.value) || 5)}
                        />
                        <button onClick={() => hpArrayRemove('testimonials', 'items', i)} className="text-red-400 hover:text-red-600"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* ── CTA Banner ── */}
              <CollapsibleSection title="CTA Banner" icon="🎯" badge={homePage.ctaBanner?.enabled !== false ? 'ON' : 'OFF'}>
                <SectionToggle label="Enable CTA Banner" enabled={homePage.ctaBanner?.enabled !== false} onChange={(v) => hpUpdate('ctaBanner', 'enabled', v)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Field label="Title Line 1"><TextInput value={homePage.ctaBanner?.titleLine1} onChange={(v) => hpUpdate('ctaBanner', 'titleLine1', v)} /></Field>
                  <Field label="Title Line 2 (italic)"><TextInput value={homePage.ctaBanner?.titleLine2} onChange={(v) => hpUpdate('ctaBanner', 'titleLine2', v)} /></Field>
                  <div className="md:col-span-2">
                    <Field label="Subtitle"><TextArea value={homePage.ctaBanner?.subtitle} onChange={(v) => hpUpdate('ctaBanner', 'subtitle', v)} rows={2} /></Field>
                  </div>
                  <Field label="Primary Button Text"><TextInput value={homePage.ctaBanner?.primaryButtonText} onChange={(v) => hpUpdate('ctaBanner', 'primaryButtonText', v)} /></Field>
                  <Field label="Primary Button Link"><TextInput value={homePage.ctaBanner?.primaryButtonLink} onChange={(v) => hpUpdate('ctaBanner', 'primaryButtonLink', v)} /></Field>
                  <Field label="Secondary Button Text"><TextInput value={homePage.ctaBanner?.secondaryButtonText} onChange={(v) => hpUpdate('ctaBanner', 'secondaryButtonText', v)} /></Field>
                  <Field label="Secondary Button Link"><TextInput value={homePage.ctaBanner?.secondaryButtonLink} onChange={(v) => hpUpdate('ctaBanner', 'secondaryButtonLink', v)} /></Field>
                </div>
              </CollapsibleSection>

              {/* ── Bottom Save ── */}
              <div className="flex justify-end pt-2">
                <SaveButton onClick={() => save('homePage', homePage, 'Homepage')} saving={saving} label="Save All Homepage Changes" />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              BRANDING TAB
              ══════════════════════════════════════════════════════ */}
          {activeTab === 'branding' && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Branding</h3>
              <div className="space-y-4">
                <Field label="Site Name"><TextInput value={branding.siteName} onChange={(v) => setBranding(prev => ({ ...prev, siteName: v }))} /></Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Logo URL"><TextInput value={branding.logo?.url} onChange={(v) => setBranding(prev => ({ ...prev, logo: { ...prev.logo, url: v } }))} placeholder="https://..." /></Field>
                  <Field label="Favicon URL"><TextInput value={branding.favicon?.url} onChange={(v) => setBranding(prev => ({ ...prev, favicon: { ...prev.favicon, url: v } }))} placeholder="https://..." /></Field>
                </div>
              </div>
              <div className="pt-6 border-t mt-6 flex justify-end">
                <SaveButton onClick={() => save('branding', branding, 'Branding')} saving={saving} />
              </div>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════
              BANNERS TAB
              ══════════════════════════════════════════════════════ */}
          {activeTab === 'banners' && (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Banners</h3>
                <button onClick={handleAddBanner} className="text-sm text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-4 h-4" /> Add Banner</button>
              </div>
              <div className="space-y-4">
                {(banners || []).map((banner, i) => (
                  <div key={banner.id || i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                    {/* Banner image preview & upload */}
                    <div className="flex items-start gap-4">
                      <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 group">
                        {(banner._preview || banner.imageUrl || banner.image) ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={banner._preview || banner.imageUrl || banner.image} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <label className="cursor-pointer text-white text-xs font-medium px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                                Change
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                                  const preview = URL.createObjectURL(file);
                                  handleBannerChange(i, '_file', file);
                                  handleBannerChange(i, '_preview', preview);
                                  handleBannerChange(i, '_isNew', true);
                                }} />
                              </label>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <FiImage className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-[10px] text-gray-400 font-medium">Upload Image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                              const preview = URL.createObjectURL(file);
                              handleBannerChange(i, '_file', file);
                              handleBannerChange(i, '_preview', preview);
                              handleBannerChange(i, '_isNew', true);
                            }} />
                          </label>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <TextInput value={banner.imageUrl || banner.image} onChange={(v) => { handleBannerChange(i, 'imageUrl', v); handleBannerChange(i, 'image', v); }} placeholder="Or paste image URL" />
                        <p className="text-[10px] text-gray-400">Upload an image or paste a direct URL above.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <TextInput value={banner.title} onChange={(v) => handleBannerChange(i, 'title', v)} placeholder="Banner title" />
                      <TextInput value={banner.subtitle || banner.description} onChange={(v) => { handleBannerChange(i, 'subtitle', v); handleBannerChange(i, 'description', v); }} placeholder="Subtitle" />
                      <TextInput value={banner.link || banner.buttonLink} onChange={(v) => { handleBannerChange(i, 'link', v); handleBannerChange(i, 'buttonLink', v); }} placeholder="Link" />
                      <TextInput value={banner.buttonText} onChange={(v) => handleBannerChange(i, 'buttonText', v)} placeholder="Button text" />
                      <SectionToggle label="Active" enabled={banner.isActive !== false} onChange={(v) => handleBannerChange(i, 'isActive', v)} />
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                      <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => handleMoveBanner(i, -1)} disabled={i === 0}><FiArrowUp /></button>
                      <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => handleMoveBanner(i, 1)} disabled={i === banners.length - 1}><FiArrowDown /></button>
                      <button className="text-xs text-red-400 hover:text-red-600 ml-auto flex items-center gap-1" onClick={() => handleRemoveBanner(i)}><FiTrash2 className="w-3 h-3" /> Remove</button>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No banners yet. Click &ldquo;Add Banner&rdquo; to create one.</p>}
              </div>
              <div className="pt-6 border-t mt-6 flex justify-end">
                <SaveButton onClick={async () => {
                  try {
                    setSaving(true);
                    const updated = [...banners];
                    for (let i = 0; i < updated.length; i++) {
                      if (updated[i]._file) {
                        const url = await handleUploadImage(updated[i]._file);
                        updated[i].imageUrl = url;
                        delete updated[i]._file; delete updated[i]._preview; delete updated[i]._isNew;
                      }
                    }
                    await adminAPI.updateSettings({ banners: updated });
                    toast.success('Banners saved!');
                    setBanners(updated);
                    refreshSettings();
                  } catch (e) { toast.error('Failed to save banners'); }
                  finally { setSaving(false); }
                }} saving={saving} label="Save Banners" />
              </div>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════
              ANNOUNCEMENT TAB
              ══════════════════════════════════════════════════════ */}
          {activeTab === 'announcement' && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Announcement Bar</h3>
              <p className="text-sm text-gray-500 mb-6">Top-of-page banner shown to all visitors.</p>
              <div className="space-y-4">
                <SectionToggle label="Enable Announcement Bar" enabled={announcementBar.enabled !== false} onChange={(v) => setAnnouncementBar(prev => ({ ...prev, enabled: v }))} />
                <Field label="Text"><TextInput value={announcementBar.text} onChange={(v) => setAnnouncementBar(prev => ({ ...prev, text: v }))} placeholder="Free shipping on all orders above ₹999" /></Field>
                <Field label="Optional Link"><TextInput value={announcementBar.link} onChange={(v) => setAnnouncementBar(prev => ({ ...prev, link: v }))} placeholder="/products" /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Background Color">
                    <input type="color" value={announcementBar.backgroundColor || '#10b981'} onChange={(e) => setAnnouncementBar(prev => ({ ...prev, backgroundColor: e.target.value }))} className="h-10 w-16 border border-gray-200 rounded-lg cursor-pointer" />
                  </Field>
                  <Field label="Text Color">
                    <input type="color" value={announcementBar.textColor || '#ffffff'} onChange={(e) => setAnnouncementBar(prev => ({ ...prev, textColor: e.target.value }))} className="h-10 w-16 border border-gray-200 rounded-lg cursor-pointer" />
                  </Field>
                </div>
                <SectionToggle label="Allow users to dismiss" enabled={announcementBar.dismissible !== false} onChange={(v) => setAnnouncementBar(prev => ({ ...prev, dismissible: v }))} />
              </div>
              <div className="pt-6 border-t mt-6 flex justify-end">
                <SaveButton onClick={() => save('announcementBar', announcementBar, 'Announcement')} saving={saving} />
              </div>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════
              THEME TAB
              ══════════════════════════════════════════════════════ */}
          {activeTab === 'theme' && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Theme Colors</h3>
              <p className="text-sm text-gray-500 mb-6">Control every color across your storefront. Changes apply site-wide instantly.</p>

              {/* Core Brand Colors */}
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Brand Colors</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                  { key: 'primaryColor', label: 'Primary', def: '#3B2F2F' },
                  { key: 'secondaryColor', label: 'Secondary', def: '#E5D3B3' },
                  { key: 'accentColor', label: 'Accent / Gold', def: '#c9a96e' },
                  { key: 'accentHoverColor', label: 'Accent Hover', def: '#a07840' },
                ].map(c => (
                  <Field key={c.key} label={c.label}>
                    <div className="flex items-center gap-2">
                      <input type="color" className="h-10 w-10 border border-gray-200 rounded-lg cursor-pointer flex-shrink-0"
                        value={advancedSettings.theme?.[c.key] || c.def}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, theme: { ...prev.theme, [c.key]: e.target.value } }))}
                      />
                      <input type="text" className="flex-1 text-xs font-mono border border-gray-200 rounded px-2 py-1.5"
                        value={advancedSettings.theme?.[c.key] || c.def}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, theme: { ...prev.theme, [c.key]: e.target.value } }))}
                      />
                    </div>
                  </Field>
                ))}
              </div>

              {/* Text Colors */}
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Text Colors</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                  { key: 'textColor', label: 'Headings', def: '#1c1917' },
                  { key: 'bodyTextColor', label: 'Body Text', def: '#8a7460' },
                  { key: 'mutedTextColor', label: 'Muted Text', def: '#5c3d1e' },
                ].map(c => (
                  <Field key={c.key} label={c.label}>
                    <div className="flex items-center gap-2">
                      <input type="color" className="h-10 w-10 border border-gray-200 rounded-lg cursor-pointer flex-shrink-0"
                        value={advancedSettings.theme?.[c.key] || c.def}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, theme: { ...prev.theme, [c.key]: e.target.value } }))}
                      />
                      <input type="text" className="flex-1 text-xs font-mono border border-gray-200 rounded px-2 py-1.5"
                        value={advancedSettings.theme?.[c.key] || c.def}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, theme: { ...prev.theme, [c.key]: e.target.value } }))}
                      />
                    </div>
                  </Field>
                ))}
              </div>

              {/* Background & Border Colors */}
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Backgrounds & Borders</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                  { key: 'backgroundColor', label: 'Page Background', def: '#fafaf9' },
                  { key: 'subtleBgColor', label: 'Subtle Background', def: '#f2ede4' },
                  { key: 'borderColor', label: 'Border / Divider', def: '#e8e0d0' },
                ].map(c => (
                  <Field key={c.key} label={c.label}>
                    <div className="flex items-center gap-2">
                      <input type="color" className="h-10 w-10 border border-gray-200 rounded-lg cursor-pointer flex-shrink-0"
                        value={advancedSettings.theme?.[c.key] || c.def}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, theme: { ...prev.theme, [c.key]: e.target.value } }))}
                      />
                      <input type="text" className="flex-1 text-xs font-mono border border-gray-200 rounded px-2 py-1.5"
                        value={advancedSettings.theme?.[c.key] || c.def}
                        onChange={(e) => setAdvancedSettings(prev => ({ ...prev, theme: { ...prev.theme, [c.key]: e.target.value } }))}
                      />
                    </div>
                  </Field>
                ))}
              </div>

              {/* Live Preview */}
              <div className="border border-gray-200 rounded-xl p-6 mb-6" style={{
                backgroundColor: advancedSettings.theme?.backgroundColor || '#fafaf9',
                color: advancedSettings.theme?.textColor || '#1c1917'
              }}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Live Preview</p>
                <h4 className="text-lg font-bold mb-1" style={{ color: advancedSettings.theme?.textColor || '#1c1917' }}>Heading Text</h4>
                <p className="text-sm mb-3" style={{ color: advancedSettings.theme?.bodyTextColor || '#8a7460' }}>Body text appears in this color. Showcasing how your content will look.</p>
                <p className="text-xs mb-4" style={{ color: advancedSettings.theme?.mutedTextColor || '#5c3d1e' }}>Muted text for secondary information.</p>
                <div className="flex gap-3">
                  <span className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: advancedSettings.theme?.primaryColor || '#3B2F2F' }}>Primary Button</span>
                  <span className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: advancedSettings.theme?.accentColor || '#c9a96e', color: '#fff' }}>Accent Button</span>
                  <span className="px-4 py-2 rounded-lg text-sm font-medium border" style={{
                    borderColor: advancedSettings.theme?.borderColor || '#e8e0d0',
                    backgroundColor: advancedSettings.theme?.subtleBgColor || '#f2ede4',
                    color: advancedSettings.theme?.textColor || '#1c1917'
                  }}>Subtle</span>
                </div>
              </div>

              <div className="pt-6 border-t flex justify-end">
                <SaveButton onClick={() => saveAdvanced('theme', advancedSettings.theme || {})} saving={saving} />
              </div>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════
              ABOUT PAGE TAB
              ══════════════════════════════════════════════════════ */}
          {activeTab === 'about' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">About Page</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Manage images and visual content for the About page.</p>
                  </div>
                  <SaveButton onClick={() => saveAdvanced('aboutPage', advancedSettings.aboutPage || {})} saving={saving} />
                </div>
              </Card>

              <CollapsibleSection title="Hero Banner Image" icon="🖼️" defaultOpen>
                <Field label="Hero Image URL" hint="Large banner image at the top of the About page. Upload or paste URL.">
                  <div className="flex gap-2">
                    <TextInput value={advancedSettings.aboutPage?.heroImage} onChange={(v) => setAdvancedSettings(prev => ({ ...prev, aboutPage: { ...prev.aboutPage, heroImage: v } }))} placeholder="https://... or leave blank for default" />
                    <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                      <FiImage className="w-3.5 h-3.5" /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                        try {
                          toast.loading('Uploading...', { id: 'about-hero-upload' });
                          const url = await handleUploadImage(file);
                          if (url) setAdvancedSettings(prev => ({ ...prev, aboutPage: { ...prev.aboutPage, heroImage: url } }));
                          toast.success('Uploaded!', { id: 'about-hero-upload' });
                        } catch { toast.error('Upload failed', { id: 'about-hero-upload' }); }
                      }} />
                    </label>
                  </div>
                </Field>
                {advancedSettings.aboutPage?.heroImage && (
                  <div className="mt-3 relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={advancedSettings.aboutPage.heroImage} alt="About hero preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </CollapsibleSection>

              <CollapsibleSection title="Story Section Image" icon="📖" defaultOpen>
                <Field label="Story Image URL" hint="Image shown alongside the Our Story text. Upload or paste URL.">
                  <div className="flex gap-2">
                    <TextInput value={advancedSettings.aboutPage?.storyImage} onChange={(v) => setAdvancedSettings(prev => ({ ...prev, aboutPage: { ...prev.aboutPage, storyImage: v } }))} placeholder="https://... or leave blank for default" />
                    <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                      <FiImage className="w-3.5 h-3.5" /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                        try {
                          toast.loading('Uploading...', { id: 'about-story-upload' });
                          const url = await handleUploadImage(file);
                          if (url) setAdvancedSettings(prev => ({ ...prev, aboutPage: { ...prev.aboutPage, storyImage: url } }));
                          toast.success('Uploaded!', { id: 'about-story-upload' });
                        } catch { toast.error('Upload failed', { id: 'about-story-upload' }); }
                      }} />
                    </label>
                  </div>
                </Field>
                {advancedSettings.aboutPage?.storyImage && (
                  <div className="mt-3 relative w-48 h-36 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={advancedSettings.aboutPage.storyImage} alt="About story preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </CollapsibleSection>

              <div className="flex justify-end pt-2">
                <SaveButton onClick={() => saveAdvanced('aboutPage', advancedSettings.aboutPage || {})} saving={saving} label="Save About Page" />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              POLICIES TAB
              ══════════════════════════════════════════════════════ */}
          {activeTab === 'policies' && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Policies & Pages</h3>
                  <p className="text-sm text-gray-500">Edit structured JSON content for site pages.</p>
                </div>
                <div className="flex gap-2">
                  <select value={selectedPolicy} onChange={(e) => setSelectedPolicy(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
                    <option value="shippingPolicy">Shipping Policy</option>
                    <option value="returnsPolicy">Returns Policy</option>
                    <option value="aboutPage">About Page</option>
                    <option value="faqPage">FAQ Page</option>
                    <option value="footerContent">Footer Content</option>
                  </select>
                  <SaveButton onClick={() => {
                    try {
                      const val = JSON.parse(document.getElementById('policy-editor').value);
                      saveAdvanced(selectedPolicy, val);
                    } catch { toast.error('Invalid JSON'); }
                  }} saving={saving} label="Save" />
                </div>
              </div>
              <textarea
                id="policy-editor"
                className="w-full h-[500px] font-mono text-xs p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white transition-colors outline-none"
                defaultValue={JSON.stringify(advancedSettings[selectedPolicy] || {}, null, 2)}
                key={selectedPolicy}
                spellCheck={false}
              />
              <p className="text-xs text-gray-400 mt-2">Be careful editing JSON — ensure valid structure with correct quotes and commas.</p>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════
              CONTACT TAB
              ══════════════════════════════════════════════════════ */}
          {activeTab === 'contact' && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field label="Business Address"><TextArea value={advancedSettings.contactInfo?.address} onChange={(v) => setAdvancedSettings(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, address: v } }))} /></Field>
                </div>
                <Field label="Phone"><TextInput value={advancedSettings.contactInfo?.phone} onChange={(v) => setAdvancedSettings(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, phone: v } }))} /></Field>
                <Field label="Email"><TextInput value={advancedSettings.contactInfo?.email} onChange={(v) => setAdvancedSettings(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, email: v } }))} /></Field>
                <div className="md:col-span-2 flex gap-6 pt-2">
                  {['showAddress', 'showPhone', 'showEmail'].map(k => (
                    <SectionToggle key={k} label={k.replace('show', 'Show ')} enabled={advancedSettings.contactInfo?.[k] ?? true} onChange={(v) => setAdvancedSettings(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, [k]: v } }))} />
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t mt-6 flex justify-end">
                <SaveButton onClick={() => saveAdvanced('contactInfo', advancedSettings.contactInfo)} saving={saving} />
              </div>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════
              SYSTEM TAB
              ══════════════════════════════════════════════════════ */}
          {activeTab === 'system' && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-6">System</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Maintenance Mode</h4>
                  <p className="text-xs text-gray-500">Temporarily disable the storefront.</p>
                </div>
                <SectionToggle label="" enabled={advancedSettings.maintenanceMode?.enabled ?? false} onChange={(v) => setAdvancedSettings(prev => ({ ...prev, maintenanceMode: { ...prev.maintenanceMode, enabled: v } }))} />
              </div>
              {advancedSettings.maintenanceMode?.enabled && (
                <div className="mt-4">
                  <Field label="Maintenance Message"><TextArea value={advancedSettings.maintenanceMode?.message} onChange={(v) => setAdvancedSettings(prev => ({ ...prev, maintenanceMode: { ...prev.maintenanceMode, message: v } }))} rows={2} /></Field>
                </div>
              )}
              <div className="pt-6 border-t mt-6 flex justify-end">
                <SaveButton onClick={() => saveAdvanced('maintenanceMode', advancedSettings.maintenanceMode)} saving={saving} />
              </div>
            </Card>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}

