import { useState, useEffect } from 'react';
import { FiX, FiShoppingBag, FiHeart, FiShoppingCart, FiTag, FiPackage, FiTrendingUp } from 'react-icons/fi';
import { adminAPI } from '@/utils/api';
import toast from 'react-hot-toast';

export default function UserHistoryModal({ userId, userName, onClose }) {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!userId) return;
    fetchUserHistory();
  }, [userId]);

  const fetchUserHistory = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await adminAPI.getUserHistory(userId);
      setHistoryData(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch user history');
      console.error('Failed to fetch user history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiTrendingUp },
    { id: 'orders', label: 'Orders', icon: FiShoppingBag },
    { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
    { id: 'cart', label: 'Cart', icon: FiShoppingCart },
    { id: 'coupons', label: 'Coupons', icon: FiTag },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Processing': 'bg-blue-100 text-blue-800',
      'Shipped': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Refunded': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-200">
          <h3 className="text-xl font-semibold text-primary-900">
            User Activity History - {userName}
          </h3>
          <button
            onClick={onClose}
            className="text-primary-500 hover:text-primary-700 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-primary-200 px-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-primary-900 border-b-2 border-primary-900'
                    : 'text-primary-600 hover:text-primary-900'
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
            </div>
          ) : historyData ? (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Total Orders</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">
                            {historyData.statistics.totalOrders}
                          </p>
                        </div>
                        <FiShoppingBag className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 font-medium">Total Spent</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">
                            {formatCurrency(historyData.statistics.totalSpent)}
                          </p>
                        </div>
                        <FiTrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-700 font-medium">Completed</p>
                          <p className="text-2xl font-bold text-purple-900 mt-1">
                            {historyData.statistics.completedOrders}
                          </p>
                        </div>
                        <FiPackage className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-pink-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-pink-700 font-medium">Wishlist Items</p>
                          <p className="text-2xl font-bold text-pink-900 mt-1">
                            {historyData.statistics.wishlistItems}
                          </p>
                        </div>
                        <FiHeart className="w-8 h-8 text-pink-600" />
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-700 font-medium">Cart Items</p>
                          <p className="text-2xl font-bold text-orange-900 mt-1">
                            {historyData.statistics.cartItems}
                          </p>
                        </div>
                        <FiShoppingCart className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-yellow-700 font-medium">Coupons Used</p>
                          <p className="text-2xl font-bold text-yellow-900 mt-1">
                            {historyData.statistics.couponsUsed}
                          </p>
                        </div>
                        <FiTag className="w-8 h-8 text-yellow-600" />
                      </div>
                    </div>
                  </div>

                  {historyData.statistics.totalOrders === 0 && (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <p className="text-gray-600">This user hasn't made any purchases yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {historyData.orders.length === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <FiShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No orders found</p>
                    </div>
                  ) : (
                    historyData.orders.map((order) => (
                      <div key={order._id} className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-primary-900">Order #{order.orderId}</p>
                            <p className="text-sm text-primary-600">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-primary-700">
                            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                          </p>
                          <p className="font-semibold text-primary-900">{formatCurrency(order.total)}</p>
                        </div>
                        {order.coupon && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <FiTag className="w-4 h-4 text-green-600" />
                            <span className="text-green-700">
                              Coupon: <strong>{order.coupon.code}</strong> - Saved {formatCurrency(order.coupon.discount)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <div className="space-y-4">
                  {historyData.wishlist.count === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <FiHeart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Wishlist is empty</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {historyData.wishlist.products.map((product) => (
                        <div key={product._id} className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-40 object-cover rounded-md mb-3"
                            />
                          )}
                          <p className="font-medium text-primary-900 mb-1">{product.name}</p>
                          <p className="text-primary-700 font-semibold">{formatCurrency(product.price)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cart Tab */}
              {activeTab === 'cart' && (
                <div className="space-y-4">
                  {historyData.cart.itemCount === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <FiShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800">
                          <strong>Active Cart:</strong> This user has {historyData.cart.itemCount} item(s) in their cart that haven't been purchased yet.
                        </p>
                      </div>
                      {historyData.cart.items.map((item, index) => (
                        <div key={index} className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            {item.product?.images && item.product.images.length > 0 && (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-primary-900">{item.product?.name || 'Product'}</p>
                              <p className="text-sm text-primary-600 mt-1">
                                Size: {item.size} | Quantity: {item.quantity}
                              </p>
                              {item.product?.price && (
                                <p className="text-primary-700 font-semibold mt-1">
                                  {formatCurrency(item.product.price * item.quantity)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Coupons Tab */}
              {activeTab === 'coupons' && (
                <div className="space-y-4">
                  {historyData.couponsUsed.length === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <FiTag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No coupons used yet</p>
                    </div>
                  ) : (
                    historyData.couponsUsed.map((coupon, index) => (
                      <div key={index} className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                              <FiTag className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-primary-900 text-lg">{coupon.code}</p>
                              <p className="text-sm text-primary-600 mt-1">
                                Used on {new Date(coupon.date).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-sm text-primary-600 mt-1">
                                Order: #{coupon.orderId}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-primary-600">Discount</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(coupon.discount)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800">Failed to load user history</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-primary-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
