'use client';

import { useSettingsData } from '@/hooks/useSettingsData';
import { Card, SectionToggle, TextInput, SaveButton } from '@/components/admin/settings/SettingsUI';
import { FiImage, FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BannersSettings() {
  const {
    authLoading, loading, saving, setSaving,
    banners, setBanners,
    handleUploadImage, refreshSettings,
  } = useSettingsData();

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  // Local banner helpers
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

  const handleSaveBanners = async () => {
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
      const { adminAPI } = await import('@/utils/api');
      await adminAPI.updateSettings({ banners: updated });
      toast.success('Banners saved!');
      setBanners(updated);
      refreshSettings();
    } catch (e) {
      toast.error('Failed to save banners');
    } finally {
      setSaving(false);
    }
  };

  return (
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
        <SaveButton onClick={handleSaveBanners} saving={saving} label="Save Banners" />
      </div>
    </Card>
  );
}
