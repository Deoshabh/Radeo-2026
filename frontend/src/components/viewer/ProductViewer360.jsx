import React, { useRef, useEffect } from 'react';
import { use360Viewer } from '@/hooks/use360Viewer';
// Hotspots would be implemented here

export default function ProductViewer360({
    images = [],
    sensitivity = 5,
    autoRotate = false,
    className = ""
}) {
    const canvasRef = useRef(null);

    const {
        currentFrame,
        currentImageSrc,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        isDragging
    } = use360Viewer({
        images,
        sensitivity,
        autoRotate
    });

    // Draw to canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !currentImageSrc) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Clear and draw
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate aspect ratio fit (contain)
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };

        img.src = currentImageSrc;
    }, [currentImageSrc]);

    if (!images || images.length === 0) {
        return <div className="w-full h-96 bg-gray-100 flex items-center justify-center text-gray-400">No frames loaded</div>;
    }

    return (
        <div
            className={`relative select-none cursor-grab active:cursor-grabbing touch-none ${className}`}
            onMouseDown={e => handleDragStart(e.clientX)}
            onMouseMove={e => {
                if (isDragging) handleDragMove(e.clientX);
            }}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={e => handleDragStart(e.touches[0].clientX)}
            onTouchMove={e => {
                if (isDragging) handleDragMove(e.touches[0].clientX);
            }}
            onTouchEnd={handleDragEnd}
        >
            <canvas
                ref={canvasRef}
                width={800}
                height={800}
                className="w-full h-auto object-contain pointer-events-none"
            />

            {/* Loading State or 360 Badge could go here */}
            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700 pointer-events-none">
                360° VIEW
            </div>
        </div>
    );
}
