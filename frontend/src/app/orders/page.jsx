'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/utils/api';
import { FiPackage, FiTruck, FiCheck, FiX, FiEye, FiClock } from 'react-icons/fi';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, processing, shipped, delivered, cancelled

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await orderAPI.getMyOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <FiCheck className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <FiX className="w-5 h-5 text-red-600" />;
      case 'shipped':
        return <FiTruck className="w-5 h-5 text-blue-600" />;
      case 'processing':
        return <FiClock className="w-5 h-5 text-yellow-600" />;
      default:
        return <FiPackage className="w-5 h-5 text-primary-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-primary-100 text-primary-800 border-primary-300';
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return order.status?.toLowerCase() === filter;
  });

  if (loading || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-primary-900 mb-2">My Orders</h1>
          <p className="text-sm sm:text-base text-primary-600">Track and manage your orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-colors touch-manipulation ${
                  filter === status
                    ? 'bg-primary-900 text-white'
                    : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiPackage className="w-16 h-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-900 mb-2">No orders found</h3>
            <p className="text-primary-600 mb-6">
              {filter === 'all'
                ? "You haven't placed any orders yet."
                : `No ${filter} orders found.`}
            </p>
            <Link href="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Order Header */}
                <div className="bg-primary-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-primary-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap">
                      <div>
                        <p className="text-xs sm:text-sm text-primary-600">Order ID</p>
                        <p className="font-semibold text-sm sm:text-base text-primary-900 break-all">{order.orderId}</p>
                      </div>
                      <div className="hidden sm:block h-8 w-px bg-primary-300"></div>
                      <div>
                        <p className="text-xs sm:text-sm text-primary-600">Order Date</p>
                        <p className="font-semibold text-sm sm:text-base text-primary-900">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-primary-300"></div>
                      <div>
                        <p className="text-sm text-primary-600">Total Amount</p>
                        <p className="font-semibold text-primary-900">₹{order.totalAmount?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="font-medium capitalize">{order.status}</span>
                      </div>
                      <Link
                        href={`/orders/${order._id}`}
                        className="btn btn-secondary flex items-center gap-2"
                      >
                        <FiEye /> View Details
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <img
                          src={item.product?.images?.[0] || '/placeholder.jpg'}
                          alt={item.product?.name || 'Product'}
                          className="w-16 h-16 object-cover rounded border border-primary-200"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-primary-900">{item.product?.name || 'Product'}</h4>
                          <p className="text-sm text-primary-600">
                            Size: {item.size} | Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-primary-900">₹{item.price?.toLocaleString()}</p>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-sm text-primary-600 text-center">
                        +{order.items.length - 3} more item(s)
                      </p>
                    )}
                  </div>

                  {/* Shipping Address */}
                  <div className="mt-6 pt-6 border-t border-primary-200">
                    <p className="text-sm font-medium text-primary-700 mb-2">Shipping Address</p>
                    <p className="text-sm text-primary-900">
                      {order.shippingAddress?.fullName}
                    </p>
                    <p className="text-sm text-primary-600">
                      {order.shippingAddress?.addressLine1}, {order.shippingAddress?.city},{' '}
                      {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                    </p>
                    <p className="text-sm text-primary-600">
                      Phone: {order.shippingAddress?.phone}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
