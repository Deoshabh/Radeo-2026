'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { SITE_SETTINGS_DEFAULTS } from '@/constants/siteSettingsDefaults';
import { useAllSettings } from '@/hooks/useAdmin';
import toast from 'react-hot-toast';

/**
 * Shared hook for all settings pages.
 * Provides loading state, save helpers, image upload, and the full settings state.
 */
export function useSettingsData() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { refreshSettings } = useSiteSettings();

  const { data: rawData, isLoading: loading } = useAllSettings();
  const [saving, setSaving] = useState(false);

  // State
  const [branding, setBranding] = useState({ logo: { url: '', alt: 'Logo' }, favicon: { url: '' }, siteName: 'Radeo' });
  const [banners, setBanners] = useState([]);
  const [announcementBar, setAnnouncementBar] = useState({ enabled: true, text: '', link: '', backgroundColor: '#10b981', textColor: '#ffffff', dismissible: true });
  const [homePage, setHomePage] = useState(SITE_SETTINGS_DEFAULTS.homePage);
  const [advancedSettings, setAdvancedSettings] = useState({});

  // Transform server data into local form state when it arrives
  useEffect(() => {
    if (!rawData) return;
    const s = rawData.main.settings;

    const advArray = rawData.advanced.settings || [];
    const adv = Array.isArray(advArray)
      ? advArray.reduce((acc, item) => { if (item?.key) acc[item.key] = item.value; return acc; }, {})
      : advArray;

    setAdvancedSettings({ ...adv, theme: { ...(s.theme || {}), ...(adv.theme || {}) } });
    setBranding(s.branding || { logo: {}, favicon: {}, siteName: '' });
    setBanners(s.banners || s.bannerSystem?.banners || []);
    setAnnouncementBar(s.announcementBar || { enabled: true, text: '', link: '', backgroundColor: '#10b981', textColor: '#ffffff', dismissible: true });

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
  }, [rawData]);

  // Upload
  const handleUploadImage = async (file) => {
    if (!file) return null;
    const { data: rd } = await adminAPI.getUploadUrl({ fileName: file.name, fileType: file.type, folder: 'cms' });
    const uld = rd?.data || rd;
    await fetch(uld.signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    return uld.publicUrl;
  };

  // Save
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
      if (key === 'theme') {
        await adminAPI.updateSettings({ theme: value }).catch(() => {});
      }
      toast.success('Setting saved!');
      setAdvancedSettings(prev => ({ ...prev, [key]: value }));
      refreshSettings();
    } catch (error) {
      console.error(`Save ${key} failed:`, error);
      if (key === 'theme') {
        try {
          await adminAPI.updateSettings({ theme: value });
          toast.success('Theme saved!');
          setAdvancedSettings(prev => ({ ...prev, [key]: value }));
          refreshSettings();
          return;
        } catch (e2) {
          console.error('Fallback theme save also failed:', e2);
        }
      }
      toast.error('Failed to save');
    } finally { setSaving(false); }
  }, [refreshSettings]);

  // Homepage helpers
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

  return {
    authLoading, loading, saving, setSaving,
    branding, setBranding,
    banners, setBanners,
    announcementBar, setAnnouncementBar,
    homePage, setHomePage,
    advancedSettings, setAdvancedSettings,
    handleUploadImage, save, saveAdvanced,
    hpUpdate, hpArrayUpdate, hpArrayAdd, hpArrayRemove,
    refreshSettings,
  };
}
