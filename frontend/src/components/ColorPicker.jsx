'use client';

import { useState } from 'react';
import { FiX, FiPlus, FiCheck } from 'react-icons/fi';

// Predefined color palette
export const PRESET_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Cognac', hex: '#A0522D' },
  { name: 'Mahogany', hex: '#C04000' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Chestnut', hex: '#954535' },
  { name: 'Walnut', hex: '#773F1A' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
];

// Utility function to get color name from hex code
export const getColorName = (hexCode) => {
  if (!hexCode) return 'Unknown';
  
  // Normalize hex code (uppercase, with #)
  const normalizedHex = hexCode.toUpperCase().startsWith('#') ? hexCode.toUpperCase() : `#${hexCode.toUpperCase()}`;
  
  // Find matching preset color
  const preset = PRESET_COLORS.find(c => c.hex.toUpperCase() === normalizedHex);
  if (preset) return preset.name;
  
  // If not found in presets, return hex code
  return hexCode;
};

export default function ColorPicker({ selectedColors = [], onChange }) {
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#000000');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleColorSelect = (colorName, colorHex) => {
    const colorData = colorHex; // Store hex value directly
    
    if (selectedColors.includes(colorData)) {
      // Remove color
      onChange(selectedColors.filter(c => c !== colorData));
    } else {
      // Add color
      onChange([...selectedColors, colorData]);
    }
  };

  const handleRemoveColor = (colorToRemove) => {
    onChange(selectedColors.filter(c => c !== colorToRemove));
  };

  const handleAddCustomColor = () => {
    if (!customColorName.trim() || !customColorHex) return;
    
    const colorData = customColorHex; // Store hex value
    
    if (!selectedColors.includes(colorData)) {
      onChange([...selectedColors, colorData]);
    }
    
    // Reset inputs
    setCustomColorName('');
    setCustomColorHex('#000000');
    setShowCustomInput(false);
  };

  return (
    <div className="space-y-4">
      {/* Selected Colors Display */}
      {selectedColors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Selected Colors ({selectedColors.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedColors.map((color, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-primary-100 rounded-full border border-primary-200"
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm capitalize">
                  {getColorName(color)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveColor(color)}
                  className="ml-1 text-primary-500 hover:text-red-500 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset Colors */}
      <div>
        <label className="block text-sm font-medium text-primary-900 mb-2">
          Choose from Preset Colors
        </label>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-3">
          {PRESET_COLORS.map((color, idx) => {
            const isSelected = selectedColors.includes(color.hex);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleColorSelect(color.name, color.hex)}
                className={`relative w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                  isSelected
                    ? 'border-brand-brown ring-2 ring-brand-brown ring-offset-1'
                    : 'border-primary-300 hover:border-brand-brown'
                }`}
                style={{ 
                  backgroundColor: color.hex,
                  // Add black border for white color
                  ...(color.hex === '#FFFFFF' && { borderColor: '#e5e7eb' })
                }}
                title={color.name}
              >
                {isSelected && (
                  <FiCheck 
                    className="w-5 h-5 absolute inset-0 m-auto drop-shadow-lg"
                    style={{ 
                      color: color.hex === '#FFFFFF' || color.hex === '#FFFDD0' || color.hex === '#F5F5DC'
                        ? '#000000' 
                        : '#FFFFFF' 
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Input */}
      <div>
        {!showCustomInput ? (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-2 text-sm text-brand-brown hover:text-brand-brown/80 font-medium transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add Custom Color
          </button>
        ) : (
          <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-primary-900">
                Custom Color
              </label>
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="text-primary-500 hover:text-primary-700"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-primary-600 mb-1">
                  Color Name
                </label>
                <input
                  type="text"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  placeholder="e.g., Forest Green"
                  className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-brand-brown"
                />
              </div>
              
              <div>
                <label className="block text-xs text-primary-600 mb-1">
                  Hex Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    className="w-12 h-10 rounded border border-primary-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-brand-brown"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleAddCustomColor}
              disabled={!customColorName.trim()}
              className="mt-3 w-full btn btn-secondary text-sm py-2"
            >
              Add Color
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-primary-500">
        Select multiple colors. Colors are stored as hex codes for consistency.
      </p>
    </div>
  );
}
