'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiStar, FiEdit } from 'react-icons/fi';
import ReviewItem from './ReviewItem';
import ReviewForm from './ReviewForm';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function ReviewSection({ productId }) {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');

  const fetchReviews = useCallback(async (pageNum = 1, sort = 'createdAt') => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${API_URL}/api/v1/products/${productId}/reviews?page=${pageNum}&limit=10&sort=${sort}`,
        {
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reviews');
      }

      if (pageNum === 1) {
        setReviews(data.reviews);
      } else {
        setReviews((prev) => [...prev, ...data.reviews]);
      }

      setRatingStats(data.ratingStats);
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Fetch reviews error:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchReviews(1, sortBy);
    }
  }, [productId, sortBy, fetchReviews]);

  const handleReviewSubmitted = (newReview) => {
    setReviews((prev) => [newReview, ...prev]);
    setShowReviewForm(false);
    fetchReviews(1, sortBy); // Refresh to get updated stats
  };

  const handleLoadMore = () => {
    fetchReviews(page + 1, sortBy);
  };

  const averageRating = ratingStats?.averageRating || 0;
  const totalReviews = ratingStats?.totalReviews || 0;

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-primary-50 rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Overall Rating */}
          <div className="flex flex-col items-center justify-center md:border-r md:border-primary-200 md:pr-8">
            <div className="text-5xl font-bold text-primary-900 mb-2">
              {averageRating > 0 ? averageRating.toFixed(1) : 'No'}
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-primary-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-primary-600">
              Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingStats?.[`${['oneStar', 'twoStars', 'threeStars', 'fourStars', 'fiveStars'][rating - 1]}`] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm text-primary-700 w-12">{rating} star</span>
                  <div className="flex-1 bg-primary-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-primary-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Write Review Button */}
      {isAuthenticated && !showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="flex items-center gap-2 bg-brand-brown text-white px-6 py-3 rounded-lg hover:bg-brand-tan transition-colors"
        >
          <FiEdit />
          Write a Review
        </button>
      )}

      {!isAuthenticated && (
        <div className="text-center py-4 bg-primary-50 rounded-lg">
          <p className="text-primary-600">
            Please <a href="/auth/login" className="text-brand-brown hover:underline">login</a> to write a review
          </p>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between border-b border-primary-200 pb-4">
          <h3 className="text-lg font-semibold text-primary-900">
            Customer Reviews ({totalReviews})
          </h3>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-reviews" className="text-sm text-primary-600">
              Sort by:
            </label>
            <select
              id="sort-reviews"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-primary-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-brand-brown focus:border-brand-brown"
            >
              <option value="createdAt">Most Recent</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {loading && page === 1 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown"></div>
            <p className="text-primary-600 mt-2">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-primary-50 rounded-lg">
            <FiStar className="w-12 h-12 text-primary-300 mx-auto mb-3" />
            <p className="text-primary-600 mb-2">No reviews yet</p>
            <p className="text-sm text-primary-500">Be the first to review this product!</p>
          </div>
        ) : (
          <>
            {reviews.map((review) => (
              <ReviewItem key={review._id} review={review} />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-3 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Reviews'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
