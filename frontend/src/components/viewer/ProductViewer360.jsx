import React from 'react';
import { use360Viewer } from '@/hooks/use360Viewer';
import { use360Canvas } from '@/hooks/use360Canvas';
import HotspotAnnotationEditor from '@/components/viewer/HotspotAnnotationEditor';

export default function ProductViewer360({
    images = [],
    sensitivity = 5,
    autoRotate = false,
    hotspots = [],
    editableHotspots = false,
    onHotspotsChange,
    className = ""
}) {
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

    const { canvasRef } = use360Canvas({
        currentImageSrc,
        responsive: false,
        fixedWidth: 800,
        fixedHeight: 800,
    });

    const handleAddHotspot = (hotspot) => {
        if (!onHotspotsChange) return;
        const newHotspot = {
            ...hotspot,
            id: `hotspot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        };
        onHotspotsChange([...(hotspots || []), newHotspot]);
    };

    const handleRemoveHotspot = (id) => {
        if (!onHotspotsChange) return;
        onHotspotsChange((hotspots || []).filter((item) => item.id !== id));
    };

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

            <HotspotAnnotationEditor
                hotspots={hotspots}
                currentFrame={currentFrame}
                editable={editableHotspots}
                onAddHotspot={handleAddHotspot}
                onRemoveHotspot={handleRemoveHotspot}
            />

            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700 pointer-events-none">
                360° VIEW
            </div>
        </div>
    );
}
