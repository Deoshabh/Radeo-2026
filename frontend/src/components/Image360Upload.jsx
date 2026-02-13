'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiUploadCloud, FiX, FiMove, FiRotateCw } from 'react-icons/fi';
import Image from 'next/image';

function SortableImage({ id, url, onRemove, index }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
        >
            <Image
                src={url}
                alt={`360 Frame ${index + 1}`}
                fill
                className="object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 cursor-move"
                    type="button"
                >
                    <FiMove />
                </button>
                <button
                    onClick={() => onRemove(id)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600"
                    type="button"
                >
                    <FiX />
                </button>
            </div>

            {/* Index Badge */}
            <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                {index + 1}
            </div>
        </div>
    );
}

export default function Image360Upload({ images = [], onImagesChange, maxImages = 72 }) {
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const onDrop = useCallback((acceptedFiles) => {
        // Determine the starting index for new images
        const startIndex = images.length;

        // Create preview objects for new files
        const newImages = acceptedFiles.map((file, i) => ({
            file,
            url: URL.createObjectURL(file),
            id: `new-${Date.now()}-${i}`,
            isNew: true
        }));

        // Combine with existing
        const updatedImages = [...images, ...newImages];

        // Limit to maxImages
        if (updatedImages.length > maxImages) {
            alert(`Maximum ${maxImages} images allowed. Truncating list.`);
            updatedImages.length = maxImages;
        }

        onImagesChange(updatedImages);
    }, [images, maxImages, onImagesChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        multiple: true
    });

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = images.findIndex((img) => (img.id || img._id || img.key) === active.id);
            const newIndex = images.findIndex((img) => (img.id || img._id || img.key) === over.id);
            onImagesChange(arrayMove(images, oldIndex, newIndex));
        }
    };

    const handleRemove = (id) => {
        onImagesChange(images.filter((img) => (img.id || img._id || img.key) !== id));
    };

    // Helper to extract ID for dnd-kit
    const getItemId = (img) => img.id || img._id || img.key;

    return (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                        <FiRotateCw /> 360° View Images
                    </h2>
                    <p className="text-sm text-primary-500">Upload 24-72 images in sequence for a smooth 360 rotation.</p>
                </div>
                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {images.length} frames
                </span>
            </div>

            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                    }`}
            >
                <input {...getInputProps()} />
                <FiUploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-primary-700 font-medium">Click or drag images sequence here</p>
                <p className="text-xs text-gray-500 mt-1">Recommended: 36 images (10 deg/frame)</p>
            </div>

            {images.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={images.map(getItemId)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {images.map((img, index) => (
                                <SortableImage
                                    key={getItemId(img)}
                                    id={getItemId(img)}
                                    url={img.url}
                                    index={index}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}
