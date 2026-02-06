'use client';

/**
 * Enhanced Admin Orders Dashboard
 * Features: Quick actions, risk flags, aging indicators, bulk operations, timeline
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/utils/api';
import { exportOrdersToCSV } from '@/utils/exportCSV';
import AdminLayout from '@/components/AdminLayout';
import ShiprocketShipmentModal from '@/components/ShiprocketShipmentModal';
import OrderTimelinePanel from '@/components/OrderTimelinePanel';
import ViewContactModal from '@/components/ViewContactModal';
import BulkActionsBar from '@/components/BulkActionsBar';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import UserHistoryModal from '@/components/UserHistoryModal';
import toast from 'react-hot-toast';
import {
  FiPackage,
  FiTruck,
  FiCheck,
  FiClock,
  FiEye,
  FiSearch,
  FiMapPin,
  FiPrinter,
  FiEdit2,
  FiAlertTriangle,
  FiAlertCircle,
  FiDollarSign,
  FiCreditCard,
  FiCheckCircle,
  FiX,
  FiDownload,
} from 'react-icons/fi';

export default function AdminOrdersDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserHistory, setShowUserHistory] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isAuthenticated, loading, router]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await adminAPI.getAllOrders();
      console.log('📦 Admin Orders:', response.data);
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

  // Selection handlers
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o._id));
    }
  };

  useEffect(() => {
    setShowBulkActions(selectedOrders.length > 0);
  }, [selectedOrders]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingAddress?.fullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      order.shipping?.awb_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });



  // Get aging indicator color
  const getAgingColor = (ageInHours) => {
    if (ageInHours < 2) return 'text-green-600';
    if (ageInHours < 12) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get risk badge
  const renderRiskBadges = (riskAnalysis) => {
    if (!riskAnalysis || !riskAnalysis.hasRisks) return null;

    return (
      <div className="flex gap-1 flex-wrap">
        {riskAnalysis.risks.map((risk, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
              risk.severity === 'high'
                ? 'bg-red-100 text-red-700'
                : 'bg-orange-100 text-orange-700'
            }`}
            title={risk.message}
          >
            <FiAlertTriangle className="text-xs" />
            {risk.type.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    );
  };

  // Action handlers
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleCreateShipment = (order) => {
    setSelectedOrder(order);
    setShowShipmentModal(true);
  };

  const handlePrintLabel = async (order) => {
    if (!order.shipping?.label_url) {
      toast.error('Label not available');
      return;
    }
    window.open(order.shipping.label_url, '_blank');
    toast.success('Opening label...');
  };

  const handleViewTracking = (order) => {
    setSelectedOrder(order);
    setExpandedRow(expandedRow === order._id ? null : order._id);
  };

  const handleViewAddress = (order) => {
    // View address and contact information (read-only)
    setSelectedOrder(order);
    setShowContactModal(true);
  };

  const handleViewUserHistory = (order) => {
    if (order.user?._id && order.shippingAddress?.fullName) {
      setSelectedUser({
        id: order.user._id,
        name: order.shippingAddress.fullName
      });
      setShowUserHistory(true);
    } else {
      toast.error('User information not available');
    }
  };

  // CSV Export handler
  const handleExportCSV = () => {
    try {
      exportOrdersToCSV(filteredOrders, `orders-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`Exported ${filteredOrders.length} orders to CSV`);
    } catch (error) {
      toast.error('Failed to export orders');
    }
  };

  // Bulk action handlers
  const handleBulkCreateShipments = async () => {
    if (selectedOrders.length === 0) return;

    try {
      const response = await adminAPI.bulkCreateShipments(selectedOrders);
      toast.success(
        `Processed ${selectedOrders.length} orders: ${response.data.results.success.length} successful`
      );
      fetchOrders();
      setSelectedOrders([]);
    } catch (error) {
      toast.error('Bulk shipment creation failed');
    }
  };

  const handleBulkPrintLabels = async () => {
    if (selectedOrders.length === 0) return;

    try {
      const response = await adminAPI.bulkPrintLabels(selectedOrders);
      const labels = response.data.labels;

      if (labels.length === 0) {
        toast.error('No labels available');
        return;
      }

      // Create download links for each label
      labels.forEach((label, index) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = label.labelUrl;
          link.target = '_blank';
          link.download = `label_${label.orderId || index + 1}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 100); // Stagger downloads to avoid popup blockers
      });

      toast.success(`Prepared ${labels.length} labels for download. Check your downloads folder.`);
    } catch (error) {
      console.error('Bulk print labels error:', error);
      toast.error('Failed to print labels');
    }
  };

  const handleBulkUpdateStatus = async (status) => {
    if (selectedOrders.length === 0) return;

    try {
      await adminAPI.bulkUpdateStatus(selectedOrders, status);
      toast.success(`Updated ${selectedOrders.length} orders to ${status}`);
      fetchOrders();
      setSelectedOrders([]);
    } catch (error) {
      toast.error('Bulk status update failed');
    }
  };

  if (loading || loadingOrders) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600 mt-1">
              {filteredOrders.length} orders
              {selectedOrders.length > 0 && ` • ${selectedOrders.length} selected`}
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload />
            Export CSV
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order ID, customer name, AWB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <BulkActionsBar
            selectedCount={selectedOrders.length}
            onCreateShipments={handleBulkCreateShipments}
            onPrintLabels={handleBulkPrintLabels}
            onMarkProcessing={() => handleBulkUpdateStatus('processing')}
            onCancel={() => setSelectedOrders([])}
          />
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        filteredOrders.length > 0 &&
                        selectedOrders.length === filteredOrders.length
                      }
                      onChange={selectAllOrders}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <React.Fragment key={order._id}>
                    <tr className="hover:bg-gray-50">
                      {/* Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => toggleOrderSelection(order._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Order ID */}
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {order.orderId}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </div>
                          {order.shipping?.awb_code && (
                            <div className="text-xs text-blue-600 font-mono">
                              AWB: {order.shipping.awb_code}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <div>
                          <button
                            onClick={() => handleViewUserHistory(order)}
                            className="font-medium text-primary-700 hover:text-primary-900 hover:underline text-left transition-colors"
                            title="View User History"
                          >
                            {order.shippingAddress?.fullName}
                          </button>
                          <div className="text-xs text-gray-500">
                            {order.shippingAddress?.phone}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.shippingAddress?.city},{' '}
                            {order.shippingAddress?.postalCode}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Risks */}
                      <td className="px-4 py-4">
                        {renderRiskBadges(order.riskAnalysis)}
                      </td>

                      {/* Age */}
                      <td className="px-4 py-4">
                        <div
                          className={`flex items-center gap-1 text-sm font-medium ${getAgingColor(
                            order.ageInHours
                          )}`}
                        >
                          <FiClock />
                          {order.ageInHours}h
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            ₹{(order.total || order.totalAmount || 0).toLocaleString('en-IN')}
                          </span>
                          {order.payment?.method === 'cod' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800">
                              <FiDollarSign className="text-xs" />
                              COD
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800">
                              <FiCreditCard className="text-xs" />
                              Online
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {/* View Details */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(order);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>

                          {/* Create Shipment */}
                          {!order.shipping?.awb_code && order.status === 'confirmed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateShipment(order);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hover:scale-110"
                              title="Create Shipment"
                            >
                              <FiPackage className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print Label */}
                          {order.shipping?.label_url && (
                            <button
                              onClick={() => handlePrintLabel(order)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Print Label"
                            >
                              <FiPrinter />
                            </button>
                          )}

                          {/* View Tracking */}
                          {order.shipping?.trackingHistory?.length > 0 && (
                            <button
                              onClick={() => handleViewTracking(order)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="View Timeline"
                            >
                              <FiTruck />
                            </button>
                          )}

                          {/* View Shipping Address */}
                          <button
                            onClick={() => handleViewAddress(order)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                            title="View Shipping Address"
                          >
                            <FiMapPin />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Timeline */}
                    {expandedRow === order._id && (
                      <tr>
                        <td colSpan="9" className="px-4 py-4 bg-gray-50">
                          <OrderTimelinePanel order={order} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <ShiprocketShipmentModal
          order={selectedOrder}
          isOpen={showShipmentModal}
          onClose={() => {
            setShowShipmentModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            setShowShipmentModal(false);
            setSelectedOrder(null);
            fetchOrders();
          }}
        />
      )}

      {/* View Contact Modal */}
      {showContactModal && selectedOrder && (
        <ViewContactModal
          order={selectedOrder}
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* User History Modal */}
      {showUserHistory && selectedUser && (
        <UserHistoryModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          onClose={() => {
            setShowUserHistory(false);
            setSelectedUser(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
