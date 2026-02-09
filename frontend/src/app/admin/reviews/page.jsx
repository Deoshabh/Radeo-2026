'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FiStar, FiEye, FiEyeOff, FiTrash2, FiSearch, FiFilter, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminReviewsPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    rating: '',
    isHidden: '',
    verifiedPurchase: '',
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedReviews, setSelectedReviews] = useState([]);
  const searchRef = useRef(search);
  const filtersRef = useRef(filters);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.role !== 'admin') {
      router.push('/');
      toast.error('Unauthorized access');
      return;
    }
  }, [isAuthenticated, user, router]);

  const fetchReviews = useCallback(async (overrides = {}) => {
    const pageToLoad = overrides.page ?? page;
    const searchToLoad = overrides.search ?? searchRef.current;
    const filtersToLoad = overrides.filters ?? filtersRef.current;
    const sortByToLoad = overrides.sortBy ?? sortBy;
    const sortOrderToLoad = overrides.sortOrder ?? sortOrder;

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pageToLoad.toString(),
        limit: '20',
        sort: sortByToLoad,
        order: sortOrderToLoad,
      });

      if (searchToLoad) params.append('search', searchToLoad);
      if (filtersToLoad.rating) params.append('rating', filtersToLoad.rating);
      if (filtersToLoad.isHidden) params.append('isHidden', filtersToLoad.isHidden);
      if (filtersToLoad.verifiedPurchase) params.append('verifiedPurchase', filtersToLoad.verifiedPurchase);

      const response = await fetch(`${API_URL}/api/v1/admin/reviews?${params}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reviews');
      }

      setReviews(data.reviews);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Fetch reviews error:', error);
      toast.error(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [API_URL, page, sortBy, sortOrder]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchReviews();
    }
  }, [isAuthenticated, user, fetchReviews]);

  const handleSearch = (e) => {
    e.preventDefault();

    if (page !== 1) {
      setPage(1);
      return;
    }

    fetchReviews({ page: 1, search, filters });
  };

  const handleToggleHidden = async (reviewId, currentHiddenState) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/v1/admin/reviews/${reviewId}/toggle-hidden`, {
        method: 'PATCH',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle review visibility');
      }

      toast.success(data.message);
      fetchReviews();
    } catch (error) {
      console.error('Toggle hidden error:', error);
      toast.error(error.message || 'Failed to toggle review visibility');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/v1/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete review');
      }

      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Delete review error:', error);
      toast.error(error.message || 'Failed to delete review');
    }
  };

  const handleBulkHide = async (hide) => {
    if (selectedReviews.length === 0) {
      toast.error('Please select reviews first');
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/v1/admin/reviews/bulk-hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reviewIds: selectedReviews,
          hide,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update reviews');
      }

      toast.success(data.message);
      setSelectedReviews([]);
      fetchReviews();
    } catch (error) {
      console.error('Bulk hide error:', error);
      toast.error(error.message || 'Failed to update reviews');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) {
      toast.error('Please select reviews first');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedReviews.length} review(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/v1/admin/reviews/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reviewIds: selectedReviews,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete reviews');
      }

      toast.success(data.message);
      setSelectedReviews([]);
      fetchReviews();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(error.message || 'Failed to delete reviews');
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

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
                const clearedFilters = { rating: '', isHidden: '', verifiedPurchase: '' };
                setSearch('');
                setFilters(clearedFilters);

                if (page !== 1) {
                  setPage(1);
                  return;
                }

                fetchReviews({ page: 1, search: '', filters: clearedFilters });
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
                                className={`w-4 h-4 ${
                                  i < review.rating
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
                        </td>
                        <td className="px-6 py-4 text-sm text-primary-600 whitespace-nowrap">
                          {formatDate(review.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                review.isHidden
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
                              className={`p-2 rounded hover:bg-primary-100 transition-colors ${
                                review.isHidden ? 'text-green-600' : 'text-yellow-600'
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
