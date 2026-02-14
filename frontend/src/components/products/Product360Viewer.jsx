'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Product360Viewer({ images = [], aspectRatio = 'aspect-square' }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const containerRef = useRef(null);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        startX.current = e.clientX;
    };

    const handleTouchStart = (e) => {
        setIsDragging(true);
        startX.current = e.touches[0].clientX;
    };

    const handleMove = (clientX) => {
        if (!isDragging) return;

        const delta = clientX - startX.current;
        const sensitivity = 10; // Pixels to move one frame

        if (Math.abs(delta) > sensitivity) {
            if (delta > 0) {
                // Drag Right -> Rotate Left (Previous Image)
                setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            } else {
                // Drag Left -> Rotate Right (Next Image)
                setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }
            startX.current = clientX; // Reset start to current to continue dragging
        }
    };

    const handleMouseMove = (e) => {
        e.preventDefault();
        handleMove(e.clientX);
    };

    const handleTouchMove = (e) => {
        // e.preventDefault(); // Might block scrolling, be careful
        handleMove(e.touches[0].clientX);
    };

    const handleEnd = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onMouseUp = () => setIsDragging(false);

        // Add global mouse up to catch release outside container
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    // If no 360 images, don't render or render placeholder? 
    // Should be handled by parent, but safe check here.
    if (!images || images.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className={`relative cursor-grab active:cursor-grabbing overflow-hidden rounded-lg bg-gray-50 ${aspectRatio}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleEnd}
            onMouseLeave={handleEnd}
        >
            {/* Preload all images for smoothness */}
            <div className="hidden">
                {images.map((img, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={img} alt="preload" />
                ))}
            </div>

            {/* Active Image */}
            <div className="relative w-full h-full select-none">
                <Image
                    src={images[currentIndex]}
                    alt={`360 view frame ${currentIndex + 1}`}
                    fill
                    className="object-contain pointer-events-none"
                    priority={true}
                />
            </div>

            {/* Instructions Overlay (fades out active) */}
            {!isDragging && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium pointer-events-none backdrop-blur-sm opacity-70">
                    Drag to Rotate
                </div>
            )}

            {/* 360 Icon Indicator */}
            <div className="absolute top-4 right-4 bg-white/80 p-1.5 rounded-full shadow-sm backdrop-blur">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800">
                    <path d="M21.168 8A10.003 10.003 0 0 0 12 2c-5.3 0-9.617 4.14-9.98 9.387M2.02 16.013A10 10 0 0 0 12 22c5.3 0 9.617-4.14 9.98-9.387" />
                    <path d="m17 17 4.172-4.172M2.828 11.172 7 7" />
                </svg>
            </div>
        </div>
    );
}
