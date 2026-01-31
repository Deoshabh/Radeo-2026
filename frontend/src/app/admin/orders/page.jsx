'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/utils/api';
import AdminLayout from '@/components/AdminLayout';
import toast from 'react-hot-toast';
import { FiPackage, FiTruck, FiCheck, FiClock, FiEye, FiSearch } from 'react-icons/fi';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await adminAPI.getAllOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
      console.error(error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <FiCheck className="w-4 h-4" />;
      case 'shipped':
        return <FiTruck className="w-4 h-4" />;
      case 'processing':
        return <FiClock className="w-4 h-4" />;
      default:
        return <FiPackage className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-primary-100 text-primary-800';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status?.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Orders Management</h1>
          <p className="text-sm sm:text-base text-primary-600 mt-1">Track and manage customer orders</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="text"
                placeholder="Search by order ID or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors touch-manipulation ${
                    filterStatus === status
                      ? 'bg-primary-900 text-white'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50 border-b border-primary-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-primary-600">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary-900">{order.orderId}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-primary-900">{order.user?.name || 'N/A'}</p>
                          <p className="text-sm text-primary-600">{order.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-primary-700">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-semibold text-primary-900">
                        ₹{order.totalAmount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-primary-900 ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <Link
                            href={`/orders/${order._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {['all', 'pending', 'processing', 'delivered'].map((status) => (
            <div key={status} className="bg-white rounded-lg shadow-md p-6">
              <p className="text-primary-600 text-sm mb-1 capitalize">{status} Orders</p>
              <p className="text-2xl font-bold text-primary-900">
                {status === 'all' ? orders.length : orders.filter((o) => o.status === status).length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
