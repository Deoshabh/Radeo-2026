'use client';

import { useSettingsData } from '@/hooks/useSettingsData';
import { Card, SectionToggle, Field, TextInput, SaveButton } from '@/components/admin/settings/SettingsUI';

export default function AnnouncementSettings() {
  const { authLoading, loading, saving, announcementBar, setAnnouncementBar, save } = useSettingsData();

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
  );
}
