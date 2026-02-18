'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatPrice } from '@/utils/helpers';
import { useAuth } from '@/context/AuthContext';
import { useCoupons, useCouponStats, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, useToggleCouponStatus } from '@/hooks/useAdmin';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiTag, FiCalendar, FiBarChart2, FiGrid } from 'react-icons/fi';

export default function CouponsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: couponsRaw, isLoading: loading } = useCoupons();
  const coupons = Array.isArray(couponsRaw) ? couponsRaw : (couponsRaw?.coupons || []);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'performance'
  const { data: statsRaw, isLoading: statsLoading } = useCouponStats(viewMode === 'performance');
  const stats = Array.isArray(statsRaw) ? statsRaw : [];
  const createCouponMut = useCreateCoupon();
  const updateCouponMut = useUpdateCoupon();
  const deleteCouponMut = useDeleteCoupon();
  const toggleStatusMut = useToggleCouponStatus();
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [sortField, setSortField] = useState('totalRevenue');
  const [sortDir, setSortDir] = useState('desc');

  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: '',
    minPurchase: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
  });

  const sortedStats = [...stats].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-xs opacity-50">
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditMode(true);
      setSelectedCoupon(coupon);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.minPurchase || '',
        maxDiscount: coupon.maxDiscount || '',
        usageLimit: coupon.usageLimit || '',
        validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
        validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
        isActive: coupon.isActive,
      });
    } else {
      setEditMode(false);
      setSelectedCoupon(null);
      setFormData({
        code: '',
        type: 'percent',
        value: '',
        minPurchase: '',
        maxDiscount: '',
        usageLimit: '',
        validFrom: '',
        validUntil: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedCoupon(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase(),
        minOrder: Number(formData.minPurchase) || 0,
        expiry: formData.validUntil,
        validFrom: formData.validFrom,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        // maxDiscount is not supported by backend yet
      };

      if (editMode) {
        updateCouponMut.mutate({ id: selectedCoupon._id, data });
      } else {
        createCouponMut.mutate(data);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Failed to save coupon:', error);
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = (id, code) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    deleteCouponMut.mutate(id);
  };

  const handleToggleStatus = (id) => {
    toggleStatusMut.mutate(id);
  };

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex justify-center items-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-primary-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Coupons</h1>
              <p className="text-sm sm:text-base text-primary-600 mt-1">Manage discount coupons</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-white border border-primary-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 transition-colors ${viewMode === 'cards' ? 'bg-primary-900 text-white' : 'text-primary-600 hover:bg-primary-50'}`}
                  title="Card view"
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('performance')}
                  className={`p-2 transition-colors ${viewMode === 'performance' ? 'bg-primary-900 text-white' : 'text-primary-600 hover:bg-primary-50'}`}
                  title="Performance view"
                >
                  <FiBarChart2 className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="btn btn-primary flex items-center gap-2 justify-center flex-1 sm:flex-none touch-manipulation"
              >
                <FiPlus />
                Add Coupon
              </button>
            </div>
          </div>

          {/* Performance Table */}
          {viewMode === 'performance' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {statsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="spinner"></div>
                </div>
              ) : stats.length === 0 ? (
                <div className="text-center py-12 text-primary-500">
                  No coupon usage data yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary-50 border-b border-primary-200 text-left">
                        <th className="px-4 py-3 font-semibold text-primary-700">Code</th>
                        <th className="px-4 py-3 font-semibold text-primary-700">Discount</th>
                        <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('usedCount')}>
                          Usage<SortIcon field="usedCount" />
                        </th>
                        <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('totalOrders')}>
                          Orders<SortIcon field="totalOrders" />
                        </th>
                        <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('totalRevenue')}>
                          Revenue<SortIcon field="totalRevenue" />
                        </th>
                        <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('totalDiscount')}>
                          Discount Given<SortIcon field="totalDiscount" />
                        </th>
                        <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('uniqueUsers')}>
                          Users<SortIcon field="uniqueUsers" />
                        </th>
                        <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('avgOrderValue')}>
                          Avg Order<SortIcon field="avgOrderValue" />
                        </th>
                        <th className="px-4 py-3 font-semibold text-primary-700">Last Used</th>
                        <th className="px-4 py-3 font-semibold text-primary-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-100">
                      {sortedStats.map((s) => {
                        const expired = s.expiry && new Date(s.expiry) < new Date();
                        const usageRatio = s.usageLimit ? s.usedCount / s.usageLimit : null;
                        return (
                          <tr key={s._id} className="hover:bg-primary-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-mono font-semibold text-primary-900">{s.code}</span>
                              {s.description && <p className="text-xs text-primary-400 mt-0.5 truncate max-w-[160px]">{s.description}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium text-xs">
                                {s.type === 'percent' ? `${s.value}%` : formatPrice(s.value)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span>{s.usedCount}</span>
                                {s.usageLimit && (
                                  <>
                                    <span className="text-primary-400">/</span>
                                    <span className="text-primary-400">{s.usageLimit}</span>
                                    <div className="w-12 h-1.5 bg-primary-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${usageRatio >= 0.9 ? 'bg-red-500' : usageRatio >= 0.7 ? 'bg-amber-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(usageRatio * 100, 100)}%` }}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium">{s.totalOrders}</td>
                            <td className="px-4 py-3 font-semibold text-green-700">{formatPrice(s.totalRevenue)}</td>
                            <td className="px-4 py-3 text-red-600">{formatPrice(s.totalDiscount)}</td>
                            <td className="px-4 py-3">{s.uniqueUsers}</td>
                            <td className="px-4 py-3">{s.avgOrderValue ? formatPrice(s.avgOrderValue) : '—'}</td>
                            <td className="px-4 py-3 text-primary-500 text-xs">
                              {s.lastUsed ? formatDate(s.lastUsed) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                expired ? 'bg-gray-100 text-gray-600' :
                                s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {expired ? 'Expired' : s.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Coupons Grid */}
          {viewMode === 'cards' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {coupons.map((coupon) => (
              <div
                key={coupon._id}
                className={`bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow ${isExpired(coupon.validUntil) ? 'opacity-60' : ''
                  }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FiTag className="w-5 h-5 text-primary-600" />
                      <h3 className="text-xl font-bold text-primary-900">
                        {coupon.code}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {coupon.type === 'percent' ? (
                        <span className="text-2xl font-bold text-brand-brown">
                          {coupon.value}% OFF
                        </span>
                      ) : (
                        <span className="text-2xl font-bold text-brand-brown">
                          {formatPrice(coupon.value)} OFF
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${coupon.isActive && !isExpired(coupon.validUntil)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {isExpired(coupon.validUntil) ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-primary-600 mb-4">
                  {coupon.minPurchase && (
                    <p>• Min. purchase: {formatPrice(coupon.minPurchase)}</p>
                  )}
                  {coupon.maxDiscount && coupon.type === 'percent' && (
                    <p>• Max. discount: {formatPrice(coupon.maxDiscount)}</p>
                  )}
                  {coupon.usageLimit && (
                    <p>• Usage limit: {coupon.usageLimit} times (Used: {coupon.usedCount || 0})</p>
                  )}
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    <span>Valid: {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-primary-100">
                  <button
                    onClick={() => handleToggleStatus(coupon._id, coupon.isActive)}
                    disabled={isExpired(coupon.validUntil)}
                    className="flex-1 px-3 py-2 text-sm border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {coupon.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleOpenModal(coupon)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-manipulation"
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon._id, coupon.code)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {coupons.length === 0 && (
            <div className="text-center py-12">
              <p className="text-primary-600">No coupons found. Create your first coupon!</p>
            </div>
          )}
          }
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-primary-200 px-4 sm:px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary-900">
                  {editMode ? 'Edit Coupon' : 'Add New Coupon'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-primary-100 rounded-lg transition-colors touch-manipulation"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900 uppercase"
                    placeholder="e.g., SAVE20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">
                      Discount Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    >
                      <option value="percent">Percentage</option>
                      <option value="flat">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">
                      {formData.type === 'percent' ? 'Percentage (%)' : 'Amount (₹)'} *
                    </label>
                    <input
                      type="number"
                      name="value"
                      value={formData.value}
                      onChange={handleChange}
                      required
                      min="1"
                      max={formData.type === 'percent' ? '100' : undefined}
                      className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                      placeholder={formData.type === 'percent' ? '10' : '500'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">
                      Min. Purchase (₹)
                    </label>
                    <input
                      type="number"
                      name="minPurchase"
                      value={formData.minPurchase}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                      placeholder="e.g., 1000"
                    />
                  </div>

                  {formData.type === 'percent' && (
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-2">
                        Max. Discount (₹)
                      </label>
                      <input
                        type="number"
                        name="maxDiscount"
                        value={formData.maxDiscount}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                        placeholder="e.g., 500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    placeholder="e.g., 100 (leave empty for unlimited)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">
                      Valid From
                    </label>
                    <input
                      type="date"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      name="validUntil"
                      value={formData.validUntil}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-900 rounded focus:ring-2 focus:ring-primary-900"
                    />
                    <span className="text-sm font-medium text-primary-900">Active Coupon</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn btn-primary touch-manipulation"
                  >
                    {editMode ? 'Update Coupon' : 'Create Coupon'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 btn btn-secondary touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
