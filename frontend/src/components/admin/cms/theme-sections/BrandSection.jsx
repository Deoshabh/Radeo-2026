
import React from 'react';
import React from 'react';
import ImageUploader from '../ImageUploader';

// Simple color picker component if not available globally
const ColorInput = ({ label, value, onChange }) => {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{label}</label>
            <div className="flex gap-2 items-center">
                <div className="relative group">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-200 cursor-pointer opacity-0 absolute inset-0 z-10"
                    />
                    <div
                        className="w-8 h-8 rounded border border-gray-200"
                        style={{ backgroundColor: value }}
                    />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded font-mono uppercase"
                    maxLength={7}
                />
            </div>
        </div>
    );
};

export default function BrandSection({ branding, theme, onBrandingChange, onThemeChange }) {

    const handleBranding = (key, val) => {
        // Deep merge helper not strictly needed with simple structure
        if (key === 'logo' || key === 'favicon') {
            onBrandingChange({ ...branding, [key]: { ...(branding[key] || {}), url: val } });
        } else {
            onBrandingChange({ ...branding, [key]: val });
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    Assets
                </h4>
                <ImageUploader
                    label="Site Logo"
                    value={branding.logo?.url || ''}
                    onChange={(url) => handleBranding('logo', url)}
                />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                        <input
                            type="number"
                            value={branding.logo?.width || 120}
                            onChange={(e) => onBrandingChange({ ...branding, logo: { ...(branding.logo || {}), width: parseInt(e.target.value) } })}
                            className="w-full text-xs border-gray-200 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                        <input
                            type="number"
                            value={branding.logo?.height || 40}
                            onChange={(e) => onBrandingChange({ ...branding, logo: { ...(branding.logo || {}), height: parseInt(e.target.value) } })}
                            className="w-full text-xs border-gray-200 rounded"
                        />
                    </div>
                </div>

                <ImageUploader
                    label="Favicon"
                    value={branding.favicon?.url || ''}
                    onChange={(url) => handleBranding('favicon', url)}
                />
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    Colors
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <ColorInput
                        label="Primary"
                        value={theme.primaryColor || '#000000'}
                        onChange={(v) => onThemeChange('primaryColor', v)}
                    />
                    <ColorInput
                        label="Secondary"
                        value={theme.secondaryColor || '#ffffff'}
                        onChange={(v) => onThemeChange('secondaryColor', v)}
                    />
                    <ColorInput
                        label="Background"
                        value={theme.backgroundColor || '#ffffff'}
                        onChange={(v) => onThemeChange('backgroundColor', v)}
                    />
                    <ColorInput
                        label="Text"
                        value={theme.textColor || '#111827'}
                        onChange={(v) => onThemeChange('textColor', v)}
                    />
                </div>
            </div>
        </div>
    );
}
