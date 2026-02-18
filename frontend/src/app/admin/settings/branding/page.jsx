'use client';

import { useSettingsData } from '@/hooks/useSettingsData';
import { Card, Field, TextInput, SaveButton } from '@/components/admin/settings/SettingsUI';
import { FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BrandingSettings() {
  const { authLoading, loading, saving, branding, setBranding, handleUploadImage, save } = useSettingsData();

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

  const ImageUploader = ({ current, onChange, accept = 'image/*', maxSize = 5, toastId, label, previewClass = 'w-32 h-20' }) => (
    <div className="flex items-start gap-4">
      <div className={`relative ${previewClass} rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0 group`}>
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt={label} className="w-full h-full object-contain p-1" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <label className="cursor-pointer text-white text-xs font-medium px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                Change
                <input type="file" accept={accept} className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > maxSize * 1024 * 1024) { toast.error(`Image must be under ${maxSize}MB`); return; }
                  try {
                    toast.loading('Uploading...', { id: toastId });
                    const url = await handleUploadImage(file);
                    if (url) onChange(url);
                    toast.success('Uploaded!', { id: toastId });
                  } catch { toast.error('Upload failed', { id: toastId }); }
                }} />
              </label>
            </div>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
            <FiImage className="w-5 h-5 text-gray-400 mb-1" />
            <span className="text-[10px] text-gray-400 font-medium">Upload {label}</span>
            <input type="file" accept={accept} className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > maxSize * 1024 * 1024) { toast.error(`Image must be under ${maxSize}MB`); return; }
              try {
                toast.loading('Uploading...', { id: toastId });
                const url = await handleUploadImage(file);
                if (url) onChange(url);
                toast.success('Uploaded!', { id: toastId });
              } catch { toast.error('Upload failed', { id: toastId }); }
            }} />
          </label>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 mb-6">Branding</h3>
      <div className="space-y-6">
        <Field label="Site Name">
          <TextInput value={branding.siteName} onChange={(v) => setBranding(prev => ({ ...prev, siteName: v }))} />
        </Field>

        {/* Logo */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Logo</label>
          <div className="flex items-start gap-4">
            <ImageUploader
              current={branding.logo?.url}
              onChange={(url) => setBranding(prev => ({ ...prev, logo: { ...prev.logo, url } }))}
              toastId="logo-upload"
              label="Logo"
            />
            <div className="flex-1 space-y-2">
              <TextInput value={branding.logo?.url} onChange={(v) => setBranding(prev => ({ ...prev, logo: { ...prev.logo, url: v } }))} placeholder="Or paste logo URL" />
              <TextInput value={branding.logo?.alt} onChange={(v) => setBranding(prev => ({ ...prev, logo: { ...prev.logo, alt: v } }))} placeholder="Alt text (e.g. Radeo Logo)" />
            </div>
          </div>
        </div>

        {/* Favicon */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Favicon</label>
          <div className="flex items-start gap-4">
            <ImageUploader
              current={branding.favicon?.url}
              onChange={(url) => setBranding(prev => ({ ...prev, favicon: { ...prev.favicon, url } }))}
              accept="image/x-icon,image/png,image/svg+xml,image/webp,image/*"
              maxSize={2}
              toastId="favicon-upload"
              label="Favicon"
              previewClass="w-16 h-16"
            />
            <div className="flex-1 space-y-2">
              <TextInput value={branding.favicon?.url} onChange={(v) => setBranding(prev => ({ ...prev, favicon: { ...prev.favicon, url: v } }))} placeholder="Or paste favicon URL" />
              <p className="text-[10px] text-gray-400">Recommended: 32x32 or 64x64 PNG/ICO. Upload or paste a URL.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="pt-6 border-t mt-6 flex justify-end">
        <SaveButton onClick={() => save('branding', branding, 'Branding')} saving={saving} />
      </div>
    </Card>
  );
}
