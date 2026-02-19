'use client';

/**
 * Enhanced Admin Orders Dashboard
 * Features: Quick actions, risk flags, aging indicators, bulk operations, timeline
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/utils/api';
import { useOrders, useTrackShipment, useShiprocketSync, useBulkCreateShipments, useBulkUpdateOrderStatus } from '@/hooks/useAdmin';
import { exportOrdersToCSV } from '@/utils/exportCSV';
import ShiprocketShipmentModal from '@/components/ShiprocketShipmentModal';
import OrderTimelinePanel from '@/components/OrderTimelinePanel';
import ViewContactModal from '@/components/ViewContactModal';
import BulkActionsBar from '@/components/BulkActionsBar';
import OrderDrawer from '@/components/admin/orders/OrderDrawer';
import OrderKanbanBoard from '@/components/admin/orders/OrderKanbanBoard';
import UserHistoryModal from '@/components/UserHistoryModal';
import { formatPrice } from '@/utils/helpers';
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
  FiRefreshCw,
  FiFileText,
  FiList,
  FiColumns,
} from 'react-icons/fi';

export default function AdminOrdersDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Sorting State
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter & Selection State
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Modal & View State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showUserHistory, setShowUserHistory] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'

  // ── Debounced search ────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, sortBy, sortOrder]);

  // Clear selection when query params change
  useEffect(() => { setSelectedOrders([]); }, [currentPage, debouncedSearch, filterStatus, sortBy, sortOrder]);

  // ── React Query: orders list ────────────────────────────────────
  const queryParams = useMemo(() => ({
    page: currentPage, limit,
    status: filterStatus,
    search: debouncedSearch,
    sortBy, order: sortOrder,
  }), [currentPage, limit, filterStatus, debouncedSearch, sortBy, sortOrder]);

  const { data: ordersData, isLoading: loadingOrders, refetch: refetchOrders } = useOrders(queryParams);
  const orders = ordersData?.orders || [];
  const totalPages = ordersData?.totalPages || 1;
  const totalOrders = ordersData?.totalOrders || 0;

  // ── Mutation hooks ──────────────────────────────────────────────
  const trackMut = useTrackShipment();
  const syncMut = useShiprocketSync();
  const bulkCreateMut = useBulkCreateShipments();
  const bulkStatusMut = useBulkUpdateOrderStatus();

  // Selection handlers
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o._id));
    }
  };

  useEffect(() => {
    setShowBulkActions(selectedOrders.length > 0);
  }, [selectedOrders]);


  // Handlers for Sort and Page
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };




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
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${risk.severity === 'high'
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
    trackMut.mutate(order._id, {
      onSettled: () => {
        setSelectedOrder(order);
        setExpandedRow(expandedRow === order._id ? null : order._id);
      },
    });
  };

  const handleGenerateInvoice = async (order) => {
    try {
      const response = await adminAPI.generateInvoice(order._id);
      const invoiceUrl =
        response.data?.data?.invoice_url ||
        response.data?.data?.data?.invoice_url ||
        response.data?.data?.response?.invoice_url ||
        null;

      await refetchOrders();

      if (invoiceUrl) {
        window.open(invoiceUrl, '_blank');
        toast.success('Invoice generated successfully');
      } else {
        toast.success('Invoice generated. Refreshing latest order data.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
    }
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
  const handleExportCSV = async () => {
    try {
      const toastId = toast.loading('Preparing CSV export...');

      // Fetch all orders matching current filters
      const response = await adminAPI.getAllOrders({
        page: 1,
        limit: 10000, // Large limit to get all
        status: filterStatus,
        search: searchQuery,
        sortBy,
        order: sortOrder
      });

      const allOrders = response.data.orders || [];

      exportOrdersToCSV(allOrders, `orders-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`Exported ${allOrders.length} orders to CSV`, { id: toastId });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders');
    }
  };

  const handleRunShiprocketSync = () => {
    syncMut.mutate();
  };

  // Bulk action handlers
  const handleBulkCreateShipments = () => {
    if (selectedOrders.length === 0) return;
    bulkCreateMut.mutate(selectedOrders, {
      onSuccess: () => setSelectedOrders([]),
    });
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

  const handleBulkUpdateStatus = (status) => {
    if (selectedOrders.length === 0) return;
    bulkStatusMut.mutate({ orderIds: selectedOrders, status }, {
      onSuccess: () => setSelectedOrders([]),
    });
  };

  if (loading || loadingOrders) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600 mt-1">
              {orders.length} orders
              {selectedOrders.length > 0 && ` • ${selectedOrders.length} selected`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg">
              <button onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="Table view"><FiList className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="Kanban view"><FiColumns className="w-4 h-4" /></button>
            </div>
            <button
              onClick={handleRunShiprocketSync}
              disabled={syncingShiprocket}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={syncingShiprocket ? 'animate-spin' : ''} />
              {syncingShiprocket ? 'Syncing...' : 'Run Sync Now'}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={orders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload />
              Export CSV
            </button>
          </div>
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

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <OrderKanbanBoard
            orders={orders}
            onRefresh={fetchOrders}
            onCardClick={(order) => {
              setSelectedOrder(order);
              setShowDetailsModal(true);
            }}
          />
        )}

        {/* Orders Table */}
        {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        orders.length > 0 &&
                        selectedOrders.length === orders.length
                      }
                      onChange={selectAllOrders}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    Order {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalAmount')}
                  >
                    Amount {sortBy === 'totalAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
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
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors"
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
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'delivered'
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
                            {formatPrice(order.total || order.totalAmount || 0)}
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

                          {order.shipping?.shiprocket_order_id && (
                            <button
                              onClick={() => handleGenerateInvoice(order)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                              title={order.shipping?.invoice_url ? 'Open Invoice' : 'Generate Invoice'}
                            >
                              <FiFileText />
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

                {orders.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                      No orders found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    // Start page calculation to show window around current page
                    let p = currentPage - 2 + idx;
                    if (currentPage < 3) p = idx + 1;
                    if (currentPage > totalPages - 2) p = totalPages - 4 + idx;
                    if (totalPages < 5) p = idx + 1;

                    if (p > 0 && p <= totalPages) {
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === p
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
        )}
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
        <OrderDrawer
          order={selectedOrder}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
          onStatusUpdate={() => fetchOrders()}
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
    </div>
  );
}
