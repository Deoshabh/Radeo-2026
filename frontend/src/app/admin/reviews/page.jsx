'use client';

import { useState, useMemo } from 'react';
import { FiStar, FiEye, FiEyeOff, FiTrash2, FiSearch, FiCheck, FiMessageSquare, FiSend, FiCornerDownRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useReviews, useToggleReviewHidden, useDeleteReview, useBulkHideReviews, useBulkDeleteReviews, useReplyToReview, useDeleteReviewReply } from '@/hooks/useAdmin';
import { formatDate } from '@/utils/helpers';

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    rating: '',
    isHidden: '',
    verifiedPurchase: '',
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Build query params for React Query
  const queryParams = useMemo(() => {
    const params = { page, limit: 20, sort: sortBy, order: sortOrder };
    if (search) params.search = search;
    if (filters.rating) params.rating = filters.rating;
    if (filters.isHidden) params.isHidden = filters.isHidden;
    if (filters.verifiedPurchase) params.verifiedPurchase = filters.verifiedPurchase;
    return params;
  }, [page, sortBy, sortOrder, search, filters]);

  const { data: reviewsData, isLoading: loading } = useReviews(queryParams);
  const reviews = reviewsData?.reviews || [];
  const stats = reviewsData?.stats || null;
  const totalPages = reviewsData?.pagination?.totalPages || 1;

  // Mutation hooks
  const toggleHiddenMut = useToggleReviewHidden();
  const deleteReviewMut = useDeleteReview();
  const bulkHideMut = useBulkHideReviews();
  const bulkDeleteMut = useBulkDeleteReviews();
  const replyMut = useReplyToReview();
  const deleteReplyMut = useDeleteReviewReply();

  const handleSearch = (e) => {
    e.preventDefault();
    if (page !== 1) setPage(1);
    // query re-runs automatically via queryParams change
  };

  const handleToggleHidden = (reviewId) => toggleHiddenMut.mutate(reviewId);

  const handleDeleteReview = (reviewId) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    deleteReviewMut.mutate(reviewId);
  };

  const handleBulkHide = (hide) => {
    if (selectedReviews.length === 0) { toast.error('Please select reviews first'); return; }
    bulkHideMut.mutate({ reviewIds: selectedReviews, hide }, { onSuccess: () => setSelectedReviews([]) });
  };

  const handleBulkDelete = () => {
    if (selectedReviews.length === 0) { toast.error('Please select reviews first'); return; }
    if (!confirm(`Are you sure you want to delete ${selectedReviews.length} review(s)? This action cannot be undone.`)) return;
    bulkDeleteMut.mutate(selectedReviews, { onSuccess: () => setSelectedReviews([]) });
  };

  const toggleSelectReview = (reviewId) => {
    setSelectedReviews((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map((r) => r._id));
    }
  };

  return (
      <div className="min-h-screen bg-primary-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-primary-900 mb-2">Review Management</h1>
            <p className="text-primary-600">Manage customer product reviews</p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-primary-600 mb-1">Total Reviews</div>
                <div className="text-2xl font-bold text-primary-900">{stats.totalReviews}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-primary-600 mb-1">Average Rating</div>
                <div className="text-2xl font-bold text-primary-900">{stats.averageRating.toFixed(1)} ⭐</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-primary-600 mb-1">Hidden</div>
                <div className="text-2xl font-bold text-red-600">{stats.hiddenReviews}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-primary-600 mb-1">Verified</div>
                <div className="text-2xl font-bold text-green-600">{stats.verifiedReviews}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-primary-600 mb-1">With Photos</div>
                <div className="text-2xl font-bold text-primary-900">{stats.totalPhotos}</div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reviews by title or comment..."
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-brand-brown"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-tan transition-colors"
                >
                  <FiSearch className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                  className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-brand-brown"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>

                <select
                  value={filters.isHidden}
                  onChange={(e) => setFilters({ ...filters, isHidden: e.target.value })}
                  className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-brand-brown"
                >
                  <option value="">All Reviews</option>
                  <option value="false">Visible</option>
                  <option value="true">Hidden</option>
                </select>

                <select
                  value={filters.verifiedPurchase}
                  onChange={(e) => setFilters({ ...filters, verifiedPurchase: e.target.value })}
                  className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-brand-brown"
                >
                  <option value="">All Purchases</option>
                  <option value="true">Verified Only</option>
                  <option value="false">Unverified</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-brand-brown focus:border-brand-brown"
                >
                  <option value="createdAt">Date</option>
                  <option value="rating">Rating</option>
                  <option value="helpfulVotes">Helpful Votes</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilters({ rating: '', isHidden: '', verifiedPurchase: '' });
                  setPage(1);
                }}
                className="text-sm text-brand-brown hover:underline"
              >
                Clear Filters
              </button>
            </form>
          </div>

          {/* Bulk Actions */}
          {selectedReviews.length > 0 && (
            <div className="bg-brand-brown text-white rounded-lg shadow mb-6 p-4 flex items-center justify-between">
              <span>{selectedReviews.length} review(s) selected</span>
              <div className="flex gap-3">
                <button
                  onClick={() => handleBulkHide(true)}
                  className="px-4 py-2 bg-white text-brand-brown rounded hover:bg-primary-50 transition-colors"
                >
                  Hide Selected
                </button>
                <button
                  onClick={() => handleBulkHide(false)}
                  className="px-4 py-2 bg-white text-brand-brown rounded hover:bg-primary-50 transition-colors"
                >
                  Unhide Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Reviews Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown"></div>
                <p className="text-primary-600 mt-2">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-primary-600">No reviews found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-primary-200">
                    <thead className="bg-primary-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedReviews.length === reviews.length}
                            onChange={toggleSelectAll}
                            className="rounded border-primary-300 text-brand-brown focus:ring-brand-brown"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                          Review
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-primary-200">
                      {reviews.map((review) => (
                        <tr key={review._id} className={review.isHidden ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedReviews.includes(review._id)}
                              onChange={() => toggleSelectReview(review._id)}
                              className="rounded border-primary-300 text-brand-brown focus:ring-brand-brown"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-primary-900">
                              {review.product?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-primary-500">
                              {review.photoCount > 0 && `📷 ${review.photoCount} photos`}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-primary-900">{review.user?.name || 'Unknown'}</div>
                            <div className="text-xs text-primary-500">{review.user?.email || ''}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <FiStar
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-primary-300'
                                    }`}
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-md">
                            <div className="text-sm font-medium text-primary-900 mb-1">{review.title}</div>
                            <div className="text-sm text-primary-600 line-clamp-2">{review.comment}</div>
                            <div className="text-xs text-primary-500 mt-1">
                              👍 {review.helpfulVotes} helpful
                            </div>

                            {/* Existing admin reply */}
                            {review.adminReply?.text && replyingTo !== review._id && (
                              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
                                  <FiCornerDownRight className="w-3 h-3" /> Admin Reply
                                </div>
                                <p className="text-xs text-blue-900">{review.adminReply.text}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-blue-500">{review.adminReply.repliedAt ? formatDate(review.adminReply.repliedAt) : ''}</span>
                                  <button onClick={() => { setReplyingTo(review._id); setReplyText(review.adminReply.text); }}
                                    className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                  <button onClick={() => deleteReplyMut.mutate(review._id)}
                                    className="text-[10px] text-red-500 hover:text-red-700 font-medium">Delete</button>
                                </div>
                              </div>
                            )}

                            {/* Reply composer */}
                            {replyingTo === review._id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write a reply visible to the customer..."
                                  rows={3}
                                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if (!replyText.trim()) return;
                                      replyMut.mutate({ id: review._id, text: replyText.trim() }, {
                                        onSuccess: () => { setReplyingTo(null); setReplyText(''); },
                                      });
                                    }}
                                    disabled={replyMut.isPending || !replyText.trim()}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    <FiSend className="w-3 h-3" /> {replyMut.isPending ? 'Sending...' : 'Post Reply'}
                                  </button>
                                  <button
                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                    className="px-3 py-1.5 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : !review.adminReply?.text && (
                              <button
                                onClick={() => { setReplyingTo(review._id); setReplyText(''); }}
                                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <FiMessageSquare className="w-3 h-3" /> Reply
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-primary-600 whitespace-nowrap">
                            {formatDate(review.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${review.isHidden
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                                  }`}
                              >
                                {review.isHidden ? 'Hidden' : 'Visible'}
                              </span>
                              {review.verifiedPurchase && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <FiCheck className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleHidden(review._id, review.isHidden)}
                                className={`p-2 rounded hover:bg-primary-100 transition-colors ${review.isHidden ? 'text-green-600' : 'text-yellow-600'
                                  }`}
                                title={review.isHidden ? 'Unhide review' : 'Hide review'}
                              >
                                {review.isHidden ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review._id)}
                                className="p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
                                title="Delete review"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 bg-primary-50 border-t border-primary-200 flex items-center justify-between">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-primary-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-primary-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-primary-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
  );
}
