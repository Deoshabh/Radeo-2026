'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/utils/api';
import { FiPackage, FiTruck, FiCheck, FiX, FiArrowLeft, FiMapPin, FiClock, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, loading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchOrder = useCallback(async () => {
    try {
      setLoadingOrder(true);
      const response = await orderAPI.getOrderById(params.id);
      // Backend returns {order: {...}}
      console.log('📦 Order Details API response:', response.data);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoadingOrder(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (isAuthenticated && params.id) {
      fetchOrder();
    }
  }, [isAuthenticated, params.id, fetchOrder]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancelling(true);
      await orderAPI.cancelOrder(params.id);
      toast.success('Order cancelled successfully');
      fetchOrder(); // Refresh order data
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <FiCheck className="w-6 h-6" />;
      case 'cancelled':
        return <FiX className="w-6 h-6" />;
      case 'shipped':
        return <FiTruck className="w-6 h-6" />;
      case 'processing':
        return <FiClock className="w-6 h-6" />;
      default:
        return <FiPackage className="w-6 h-6" />;
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
      case 'confirmed':
        return 'bg-primary-100 text-primary-800 border-primary-300';
      default:
        return 'bg-primary-100 text-primary-800 border-primary-300';
    }
  };

  const orderSteps = [
    { status: 'confirmed', label: 'Order Placed', icon: FiCheck },
    { status: 'processing', label: 'Processing', icon: FiClock },
    { status: 'shipped', label: 'Shipped', icon: FiTruck },
    { status: 'delivered', label: 'Delivered', icon: FiCheck },
  ];

  const getCurrentStepIndex = (status) => {
    const statusMap = { confirmed: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1 };
    return statusMap[status?.toLowerCase()] ?? 0;
  };

  if (loading || loadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  if (!isAuthenticated || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-center">
          <p className="text-xl text-primary-600 mb-4">Order not found</p>
          <Link href="/orders" className="btn btn-primary">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex(order.status);
  const isCancelled = order.status?.toLowerCase() === 'cancelled';

  return (
    <div className="min-h-screen bg-primary-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-brand-brown mb-6 transition-colors"
        >
          <FiArrowLeft /> Back to Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-primary-900 mb-1">Order Details</h1>
              <p className="text-primary-600">Order ID: {order.orderId}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="font-medium capitalize">{order.status || 'confirmed'}</span>
              </div>
              {/* Cancel Button - Only show for pending, processing, or confirmed orders */}
              {['pending', 'processing', 'confirmed'].includes(order.status?.toLowerCase()) && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiX />
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          {/* Order Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg">
              <FiClock className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-primary-600">Order Date</p>
                <p className="font-semibold text-primary-900">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg">
              <FiDollarSign className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-primary-600">Total Amount</p>
                <p className="font-semibold text-primary-900">₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg">
              <FiPackage className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-primary-600">Payment Method</p>
                <p className="font-semibold text-primary-900 capitalize">{order.payment?.method || 'cod'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Information - NEW */}
          {order.shipping?.awb_code && !isCancelled && (
            <div className="pt-6 border-t border-primary-200">
              <h3 className="font-semibold text-primary-900 mb-4">Shipping Details</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Courier Partner</p>
                    <p className="font-semibold text-blue-900">{order.shipping.courier_name || order.shipping.courier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Tracking Number (AWB)</p>
                    <p className="font-mono font-semibold text-blue-900">{order.shipping.awb_code || order.shipping.trackingId}</p>
                  </div>
                  {order.shipping.current_status && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-blue-600 mb-1">Current Status</p>
                      <p className="font-semibold text-blue-900">{order.shipping.current_status}</p>
                      {order.shipping.last_tracking_update && (
                        <p className="text-xs text-blue-600 mt-1">
                          Last updated: {new Date(order.shipping.last_tracking_update).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}
                  {order.shipping.estimated_delivery_date && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-blue-600 mb-1">Estimated Delivery</p>
                      <p className="font-semibold text-blue-900">
                        {new Date(order.shipping.estimated_delivery_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Tracking */}
          {!isCancelled && (
            <div className="pt-6 border-t border-primary-200">
              <h3 className="font-semibold text-primary-900 mb-6">Order Tracking</h3>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 w-full h-1 bg-primary-200">
                  <div
                    className="h-full bg-brand-brown transition-all duration-500"
                    style={{ width: `${(currentStep / (orderSteps.length - 1)) * 100}%` }}
                  ></div>
                </div>

                {/* Steps */}
                <div className="relative flex justify-between">
                  {orderSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isComplete = index <= currentStep;
                    return (
                      <div key={step.status} className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all ${
                            isComplete
                              ? 'bg-brand-brown border-brand-brown text-white'
                              : 'bg-white border-primary-200 text-primary-400'
                          }`}
                        >
                          <Icon />
                        </div>
                        <p className={`mt-2 text-sm font-medium ${isComplete ? 'text-primary-900' : 'text-primary-500'}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="pt-6 border-t border-primary-200">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <FiX className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Order Cancelled</p>
                  <p className="text-sm text-red-700">This order has been cancelled.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-primary-900 mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-primary-200 rounded-lg">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.product?.images?.[0]?.url || item.product?.images?.[0] || '/placeholder.jpg'}
                        alt={item.product?.name || 'Product'}
                        fill
                        sizes="80px"
                        className="object-cover rounded border border-primary-200"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-primary-900 mb-1">{item.product?.name || 'Product'}</h4>
                      <p className="text-sm text-primary-600 mb-1">
                        Brand: {item.product?.brand || 'N/A'}
                      </p>
                      <p className="text-sm text-primary-600">
                        Size: {item.size} | Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-900">₹{item.price?.toLocaleString()}</p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-primary-600">₹{(item.price / item.quantity).toLocaleString()} each</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-primary-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-primary-700">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal?.toLocaleString()}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{order.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-primary-900 pt-2 border-t border-primary-200">
                    <span>Total</span>
                    <span>₹{order.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiMapPin className="w-5 h-5 text-brand-brown" />
                <h3 className="font-semibold text-primary-900">Shipping Address</h3>
              </div>
              <div className="text-primary-700">
                <p className="font-medium text-primary-900 mb-2">{order.shippingAddress?.fullName}</p>
                <p className="text-sm mb-1">{order.shippingAddress?.addressLine1}</p>
                {order.shippingAddress?.addressLine2 && (
                  <p className="text-sm mb-1">{order.shippingAddress?.addressLine2}</p>
                )}
                <p className="text-sm mb-1">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>
                <p className="text-sm mb-2">PIN: {order.shippingAddress?.postalCode}</p>
                <p className="text-sm font-medium">Phone: {order.shippingAddress?.phone}</p>
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="font-semibold text-primary-900 mb-3">Need Help?</h3>
              <p className="text-sm text-primary-700 mb-4">
                If you have any questions about your order, feel free to contact us.
              </p>
              <Link href="/contact" className="btn btn-secondary w-full">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
