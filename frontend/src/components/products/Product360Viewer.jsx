
'use client';
import { useEffect, useState } from 'react';
import { use360Viewer } from '@/hooks/use360Viewer';
import { use360Canvas } from '@/hooks/use360Canvas';
import { FiMove } from 'react-icons/fi';
import HotspotAnnotationEditor from '@/components/viewer/HotspotAnnotationEditor';

export default function Product360Viewer({ images, hotspots = [], aspectRatio = 'aspect-square', autoRotate = true }) {
    const [isLoaded, setIsLoaded] = useState(false);

    const {
        currentFrame,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        stopAutoRotate,
        currentImageSrc
    } = use360Viewer({ images, sensitivity: 3 });

    const { canvasRef, containerRef } = use360Canvas({
        currentImageSrc,
        responsive: true,
    });

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

    // Cleanup auto-rotate on unmount
    useEffect(() => {
        return () => stopAutoRotate();
    }, [autoRotate, isLoaded, stopAutoRotate]);

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
