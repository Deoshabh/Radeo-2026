'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FiRotateCw, FiRotateCcw,
  FiZoomIn, FiZoomOut,
  FiCrop, FiCheck, FiX,
  FiMaximize, FiCornerDownLeft,
  FiCornerDownRight,
} from 'react-icons/fi';

const ImageEditor = ({ image, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('free');

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragStart, setDragStart] = useState(null);

  // Undo / Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [saving, setSaving] = useState(false);

  // Aspect ratio presets for shoe product images
  const aspectRatios = [
    { label: 'Free', value: 'free', ratio: null },
    { label: 'Square (1:1)', value: 'square', ratio: 1 },
    { label: 'Portrait (3:4)', value: 'portrait', ratio: 3 / 4 },
    { label: 'Landscape (4:3)', value: 'landscape', ratio: 4 / 3 },
    { label: 'Wide (16:9)', value: 'wide', ratio: 16 / 9 },
  ];

  // ── Load image (handle both data URLs and remote URLs) ──
  useEffect(() => {
    if (!image) return;

    // Data URLs work directly — no CORS issue
    if (image.startsWith('data:')) {
      setImageSrc(image);
      return;
    }

    // For remote URLs (MinIO), fetch as blob to avoid tainted canvas
    const fetchImage = async () => {
      try {
        const res = await fetch(image);
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        setImageSrc(dataUrl);
      } catch (err) {
        console.error('Failed to fetch image, trying direct load:', err);
        setImageSrc(image);
      }
    };

    fetchImage();
  }, [image]);

  // ── Draw the main canvas ──
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;

    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    const radians = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const newWidth = img.naturalWidth * cos + img.naturalHeight * sin;
    const newHeight = img.naturalWidth * sin + img.naturalHeight * cos;

    // Limit canvas size for performance
    const maxDisplaySize = 1200;
    const displayScale = Math.min(1, maxDisplaySize / Math.max(newWidth * zoom, newHeight * zoom));

    canvas.width = newWidth * zoom * displayScale;
    canvas.height = newHeight * zoom * displayScale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.scale(
      zoom * displayScale * (flipH ? -1 : 1),
      zoom * displayScale * (flipV ? -1 : 1)
    );

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);

    ctx.restore();

    // Initialize crop rect when entering crop mode
    if (cropMode && !cropRect) {
      const margin = 0.1;
      const cw = canvas.width;
      const ch = canvas.height;
      let cropW = cw * (1 - 2 * margin);
      let cropH = ch * (1 - 2 * margin);

      const selectedRatio = aspectRatios.find(ar => ar.value === aspectRatio)?.ratio;
      if (selectedRatio) {
        if (cropW / cropH > selectedRatio) {
          cropW = cropH * selectedRatio;
        } else {
          cropH = cropW / selectedRatio;
        }
      }

      setCropRect({
        x: (cw - cropW) / 2,
        y: (ch - cropH) / 2,
        w: cropW,
        h: cropH,
      });
    }
  }, [rotation, zoom, brightness, contrast, flipH, flipV, cropMode, aspectRatio]);

  // Load image element
  useEffect(() => {
    if (!imageSrc) return;
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => console.error('Failed to load image for editor');
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw when transformations change
  useEffect(() => {
    if (imageLoaded) drawCanvas();
  }, [drawCanvas, imageLoaded]);

  // ── Draw crop overlay ──
  useEffect(() => {
    if (!cropMode || !cropRect || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const cropCanvas = cropCanvasRef.current;
    if (!cropCanvas) return;

    cropCanvas.width = canvas.width;
    cropCanvas.height = canvas.height;

    const ctx = cropCanvas.getContext('2d');
    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);

    // Darken outside crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);

    // Clear crop area (show through)
    ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);

    // Draw crop border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);

    // Draw rule-of-thirds grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      const xLine = cropRect.x + (cropRect.w * i) / 3;
      const yLine = cropRect.y + (cropRect.h * i) / 3;
      ctx.beginPath();
      ctx.moveTo(xLine, cropRect.y);
      ctx.lineTo(xLine, cropRect.y + cropRect.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cropRect.x, yLine);
      ctx.lineTo(cropRect.x + cropRect.w, yLine);
      ctx.stroke();
    }

    // Draw corner handles
    const handleSize = 10;
    ctx.fillStyle = '#fff';
    const corners = [
      { x: cropRect.x, y: cropRect.y },
      { x: cropRect.x + cropRect.w, y: cropRect.y },
      { x: cropRect.x, y: cropRect.y + cropRect.h },
      { x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h },
    ];
    corners.forEach((c) => {
      ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    });
  }, [cropMode, cropRect]);

  // ── Crop mouse/touch handlers ──
  const getEventPos = (e) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const isNearCorner = (pos, corner, threshold = 20) => {
    return Math.abs(pos.x - corner.x) < threshold && Math.abs(pos.y - corner.y) < threshold;
  };

  const handleCropPointerDown = (e) => {
    if (!cropMode || !cropRect) return;
    e.preventDefault();
    const pos = getEventPos(e);

    // Check corners first
    const corners = {
      nw: { x: cropRect.x, y: cropRect.y },
      ne: { x: cropRect.x + cropRect.w, y: cropRect.y },
      sw: { x: cropRect.x, y: cropRect.y + cropRect.h },
      se: { x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h },
    };

    for (const [key, corner] of Object.entries(corners)) {
      if (isNearCorner(pos, corner)) {
        setDragging(key);
        setDragStart(pos);
        return;
      }
    }

    // Check inside crop area for move
    if (
      pos.x >= cropRect.x &&
      pos.x <= cropRect.x + cropRect.w &&
      pos.y >= cropRect.y &&
      pos.y <= cropRect.y + cropRect.h
    ) {
      setDragging('move');
      setDragStart(pos);
    }
  };

  const handleCropPointerMove = (e) => {
    if (!dragging || !cropRect || !dragStart) return;
    e.preventDefault();
    const pos = getEventPos(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.width;
    const ch = canvas.height;

    const selectedRatio = aspectRatios.find(ar => ar.value === aspectRatio)?.ratio;

    setCropRect((prev) => {
      let { x, y, w, h } = prev;

      if (dragging === 'move') {
        x = Math.max(0, Math.min(cw - w, x + dx));
        y = Math.max(0, Math.min(ch - h, y + dy));
      } else {
        // Resize from corner
        if (dragging === 'se') {
          w = Math.max(40, Math.min(cw - x, w + dx));
          h = selectedRatio ? w / selectedRatio : Math.max(40, Math.min(ch - y, h + dy));
        } else if (dragging === 'sw') {
          const newW = Math.max(40, w - dx);
          x = x + (w - newW);
          w = newW;
          h = selectedRatio ? w / selectedRatio : Math.max(40, Math.min(ch - y, h + dy));
        } else if (dragging === 'ne') {
          w = Math.max(40, Math.min(cw - x, w + dx));
          const newH = selectedRatio ? w / selectedRatio : Math.max(40, h - dy);
          y = y + (h - newH);
          h = newH;
        } else if (dragging === 'nw') {
          const newW = Math.max(40, w - dx);
          const newH = selectedRatio ? newW / selectedRatio : Math.max(40, h - dy);
          x = x + (w - newW);
          y = y + (h - newH);
          w = newW;
          h = newH;
        }

        // Clamp to canvas bounds
        x = Math.max(0, x);
        y = Math.max(0, y);
        if (x + w > cw) w = cw - x;
        if (y + h > ch) h = ch - y;
      }

      return { x, y, w, h };
    });

    setDragStart(pos);
  };

  const handleCropPointerUp = () => {
    setDragging(null);
    setDragStart(null);
  };

  // ── Save snapshot to history ──
  const pushToHistory = useCallback((state) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Save initial state
  useEffect(() => {
    if (imageLoaded && history.length === 0) {
      pushToHistory({
        rotation: 0,
        zoom: 1,
        brightness: 100,
        contrast: 100,
        flipH: false,
        flipV: false,
      });
    }
  }, [imageLoaded]);

  // Push state on transformation change (debounced)
  const stateTimeoutRef = useRef(null);
  useEffect(() => {
    if (!imageLoaded) return;
    if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);
    stateTimeoutRef.current = setTimeout(() => {
      pushToHistory({ rotation, zoom, brightness, contrast, flipH, flipV });
    }, 500);
    return () => clearTimeout(stateTimeoutRef.current);
  }, [rotation, zoom, brightness, contrast, flipH, flipV]);

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const state = history[newIndex];
    setHistoryIndex(newIndex);
    applyState(state);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const state = history[newIndex];
    setHistoryIndex(newIndex);
    applyState(state);
  };

  const applyState = (state) => {
    setRotation(state.rotation);
    setZoom(state.zoom);
    setBrightness(state.brightness);
    setContrast(state.contrast);
    setFlipH(state.flipH);
    setFlipV(state.flipV);
  };

  // ── Toggle crop mode ──
  const toggleCropMode = () => {
    if (cropMode) {
      setCropRect(null);
    }
    setCropMode(!cropMode);
  };

  // ── Apply crop ──
  const applyCrop = () => {
    if (!cropRect || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.getImageData(cropRect.x, cropRect.y, cropRect.w, cropRect.h);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropRect.w;
    tempCanvas.height = cropRect.h;
    tempCanvas.getContext('2d').putImageData(imageData, 0, 0);

    const croppedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
    setImageSrc(croppedDataUrl);

    // Reset transformations after crop
    setRotation(0);
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setFlipH(false);
    setFlipV(false);
    setCropRect(null);
    setCropMode(false);
  };

  // ── Aspect ratio change ──
  const handleAspectRatioChange = (value) => {
    setAspectRatio(value);
    const ratio = aspectRatios.find(ar => ar.value === value)?.ratio;

    if (cropMode && cropRect && canvasRef.current) {
      const canvas = canvasRef.current;
      if (ratio) {
        let newW = cropRect.w;
        let newH = newW / ratio;
        if (newH > canvas.height) {
          newH = canvas.height * 0.8;
          newW = newH * ratio;
        }
        if (newW > canvas.width) {
          newW = canvas.width * 0.8;
          newH = newW / ratio;
        }
        setCropRect({
          x: (canvas.width - newW) / 2,
          y: (canvas.height - newH) / 2,
          w: newW,
          h: newH,
        });
      }
    }
  };

  // ── Save final image ──
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);

    try {
      // If in crop mode with active crop, apply crop first
      if (cropMode && cropRect) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cropRect.w;
        tempCanvas.height = cropRect.h;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);

        tempCanvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' });
              onSave(file);
            }
            setSaving(false);
          },
          'image/jpeg',
          0.92
        );
        return;
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onSave(file);
          }
          setSaving(false);
        },
        'image/jpeg',
        0.92
      );
    } catch (error) {
      console.error('Error saving image:', error);
      setSaving(false);
    }
  };

  // ── Reset all ──
  const resetAll = () => {
    setRotation(0);
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio('free');
    setCropMode(false);
    setCropRect(null);
    // Reload original image if it was cropped
    if (image.startsWith('data:')) {
      setImageSrc(image);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Image</h2>
          <div className="flex gap-2">
            {/* Undo / Redo */}
            <button
              type="button"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
              title="Undo"
            >
              <FiCornerDownLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
              title="Redo"
            >
              <FiCornerDownRight className="w-4 h-4" />
            </button>
            <div className="w-px h-8 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={onCancel}
              className="px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3 sm:px-4 py-2 bg-primary-900 text-white hover:bg-primary-800 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-60"
            >
              <FiCheck className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview Canvas */}
            <div className="lg:col-span-2">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[300px] sm:min-h-[400px] border-2 border-gray-300 overflow-auto">
                {!imageLoaded ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Loading image...</span>
                  </div>
                ) : (
                  <div
                    ref={containerRef}
                    className="relative inline-block select-none"
                    onMouseDown={handleCropPointerDown}
                    onMouseMove={handleCropPointerMove}
                    onMouseUp={handleCropPointerUp}
                    onMouseLeave={handleCropPointerUp}
                    onTouchStart={handleCropPointerDown}
                    onTouchMove={handleCropPointerMove}
                    onTouchEnd={handleCropPointerUp}
                  >
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-[500px] sm:max-h-[600px] object-contain shadow-lg"
                      style={{ cursor: cropMode ? 'crosshair' : 'default' }}
                    />
                    {/* Crop overlay canvas */}
                    {cropMode && (
                      <canvas
                        ref={cropCanvasRef}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </div>
                )}
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
                  onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <FiRotateCcw className="w-4 h-4" />
                  Rotate -90°
                </button>
                <button
                  type="button"
                  onClick={() => setFlipH((prev) => !prev)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${flipH ? 'bg-primary-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Flip H
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV((prev) => !prev)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${flipV ? 'bg-primary-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Flip V
                </button>
                <button
                  type="button"
                  onClick={toggleCropMode}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${cropMode ? 'bg-primary-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <FiCrop className="w-4 h-4" />
                  {cropMode ? 'Cancel Crop' : 'Crop'}
                </button>
                {cropMode && cropRect && (
                  <button
                    type="button"
                    onClick={applyCrop}
                    className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <FiCheck className="w-4 h-4" />
                    Apply Crop
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                >
                  Reset All
                </button>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="space-y-5">
              {/* Aspect Ratio (only shown in crop mode) */}
              {cropMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    <FiMaximize className="inline w-4 h-4 mr-2" />
                    Crop Ratio
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {aspectRatios.map((ar) => (
                      <button
                        key={ar.value}
                        type="button"
                        onClick={() => handleAspectRatioChange(ar.value)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          aspectRatio === ar.value
                            ? 'bg-primary-900 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                  className="w-full accent-primary-900"
                  disabled={cropMode}
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
                  className="w-full accent-primary-900"
                  disabled={cropMode}
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
                  className="w-full accent-primary-900"
                  disabled={cropMode}
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
                  className="w-full accent-primary-900"
                  disabled={cropMode}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Use Square (1:1) crop for consistent product grids</li>
                  <li>• Drag crop corners to resize, drag inside to move</li>
                  <li>• Apply crop before adjusting brightness/contrast</li>
                  <li>• Use Undo/Redo buttons to navigate changes</li>
                  <li>• Flip H/V for mirror views of products</li>
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
