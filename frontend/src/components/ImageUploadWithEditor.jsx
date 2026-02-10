'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageEditor from './ImageEditor';
import { FiUpload, FiX, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { validateImage, autoOptimize } from '@/utils/imageUtils';

const ImageUploadWithEditor = ({ images = [], imagePreviews = [], existingImages = [], onImagesChange, maxImages = 5 }) => {
  const [editingImage, setEditingImage] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (imagePreviews.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setProcessing(true);
    const validFiles = [];

    // Validate and optimize each file
    for (const file of files) {
      // Validate
      const validation = await validateImage(file, {
        maxSize: 10 * 1024 * 1024, // 10MB
        minWidth: 400,
        minHeight: 400,
      });

      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        // Auto-optimize for web
        const optimized = await autoOptimize(file);
        validFiles.push(optimized);
        toast.success(`${file.name} optimized successfully`);
      } catch (error) {
        console.error('Optimization failed:', error);
        validFiles.push(file); // Use original if optimization fails
      }
    }

    if (validFiles.length === 0) {
      setProcessing(false);
      return;
    }

    // Read all files as data URLs in parallel, then update state once
    try {
      const newDataUrls = await Promise.all(
        validFiles.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = () => reject(new Error('Failed to read file'));
              reader.readAsDataURL(file);
            })
        )
      );

      const newImages = [...images, ...validFiles];
      const newPreviews = [...imagePreviews, ...newDataUrls];

      onImagesChange({
        images: newImages,
        imagePreviews: newPreviews,
        existingImages,
      });
    } catch (error) {
      console.error('Failed to read image files:', error);
      toast.error('Failed to process some images');
    }

    setProcessing(false);
  };

  const handleEditImage = (index) => {
    const preview = imagePreviews[index];
    setEditingImage(preview);
    setEditingIndex(index);
  };

  const handleSaveEditedImage = (editedFile) => {
    // Replace the image at the editing index
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    
    if (editingIndex < existingImages.length) {
      // Editing an existing image - convert to new image
      const newExistingImages = existingImages.filter((_, i) => i !== editingIndex);
      newImages.push(editedFile);
      
      // Create preview for edited image
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews[editingIndex] = reader.result;
        onImagesChange({
          images: newImages,
          imagePreviews: newPreviews,
          existingImages: newExistingImages
        });
      };
      reader.readAsDataURL(editedFile);
    } else {
      // Editing a new image
      const newImageIndex = editingIndex - existingImages.length;
      newImages[newImageIndex] = editedFile;
      
      // Create preview for edited image
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews[editingIndex] = reader.result;
        onImagesChange({
          images: newImages,
          imagePreviews: newPreviews,
          existingImages
        });
      };
      reader.readAsDataURL(editedFile);
    }

    setEditingImage(null);
    setEditingIndex(null);
    toast.success('Image edited successfully');
  };

  const handleRemoveImage = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    if (index < existingImages.length) {
      // Remove from existing images
      const newExistingImages = existingImages.filter((_, i) => i !== index);
      onImagesChange({
        images,
        imagePreviews: newPreviews,
        existingImages: newExistingImages
      });
    } else {
      // Remove from new images
      const newImageIndex = index - existingImages.length;
      const newImages = images.filter((_, i) => i !== newImageIndex);
      onImagesChange({
        images: newImages,
        imagePreviews: newPreviews,
        existingImages
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Product Images</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative aspect-square bg-gray-100 rounded-lg border border-gray-200 group">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                className="object-contain rounded-lg p-2"
              />
              
              {/* Hover Overlay with Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleEditImage(index)}
                  className="bg-white text-primary-900 p-2 rounded-full hover:bg-primary-100 transition-colors shadow-lg"
                  title="Edit Image"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title="Remove Image"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Main Image Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary-900 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
                  Main
                </div>
              )}
            </div>
          ))}
          
          {imagePreviews.length < maxImages && (
            <label className={`aspect-square border-2 border-dashed border-primary-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors touch-manipulation ${processing ? 'opacity-50 cursor-wait' : ''}`}>
              {processing ? (
                <>
                  <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-xs text-primary-600 font-medium">Processing...</span>
                </>
              ) : (
                <>
                  <FiUpload className="w-8 h-8 text-primary-400 mb-2" />
                  <span className="text-xs sm:text-sm text-primary-600 font-medium">Add Image</span>
                  <span className="text-xs text-primary-400 mt-1">Click to upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                disabled={processing}
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-primary-500">
            📸 Upload up to {maxImages} images. First image will be the main product image.
          </p>
          <p className="text-xs sm:text-sm text-primary-600 font-medium">
            ✨ Click the edit icon to adjust, crop, or enhance any image before uploading.
          </p>
          <p className="text-xs text-green-600">
            🎯 Images are automatically optimized for web (min 400x400px, max 10MB)
          </p>
        </div>
      </div>

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditor
          image={editingImage}
          onSave={handleSaveEditedImage}
          onCancel={() => {
            setEditingImage(null);
            setEditingIndex(null);
          }}
        />
      )}
    </>
  );
};

export default ImageUploadWithEditor;
