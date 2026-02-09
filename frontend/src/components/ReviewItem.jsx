'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiStar, FiThumbsUp, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ReviewItem({ review, onHelpfulClick }) {
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulVotes || 0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleHelpfulClick = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/v1/reviews/${review._id}/helpful`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark review as helpful');
      }

      setIsHelpful(data.isHelpful);
      setHelpfulCount(data.helpfulVotes);
      
      if (onHelpfulClick) {
        onHelpfulClick(review._id, data.isHelpful);
      }
    } catch (error) {
      console.error('Mark helpful error:', error);
      toast.error(error.message || 'Please login to mark reviews as helpful');
    }
  };

  const displayPhotos = showAllPhotos ? review.photos : review.photos?.slice(0, 3);

  return (
    <div className="border-b border-primary-200 pb-6 last:border-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-medium text-primary-900">
              {review.user?.name || 'Anonymous'}
            </span>
            {review.verifiedPurchase && (
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                <FiCheck className="w-3 h-3" />
                Verified Purchase
              </span>
            )}
          </div>
          <p className="text-sm text-primary-500">
            {formatDate(review.createdAt)}
          </p>
        </div>
        
        {/* Stars */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <FiStar
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-primary-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-primary-900 mb-2">{review.title}</h4>

      {/* Comment */}
      <p className="text-primary-700 leading-relaxed mb-4">{review.comment}</p>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {displayPhotos.map((photo, index) => (
              <div key={index} className="aspect-square relative overflow-hidden rounded-lg">
                <Image
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 33vw, 180px"
                  className="object-cover hover:scale-105 transition-transform cursor-pointer"
                />
              </div>
            ))}
          </div>
          
          {review.photos.length > 3 && !showAllPhotos && (
            <button
              onClick={() => setShowAllPhotos(true)}
              className="text-sm text-brand-brown hover:underline"
            >
              +{review.photos.length - 3} more photos
            </button>
          )}
        </div>
      )}

      {/* Helpful Button */}
      <div className="flex items-center gap-4 pt-3">
        <button
          onClick={handleHelpfulClick}
          className={`flex items-center gap-2 text-sm transition-colors ${
            isHelpful
              ? 'text-brand-brown font-medium'
              : 'text-primary-600 hover:text-primary-900'
          }`}
        >
          <FiThumbsUp className={`w-4 h-4 ${isHelpful ? 'fill-current' : ''}`} />
          <span>Helpful ({helpfulCount})</span>
        </button>
      </div>
    </div>
  );
}
