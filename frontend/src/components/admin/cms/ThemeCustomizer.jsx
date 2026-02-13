
import { useState, useEffect } from 'react';
import { FiType, FiDroplet, FiSquare } from 'react-icons/fi';
import ColorPicker from '@/components/ColorPicker'; // Reuse existing if suitable or create new simple one

const FONT_OPTIONS = [
    { label: 'Inter (Sans)', value: 'var(--font-inter)' },
    { label: 'Roboto (Sans)', value: 'Roboto, sans-serif' },
    { label: 'Playfair (Serif)', value: 'Playfair Display, serif' },
];

const RADIUS_OPTIONS = [
    { label: 'Sharp (0px)', value: '0px' },
    { label: 'Soft (4px)', value: '0.25rem' },
    { label: 'Rounded (8px)', value: '0.5rem' },
    { label: 'Pill (20px)', value: '1.25rem' },
];

export default function ThemeCustomizer({ theme, onChange }) {
    const [localTheme, setLocalTheme] = useState(theme || {
        primaryColor: '#3B2F2F',
        secondaryColor: '#E5D3B3',
        fontFamily: 'var(--font-inter)',
        borderRadius: '0.5rem',
    });

    const handleChange = (key, value) => {
        const updated = { ...localTheme, [key]: value };
        setLocalTheme(updated);
        onChange(updated);
    };

    return (
        <div className="p-4 space-y-6">
            {/* Colors */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FiDroplet /> Brand Colors
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Primary Color</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={localTheme.primaryColor}
                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                            />
                            <span className="text-xs text-gray-500 font-mono">{localTheme.primaryColor}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Typography */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FiType /> Typography
                </h3>
                <div className="space-y-3">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Body Font</label>
                    <select
                        value={localTheme.fontFamily}
                        onChange={(e) => handleChange('fontFamily', e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        {FONT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Shape */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FiSquare /> Shape
                </h3>
                <div className="space-y-3">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Corner Radius</label>
                    <div className="grid grid-cols-2 gap-2">
                        {RADIUS_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleChange('borderRadius', opt.value)}
                                className={`px-3 py-2 text-xs border rounded-md transition-all ${localTheme.borderRadius === opt.value
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
