'use client';

import { useSettingsData } from '@/hooks/useSettingsData';
import { Card, SectionToggle, Field, TextArea, SaveButton } from '@/components/admin/settings/SettingsUI';

export default function SystemSettings() {
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
  );
}
