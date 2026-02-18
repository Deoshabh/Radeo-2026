'use client';

import { useSettingsData } from '@/hooks/useSettingsData';
import { Card, SectionToggle, Field, TextInput, TextArea, SaveButton } from '@/components/admin/settings/SettingsUI';

export default function ContactSettings() {
  const { authLoading, loading, saving, advancedSettings, setAdvancedSettings, saveAdvanced } = useSettingsData();

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

  return (
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
  );
}
