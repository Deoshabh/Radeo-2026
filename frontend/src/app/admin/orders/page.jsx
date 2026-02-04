'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/utils/api';
import AdminLayout from '@/components/AdminLayout';
import ShiprocketShipmentModal from '@/components/ShiprocketShipmentModal';
import toast from 'react-hot-toast';
import { FiPackage, FiTruck, FiCheck, FiClock, FiEye, FiSearch, FiDownload, FiMapPin, FiX } from 'react-icons/fi';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isAuthenticated, loading, router]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await adminAPI.getAllOrders();
      // Backend returns {success, count, orders: [...]}
      console.log('📦 Admin Orders API response:', response.data);
      setOrders(response.data.orders || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
      console.error(error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleCreateShipment = (order) => {
    setSelectedOrder(order);
    setShowShipmentModal(true);
  };

  const handleTrackShipment = async (order) => {
    try {
      const response = await adminAPI.trackShipment(order._id);
      setTrackingData(response.data.data);
      setSelectedOrder(order);
      setShowTrackingModal(true);
    } catch (error) {
      toast.error('Failed to track shipment');
    }
  };

  const handleGenerateLabel = async (orderId) => {
    try {
      const response = await adminAPI.generateLabel(orderId);
      if (response.data.data?.label_url) {
        window.open(response.data.data.label_url, '_blank');
        toast.success('Label generated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate label');
    }
  };

  const handleCancelShipment = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this shipment?')) {
      return;
    }
    try {
      await adminAPI.cancelShipment(orderId);
      toast.success('Shipment cancelled successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to cancel shipment');
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
      case 'confirmed':
        return 'bg-primary-100 text-primary-800';
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
              {['all', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Shipping</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-primary-600">
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
                        ₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        {order.shipping?.awb_code ? (
                          <div className="text-sm">
                            <p className="font-medium text-blue-600">{order.shipping.courier_name}</p>
                            <p className="text-xs text-gray-600">AWB: {order.shipping.awb_code}</p>
                            {order.shipping.current_status && (
                              <p className="text-xs text-green-600">{order.shipping.current_status}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not shipped</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-primary-900 ${getStatusColor(order.status)}`}
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/orders/${order._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye />
                          </Link>
                          
                          {!order.shipping?.awb_code ? (
                            <button
                              onClick={() => handleCreateShipment(order)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Create Shipment"
                            >
                              <FiTruck />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleTrackShipment(order)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Track Shipment"
                              >
                                <FiMapPin />
                              </button>
                              {order.shipping.label_url && (
                                <button
                                  onClick={() => window.open(order.shipping.label_url, '_blank')}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Download Label"
                                >
                                  <FiDownload />
                                </button>
                              )}
                              <button
                                onClick={() => handleCancelShipment(order._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel Shipment"
                              >
                                <FiX />
                              </button>
                            </>
                          )}
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
          {['all', 'confirmed', 'processing', 'delivered'].map((status) => (
            <div key={status} className="bg-white rounded-lg shadow-md p-6">
              <p className="text-primary-600 text-sm mb-1 capitalize">{status} Orders</p>
              <p className="text-2xl font-bold text-primary-900">
                {status === 'all' ? orders.length : orders.filter((o) => o.status === status).length}
              </p>
            </div>
          ))}
        </div>

        {/* Shiprocket Shipment Modal */}
        {selectedOrder && (
          <ShiprocketShipmentModal
            order={selectedOrder}
            isOpen={showShipmentModal}
            onClose={() => {
              setShowShipmentModal(false);
              setSelectedOrder(null);
            }}
            onSuccess={fetchOrders}
          />
        )}

        {/* Tracking Modal */}
        {showTrackingModal && trackingData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Track Shipment - {selectedOrder.orderId}
                </h2>
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingData(null);
                    setSelectedOrder(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="font-semibold">AWB: {trackingData.tracking_data?.awb_code}</p>
                  <p className="text-sm">Courier: {trackingData.tracking_data?.courier_name}</p>
                  <p className="text-sm font-medium text-blue-600 mt-2">
                    Status: {trackingData.tracking_data?.shipment_status}
                  </p>
                </div>
                
                {trackingData.tracking_data?.shipment_track?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Tracking History</h3>
                    <div className="space-y-3">
                      {trackingData.tracking_data.shipment_track.map((track, idx) => (
                        <div key={idx} className="flex gap-4 border-l-2 border-blue-400 pl-4 pb-4">
                          <div className="flex-1">
                            <p className="font-medium">{track.current_status}</p>
                            <p className="text-sm text-gray-600">{track.location || 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(track.date).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
