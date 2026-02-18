
'use client';
import { useRef, useEffect, useState } from 'react';
import { use360Viewer } from '@/hooks/use360Viewer';
import { FiMove } from 'react-icons/fi';
import HotspotAnnotationEditor from '@/components/viewer/HotspotAnnotationEditor';

export default function Product360Viewer({ images, hotspots = [], aspectRatio = 'aspect-square', autoRotate = true }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const {
        currentFrame,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        startAutoRotate,
        stopAutoRotate,
        currentImageSrc
    } = use360Viewer({ images, sensitivity: 3 }); // decreased sensitivity for faster spin

    // Preload images to avoid flickering
    useEffect(() => {
        if (!images || images.length === 0) return;

        let loadedCount = 0;
        const total = images.length;

        images.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === total) setIsLoaded(true);
            };
        });

        // Timeout fallback
        const timeout = setTimeout(() => setIsLoaded(true), 3000);
        return () => clearTimeout(timeout);
    }, [images]);

    // Canvas Rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !currentImageSrc) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = currentImageSrc;

        img.onload = () => {
            // clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // draw contain
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };

        // If image is already cached/loaded, onload might not fire immediately if we don't handle it right, 
        // but creating new Image() usually works. For performance, we should cache Image objects, 
        // but browser cache is usually sufficient for this simple viewer.

    }, [currentFrame, currentImageSrc]);

    // Cleanup auto-rotate on unmount
    useEffect(() => {
        // if (autoRotate && isLoaded) startAutoRotate(2); 
        // Auto-rotate logic in hook needs refinement for "resume after drag", 
        // for now let's just let user interact.
        return () => stopAutoRotate();
    }, [autoRotate, isLoaded, startAutoRotate, stopAutoRotate]);

    // Resize observer for canvas resolution
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const resize = () => {
            const rect = containerRef.current.getBoundingClientRect();
            // Set actual render resolution to match display size (or 2x for retina)
            const dpr = window.devicePixelRatio || 1;
            canvasRef.current.width = rect.width * dpr;
            canvasRef.current.height = rect.height * dpr;

            // Redraw immediately if possible (will happen via currentImageSrc effect naturally?)
            // No, we need to re-trigger. 
            // Effect [currentImageSrc] handles it if we don't clear state.
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    if (!images || images.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className={`relative ${aspectRatio} bg-gray-50 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group`}
            onMouseDown={e => handleDragStart(e.clientX)}
            onMouseMove={e => handleDragMove(e.clientX)}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={e => handleDragStart(e.touches[0].clientX)}
            onTouchMove={e => handleDragMove(e.touches[0].clientX)}
            onTouchEnd={handleDragEnd}
        >
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
                </div>
            )}

            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain pointer-events-none"
            />

            <HotspotAnnotationEditor
                hotspots={hotspots}
                currentFrame={currentFrame}
                editable={false}
            />

            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 backdrop-blur-sm">
                    <FiMove /> Drag to rotate
                </div>
            </div>
        </div>
    );
}
