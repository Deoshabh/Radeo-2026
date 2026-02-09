'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiStar, FiCamera, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ReviewForm({ productId, onReviewSubmitted, onCancel }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]); // Store actual File objects
  const [photoPreviews, setPhotoPreviews] = useState([]); // Store preview URLs
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total (existing + new)
    if (photoFiles.length + files.length > 2) {
      toast.error('Maximum 2 photos allowed per review');
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type.toLowerCase()));
    
    if (invalidFiles.length > 0) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file sizes (5MB max per file)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Each photo must be less than 5MB');
      return;
    }

    // Add files and create preview URLs
    setPhotoFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a review title');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('title', title);
      formData.append('comment', comment);
      
      // Append photo files (not base64)
      photoFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/v1/products/${productId}/reviews`, {
        method: 'POST',
        credentials: 'include',
        body: formData, // Don't set Content-Type header - browser will set it with boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      
      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      setPhotoFiles([]);
      setPhotoPreviews([]);
      
      if (onReviewSubmitted) {
        onReviewSubmitted(data.review);
      }
    } catch (error) {
      console.error('Submit review error:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-primary-200 p-6 space-y-6">
      <h3 className="text-xl font-serif font-bold text-primary-900">Write a Review</h3>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-primary-700 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl focus:outline-none transition-colors"
            >
              <FiStar
                className={
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-primary-300'
                }
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-primary-600 self-center">
            {rating > 0 && `${rating} out of 5 stars`}
          </span>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-primary-700 mb-2">
          Review Title <span className="text-red-500">*</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Sum up your experience in one line"
          className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-brand-brown"
        />
        <p className="text-xs text-primary-500 mt-1">{title.length}/200 characters</p>
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-primary-700 mb-2">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Tell us what you liked or disliked about this product"
          className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-brand-brown"
        />
        <p className="text-xs text-primary-500 mt-1">{comment.length}/2000 characters</p>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-primary-700 mb-2">
          Add Photos <span className="text-primary-500">(Optional - Max 2)</span>
        </label>
        <div className="space-y-3">
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 200px"
                    unoptimized
                    className="object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {photoFiles.length < 2 && (
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-primary-300 rounded-lg cursor-pointer hover:border-brand-brown transition-colors">
              <FiCamera className="text-primary-500" />
              <span className="text-sm text-primary-600">
                Add Photos ({photoFiles.length}/2)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-primary-500 mt-1">
          Upload up to 2 photos of the product (JPEG, PNG, or WebP - max 5MB each)
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-brand-brown text-white py-3 px-6 rounded-lg hover:bg-brand-tan transition-colors disabled:bg-primary-300 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
