'use client';

import { useState, useEffect } from 'react';
import {
  FiX,
  FiShoppingBag,
  FiHeart,
  FiShoppingCart,
  FiTag,
  FiTrendingUp,
  FiPackage,
  FiCreditCard,
  FiDollarSign,
  FiCalendar,
  FiExternalLink,
} from 'react-icons/fi';

export default function UserHistoryModal({ userId, onClose, fetchHistory }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadHistory();
  }, [userId, currentPage]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchHistory(userId, currentPage);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentModeColor = (mode) => {
    switch (mode?.toUpperCase()) {
      case 'COD':
        return 'bg-amber-100 text-amber-800';
      case 'RAZORPAY':
      case 'STRIPE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const tabs = [
    { id: 'orders', label: 'Orders', icon: FiShoppingBag },
    { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
    { id: 'cart', label: 'Cart', icon: FiShoppingCart },
    { id: 'coupons', label: 'Coupons', icon: FiTag },
    { id: 'summary', label: 'Summary', icon: FiTrendingUp },
  ];

  if (loading && !history) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto"></div>
          <p className="text-primary-700 mt-4">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-primary-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FiTrendingUp className="w-5 h-5 text-primary-700" />
            </div>
            <h2 className="text-xl font-bold text-primary-900">User Activity History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5 text-primary-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-primary-200 px-6 flex gap-2 overflow-x-auto flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-900 text-primary-900 font-semibold'
                    : 'border-transparent text-primary-600 hover:text-primary-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                <FiShoppingBag className="w-5 h-5" />
                Order History
                {history?.orders?.pagination?.totalOrders > 0 && (
                  <span className="text-sm font-normal text-primary-600">
                    ({history.orders.pagination.totalOrders} total)
                  </span>
                )}
              </h3>

              {history?.orders?.data?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {history.orders.data.map((order) => (
                      <div
                        key={order.orderId}
                        className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-primary-900">
                                #{order.orderId}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-primary-500 mb-1">Date</p>
                                <p className="text-primary-900 font-medium">
                                  {new Date(order.date).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-primary-500 mb-1">Items</p>
                                <p className="text-primary-900 font-medium flex items-center gap-1">
                                  <FiPackage className="w-3 h-3" />
                                  {order.items}
                                </p>
                              </div>

                              <div>
                                <p className="text-primary-500 mb-1">Payment Mode</p>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPaymentModeColor(order.paymentMode)}`}>
                                  <FiCreditCard className="w-3 h-3 mr-1" />
                                  {order.paymentMode}
                                </span>
                              </div>

                              <div>
                                <p className="text-primary-500 mb-1">Payment Status</p>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                                  {order.paymentStatus}
                                </span>
                              </div>
                            </div>

                            {order.coupon && (
                              <div className="mt-2 flex items-center gap-2 text-sm">
                                <FiTag className="w-3 h-3 text-green-600" />
                                <span className="text-green-700">
                                  Coupon: {order.coupon} (Saved {formatCurrency(order.discount)})
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary-900">
                              {formatCurrency(order.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {history.orders.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-primary-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-50"
                      >
                        Previous
                      </button>
                      <span className="text-primary-700">
                        Page {currentPage} of {history.orders.pagination.totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(history.orders.pagination.totalPages, prev + 1)
                          )
                        }
                        disabled={!history.orders.pagination.hasMore}
                        className="px-4 py-2 border border-primary-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-primary-50 rounded-lg">
                  <FiShoppingBag className="w-12 h-12 text-primary-400 mx-auto mb-3" />
                  <p className="text-primary-600">No orders found</p>
                </div>
              )}
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                <FiHeart className="w-5 h-5" />
                Wishlist Activity
                {history?.wishlist?.length > 0 && (
                  <span className="text-sm font-normal text-primary-600">
                    ({history.wishlist.length} items)
                  </span>
                )}
              </h3>

              {history?.wishlist?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.wishlist.map((item) => (
                    <div
                      key={item.productId}
                      className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h4 className="font-medium text-primary-900 mb-2">{item.name}</h4>
                      <p className="text-lg font-bold text-primary-700">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-primary-50 rounded-lg">
                  <FiHeart className="w-12 h-12 text-primary-400 mx-auto mb-3" />
                  <p className="text-primary-600">No items in wishlist</p>
                </div>
              )}
            </div>
          )}

          {/* Cart Tab */}
          {activeTab === 'cart' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                <FiShoppingCart className="w-5 h-5" />
                Current Cart
                {history?.cart?.currentItems?.length > 0 && (
                  <span className="text-sm font-normal text-primary-600">
                    ({history.cart.currentItems.length} items)
                  </span>
                )}
              </h3>

              {history?.cart?.currentItems?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {history.cart.currentItems.map((item, index) => (
                      <div
                        key={index}
                        className="border border-primary-200 rounded-lg p-4 flex gap-4"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-primary-900">{item.name}</h4>
                          <p className="text-sm text-primary-600 mt-1">
                            Size: {item.size} | Qty: {item.quantity}
                          </p>
                          <p className="text-lg font-bold text-primary-700 mt-2">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {history.cart.updatedAt && (
                    <p className="text-sm text-primary-600 text-center">
                      Last updated: {new Date(history.cart.updatedAt).toLocaleString('en-IN')}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-primary-50 rounded-lg">
                  <FiShoppingCart className="w-12 h-12 text-primary-400 mx-auto mb-3" />
                  <p className="text-primary-600">Cart is empty</p>
                </div>
              )}
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                <FiTag className="w-5 h-5" />
                Coupon Usage History
                {history?.coupons?.length > 0 && (
                  <span className="text-sm font-normal text-primary-600">
                    ({history.coupons.length} used)
                  </span>
                )}
              </h3>

              {history?.coupons?.length > 0 ? (
                <div className="space-y-3">
                  {history.coupons.map((coupon, index) => (
                    <div
                      key={index}
                      className="border border-primary-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-mono font-semibold">
                            {coupon.code}
                          </span>
                          <span className="text-sm text-primary-600">
                            {new Date(coupon.dateUsed).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-sm text-primary-700">
                          Order Value: {formatCurrency(coupon.orderValue)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-primary-500">Discount</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(coupon.discount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-primary-50 rounded-lg">
                  <FiTag className="w-12 h-12 text-primary-400 mx-auto mb-3" />
                  <p className="text-primary-600">No coupons used yet</p>
                </div>
              )}
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && history?.summary && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5" />
                User Insights
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Spend */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiDollarSign className="w-6 h-6 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Total Spend</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatCurrency(history.summary.totalSpend)}
                  </p>
                </div>

                {/* Total Orders */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiShoppingBag className="w-6 h-6 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Total Orders</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">
                    {history.summary.totalOrders}
                  </p>
                </div>

                {/* Average Order Value */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiTrendingUp className="w-6 h-6 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">Avg Order Value</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {formatCurrency(history.summary.averageOrderValue)}
                  </p>
                </div>

                {/* Completed Orders */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiPackage className="w-6 h-6 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">Completed</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900">
                    {history.summary.completedOrders}
                  </p>
                </div>

                {/* Pending Orders */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiPackage className="w-6 h-6 text-yellow-600" />
                    <p className="text-sm text-yellow-700 font-medium">Pending</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900">
                    {history.summary.pendingOrders}
                  </p>
                </div>

                {/* Cancelled Orders */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiX className="w-6 h-6 text-red-600" />
                    <p className="text-sm text-red-700 font-medium">Cancelled</p>
                  </div>
                  <p className="text-3xl font-bold text-red-900">
                    {history.summary.cancelledOrders}
                  </p>
                </div>

                {/* Total Coupon Savings */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FiTag className="w-6 h-6 text-pink-600" />
                    <p className="text-sm text-pink-700 font-medium">Coupon Savings</p>
                  </div>
                  <p className="text-3xl font-bold text-pink-900">
                    {formatCurrency(history.summary.totalCouponSavings)}
                  </p>
                </div>

                {/* Last Purchase */}
                {history.summary.lastPurchaseDate && (
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <FiCalendar className="w-6 h-6 text-indigo-600" />
                      <p className="text-sm text-indigo-700 font-medium">Last Purchase</p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-900">
                      {new Date(history.summary.lastPurchaseDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
