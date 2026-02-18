'use client';

import { useSettingsData } from '@/hooks/useSettingsData';
import { Card, Field, SaveButton } from '@/components/admin/settings/SettingsUI';

export default function ThemeSettings() {
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

  const ColorField = ({ colorKey, label, def }) => (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" className="h-10 w-10 border border-gray-200 rounded-lg cursor-pointer flex-shrink-0"
          value={advancedSettings.theme?.[colorKey] || def}
          onChange={(e) => setAdvancedSettings(prev => ({ ...prev, theme: { ...prev.theme, [colorKey]: e.target.value } }))}
        />
        <input type="text" className="flex-1 text-xs font-mono border border-gray-200 rounded px-2 py-1.5"
          value={advancedSettings.theme?.[colorKey] || def}
          onChange={(e) => setAdvancedSettings(prev => ({ ...prev, theme: { ...prev.theme, [colorKey]: e.target.value } }))}
        />
      </div>
    </Field>
  );

  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Theme Colors</h3>
      <p className="text-sm text-gray-500 mb-6">Control every color across your storefront. Changes apply site-wide instantly.</p>

      {/* Core Brand Colors */}
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Brand Colors</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <ColorField colorKey="primaryColor" label="Primary" def="#3B2F2F" />
        <ColorField colorKey="secondaryColor" label="Secondary" def="#E5D3B3" />
        <ColorField colorKey="accentColor" label="Accent / Gold" def="#c9a96e" />
        <ColorField colorKey="accentHoverColor" label="Accent Hover" def="#a07840" />
      </div>

      {/* Text Colors */}
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Text Colors</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <ColorField colorKey="textColor" label="Headings" def="#1c1917" />
        <ColorField colorKey="bodyTextColor" label="Body Text" def="#8a7460" />
        <ColorField colorKey="mutedTextColor" label="Muted Text" def="#5c3d1e" />
      </div>

      {/* Backgrounds & Borders */}
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Backgrounds & Borders</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <ColorField colorKey="backgroundColor" label="Page Background" def="#fafaf9" />
        <ColorField colorKey="subtleBgColor" label="Subtle Background" def="#f2ede4" />
        <ColorField colorKey="borderColor" label="Border / Divider" def="#e8e0d0" />
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
  );
}
