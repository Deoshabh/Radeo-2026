'use client';

import { useSettingsData } from '@/hooks/useSettingsData';
import { Card, CollapsibleSection, Field, TextInput, SaveButton } from '@/components/admin/settings/SettingsUI';
import { FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AboutSettings() {
  const { authLoading, loading, saving, advancedSettings, setAdvancedSettings, handleUploadImage, saveAdvanced } = useSettingsData();

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

  const UploadButton = ({ onUpload, toastId }) => (
    <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
      <FiImage className="w-3.5 h-3.5" /> Upload
      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
        try {
          toast.loading('Uploading...', { id: toastId });
          const url = await handleUploadImage(file);
          if (url) onUpload(url);
          toast.success('Uploaded!', { id: toastId });
        } catch { toast.error('Upload failed', { id: toastId }); }
      }} />
    </label>
  );

  return (
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
            <UploadButton onUpload={(url) => setAdvancedSettings(prev => ({ ...prev, aboutPage: { ...prev.aboutPage, heroImage: url } }))} toastId="about-hero-upload" />
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
            <UploadButton onUpload={(url) => setAdvancedSettings(prev => ({ ...prev, aboutPage: { ...prev.aboutPage, storyImage: url } }))} toastId="about-story-upload" />
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
  );
}
