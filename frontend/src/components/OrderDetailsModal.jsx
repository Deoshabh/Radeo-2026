'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { FiX, FiPackage, FiUser, FiMapPin, FiCreditCard, FiTruck, FiPhone, FiMail, FiCalendar } from 'react-icons/fi';
import { formatDateTime as formatDate, formatPrice } from '@/utils/helpers';

export default function OrderDetailsModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  // Debug logging
  console.log('Order data in modal:', {
    orderId: order.orderId,
    shippingAddress: order.shippingAddress,
    user: order.user
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-500 mt-1">{order.orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Order Status</div>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                {order.status?.toUpperCase()}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Payment Method</div>
              <div className="flex items-center gap-2 mt-1">
                <FiCreditCard className="text-gray-600" />
                <span className="font-semibold text-gray-900">
                  {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Order Date</div>
              <div className="flex items-center gap-2 mt-1">
                <FiCalendar className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser className="text-blue-600" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Name</div>
                <div className="font-medium text-gray-900 mt-1">{order.shippingAddress?.fullName || order.user?.name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div className="font-medium text-gray-900 mt-1 flex items-center gap-2">
                  <FiMail className="text-gray-400 text-sm" />
                  {order.user?.email || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="font-medium text-gray-900 mt-1 flex items-center gap-2">
                  <FiPhone className="text-gray-400 text-sm" />
                  {order.shippingAddress?.phone || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiMapPin className="text-green-600" />
              Shipping Address
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="font-medium text-gray-900">{order.shippingAddress?.fullName}</div>
                <div className="text-gray-700">{order.shippingAddress?.addressLine1}</div>
                {order.shippingAddress?.addressLine2 && (
                  <div className="text-gray-700">{order.shippingAddress?.addressLine2}</div>
                )}
                <div className="text-gray-700">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                </div>
                <div className="text-gray-700">{order.shippingAddress?.country}</div>
                <div className="text-gray-700 flex items-center gap-2">
                  <FiPhone className="text-gray-400 text-sm" />
                  {order.shippingAddress?.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiPackage className="text-purple-600" />
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                  <img
                    src={item.image || item.product?.images?.[0]?.url || item.product?.images?.[0] || '/placeholder.svg'}
                    alt={item.name || item.product?.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.name || item.product?.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      Size: {item.size} | Quantity: {item.quantity}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Price: {formatPrice(item.price ?? 0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatPrice((item.price || 0) * (item.quantity || 1))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCost ?? 0)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount ?? 0)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(order.total || order.totalAmount || 0)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Information (if available) */}
          {order.shipping && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiTruck className="text-orange-600" />
                Shipping Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.shipping.awb_code && (
                  <div>
                    <div className="text-sm text-gray-600">AWB Code</div>
                    <div className="font-medium text-gray-900 mt-1 font-mono">
                      {order.shipping.awb_code}
                    </div>
                  </div>
                )}
                {order.shipping.courier_name && (
                  <div>
                    <div className="text-sm text-gray-600">Courier</div>
                    <div className="font-medium text-gray-900 mt-1">
                      {order.shipping.courier_name}
                    </div>
                  </div>
                )}
                {order.lifecycle_status && (
                  <div>
                    <div className="text-sm text-gray-600">Lifecycle Status</div>
                    <div className="font-medium text-gray-900 mt-1 capitalize">
                      {order.lifecycle_status.replace(/_/g, ' ')}
                    </div>
                  </div>
                )}
                {order.shipping.label_url && (
                  <div>
                    <div className="text-sm text-gray-600">Shipping Label</div>
                    <a
                      href={order.shipping.label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 mt-1 inline-block"
                    >
                      Open Label PDF
                    </a>
                  </div>
                )}
                {order.shipping.invoice_url && (
                  <div>
                    <div className="text-sm text-gray-600">Invoice</div>
                    <a
                      href={order.shipping.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 mt-1 inline-block"
                    >
                      Open Invoice PDF
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
