'use client';

import { useState, useRef } from 'react';
import { FiUploadCloud, FiX } from 'react-icons/fi';
import { adminAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ImageUploader({ value, onChange, label }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // specific validation if needed
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        try {
            setUploading(true);

            // 1. Get Signed URL
            const { data } = await adminAPI.getUploadUrl({
                fileName: file.name,
                fileType: file.type,
                productSlug: 'cms-uploads' // Organize in cms folder
            });

            if (!data.success) {
                throw new Error(data.message || 'Failed to get upload URL');
            }

            const { signedUrl, publicUrl } = data.data;

            // 2. Upload to S3/MinIO
            await axios.put(signedUrl, file, {
                headers: {
                    'Content-Type': file.type,
                },
            });

            // 3. Update parent with public URL
            onChange(publicUrl);
            toast.success('Image uploaded successfully');

        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            {value ? (
                <div className="relative group border rounded-lg overflow-hidden bg-gray-50">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                            title="Remove Image"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${uploading ? 'bg-gray-50 border-gray-300' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span className="text-sm">Uploading...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                            <FiUploadCloud size={32} />
                            <span className="text-sm font-medium">Click to upload image</span>
                            <span className="text-xs text-gray-400">Max 5MB (JPG, PNG, WEBP)</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
