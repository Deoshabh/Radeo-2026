'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FiRotateCw, FiZoomIn, FiZoomOut, FiCrop, FiCheck, FiX, FiMaximize } from 'react-icons/fi';

const ImageEditor = ({ image, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [aspectRatio, setAspectRatio] = useState('free');
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });

  // Aspect ratio presets for shoe product images
  const aspectRatios = [
    { label: 'Free', value: 'free', ratio: null },
    { label: 'Square (1:1)', value: 'square', ratio: 1 },
    { label: 'Portrait (3:4)', value: 'portrait', ratio: 3 / 4 },
    { label: 'Landscape (4:3)', value: 'landscape', ratio: 4 / 3 },
    { label: 'Wide (16:9)', value: 'wide', ratio: 16 / 9 },
  ];

  // Apply image transformations
  const applyTransformations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS

    img.onload = () => {
      // Calculate dimensions based on rotation
      const radians = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));

      const newWidth = img.width * cos + img.height * sin;
      const newHeight = img.width * sin + img.height * cos;

      // Set canvas size
      canvas.width = newWidth * zoom;
      canvas.height = newHeight * zoom;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context state
      ctx.save();

      // Apply transformations from center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.scale(zoom, zoom);

      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

      // Restore context state
      ctx.restore();
    };

    img.onerror = () => {
      console.error('Failed to load image');
    };

    img.src = image;
  }, [image, rotation, zoom, brightness, contrast]);

  // Apply transformations when values change
  useEffect(() => {
    applyTransformations();
  }, [applyTransformations]);

  // Handle crop and save
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create file from blob
            const file = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });
            onSave(file);
          }
        },
        'image/jpeg',
        0.95 // Quality (0-1)
      );
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  // Auto-crop to aspect ratio
  const handleAspectRatioChange = (value) => {
    setAspectRatio(value);
    const ratio = aspectRatios.find(ar => ar.value === value)?.ratio;

    if (ratio && cropMode) {
      // Adjust crop area to match aspect ratio
      const newHeight = cropArea.width / ratio;
      setCropArea({ ...cropArea, height: newHeight });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">Edit Image</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-primary-900 text-white hover:bg-primary-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <FiCheck className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview Canvas */}
            <div className="lg:col-span-2">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[400px] border-2 border-gray-300 overflow-auto">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[600px] object-contain shadow-lg"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <FiRotateCw className="w-4 h-4" />
                  Rotate 90°
                </button>
                <button
                  type="button"
                  onClick={() => setCropMode(!cropMode)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${cropMode ? 'bg-primary-900 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                  <FiCrop className="w-4 h-4" />
                  {cropMode ? 'Exit Crop' : 'Crop'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRotation(0);
                    setZoom(1);
                    setBrightness(100);
                    setContrast(100);
                    setAspectRatio('free');
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                >
                  Reset All
                </button>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="space-y-6">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  <FiMaximize className="inline w-4 h-4 mr-2" />
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.value}
                      type="button"
                      onClick={() => handleAspectRatioChange(ar.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${aspectRatio === ar.value
                          ? 'bg-primary-900 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom Control */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <FiZoomIn className="inline w-4 h-4 mr-2" />
                  Zoom: {zoom.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x</span>
                  <span>3x</span>
                </div>
              </div>

              {/* Rotation Control */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <FiRotateCw className="inline w-4 h-4 mr-2" />
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0°</span>
                  <span>360°</span>
                </div>
              </div>

              {/* Brightness Control */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Brightness: {brightness}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="1"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Dark</span>
                  <span>Bright</span>
                </div>
              </div>

              {/* Contrast Control */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Contrast: {contrast}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="1"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Use Square (1:1) for consistent product grids</li>
                  <li>• Adjust brightness/contrast for better visibility</li>
                  <li>• Rotate images to show products upright</li>
                  <li>• Higher zoom shows more detail</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
