'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { adminAPI } from '@/utils/api';
import { formatPrice, formatDateTime } from '@/utils/helpers';
import toast from 'react-hot-toast';
import {
  FiX, FiPackage, FiUser, FiMapPin, FiCreditCard, FiTruck,
  FiPhone, FiMail, FiCalendar, FiCopy, FiExternalLink, FiPrinter,
  FiFileText, FiCheck, FiChevronDown, FiClock, FiAlertCircle,
  FiLoader, FiTag, FiArrowRight, FiHash,
} from 'react-icons/fi';

const STATUS_FLOW = ['confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_CONFIG = {
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  confirmed:       { label: 'Confirmed',       color: 'bg-blue-100 text-blue-800 border-blue-200',     dot: 'bg-blue-500' },
  processing:      { label: 'Processing',      color: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
  shipped:         { label: 'Shipped',          color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  delivered:       { label: 'Delivered',        color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  cancelled:       { label: 'Cancelled',        color: 'bg-red-100 text-red-800 border-red-200',       dot: 'bg-red-500' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.confirmed;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Section({ icon: Icon, title, iconColor = 'text-gray-400', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2.5 px-5 py-3 hover:bg-gray-50 transition-colors text-left">
        <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
        <span className="text-sm font-semibold text-gray-800 flex-1">{title}</span>
        <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value, mono = false, copyable = false }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success('Copied!');
  };
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-1.5 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-900 text-right ${mono ? 'font-mono text-xs' : ''} flex items-center gap-1`}>
        {value}
        {copyable && (
          <button onClick={handleCopy} className="p-0.5 text-gray-400 hover:text-gray-600"><FiCopy className="w-3 h-3" /></button>
        )}
      </span>
    </div>
  );
}

export default function OrderDrawer({ orderId, order: initialOrder, isOpen, onClose, onStatusUpdate }) {
  const drawerRef = useRef(null);
  const queryClient = useQueryClient();
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Fetch full order details (with populated fields) if we only have an orderId
  const { data: fullOrder, isLoading } = useQuery({
    queryKey: ['admin-order', orderId || initialOrder?._id],
    queryFn: async () => {
      const id = orderId || initialOrder?._id;
      const res = await adminAPI.getOrderById(id);
      return res.data?.order || res.data;
    },
    enabled: isOpen && !!(orderId || initialOrder?._id),
    staleTime: 30_000,
    initialData: initialOrder || undefined,
  });

  const order = fullOrder || initialOrder;

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateOrderStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(`Order marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-order', order._id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      onStatusUpdate?.();
      setStatusDropdownOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Close on outside click
  const handleBackdropClick = useCallback((e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const addr = order?.shippingAddress;
  const ship = order?.shipping;
  const pay = order?.payment;
  const canAdvance = order?.status && STATUS_FLOW.includes(order.status) && order.status !== 'delivered';
  const nextStatus = canAdvance ? STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1] : null;

  // Timeline events
  const timeline = [];
  if (order?.createdAt) timeline.push({ label: 'Order placed', time: order.createdAt, icon: FiPackage, active: true });
  if (order?.status !== 'pending_payment') timeline.push({ label: 'Confirmed', time: order?.createdAt, icon: FiCheck, active: ['confirmed','processing','shipped','delivered'].includes(order?.status) });
  if (['processing','shipped','delivered'].includes(order?.status)) timeline.push({ label: 'Processing', time: null, icon: FiClock, active: true });
  if (['shipped','delivered'].includes(order?.status)) timeline.push({ label: 'Shipped', time: ship?.shipment_created_at, icon: FiTruck, active: true });
  if (order?.status === 'delivered') timeline.push({ label: 'Delivered', time: ship?.estimated_delivery_date, icon: FiCheck, active: true });
  if (order?.status === 'cancelled') timeline.push({ label: 'Cancelled', time: order?.cancellation?.cancelledAt, icon: FiAlertCircle, active: true });

  // Tracking history from Shiprocket
  const trackHistory = ship?.trackingHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right h-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 truncate">{order?.displayOrderId || order?.orderId || 'Order'}</h2>
              {(order?.displayOrderId || order?.orderId) && (
                <button onClick={() => { navigator.clipboard.writeText(order.displayOrderId || order.orderId); toast.success('Copied!'); }}
                  className="p-1 text-gray-400 hover:text-gray-600"><FiCopy className="w-3.5 h-3.5" /></button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={order?.status} />
              {pay?.method && (
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  pay.method === 'cod' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                }`}>{pay.method === 'cod' ? 'COD' : 'Prepaid'}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Loading overlay */}
        {isLoading && !order && (
          <div className="flex-1 flex items-center justify-center">
            <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Scrollable content */}
        {order && (
          <div className="flex-1 overflow-y-auto">
            {/* Order Timeline */}
            <Section icon={FiClock} title="Timeline" iconColor="text-blue-500">
              <div className="relative ml-2">
                {timeline.map((event, i) => (
                  <div key={i} className="flex gap-3 mb-3 last:mb-0">
                    <div className="relative flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        event.active
                          ? (event.label === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600')
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <event.icon className="w-3.5 h-3.5" />
                      </div>
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-medium ${event.active ? 'text-gray-900' : 'text-gray-400'}`}>{event.label}</p>
                      {event.time && <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(event.time)}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shiprocket tracking history */}
              {trackHistory.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Courier Updates</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {trackHistory.map((t, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className="text-gray-400 shrink-0 w-24">{t.timestamp ? new Date(t.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        <span className="text-gray-700">{t.description || t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Order Items */}
            <Section icon={FiPackage} title={`Items (${order.items?.length || 0})`} iconColor="text-indigo-500">
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <img
                      src={item.image || item.product?.images?.[0]?.url || item.product?.images?.[0] || '/placeholder.svg'}
                      alt={item.name || item.product?.name}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name || item.product?.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <><span>·</span><span>Color: {item.color}</span></>}
                        <span>·</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                      {item.quantity > 1 && <p className="text-[10px] text-gray-400">@{formatPrice(item.price || 0)}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span>{formatPrice(order.subtotal ?? 0)}</span>
                </div>
                {(order.shippingCost ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span><span>{formatPrice(order.shippingCost)}</span>
                  </div>
                )}
                {(order.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="flex items-center gap-1"><FiTag className="w-3 h-3" /> Discount{order.coupon?.code ? ` (${order.coupon.code})` : ''}</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-1.5 border-t border-gray-100">
                  <span>Total</span><span>{formatPrice(order.total || order.totalAmount || 0)}</span>
                </div>
              </div>
            </Section>

            {/* Customer */}
            <Section icon={FiUser} title="Customer" iconColor="text-purple-500">
              <div className="space-y-1">
                <InfoRow label="Name" value={addr?.fullName || order.user?.name} />
                <InfoRow label="Email" value={order.user?.email} copyable />
                <InfoRow label="Phone" value={addr?.phone} copyable />
              </div>
              {order.user?._id && (
                <Link href={`/admin/users`} className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium mt-2">
                  View customer profile <FiExternalLink className="w-3 h-3" />
                </Link>
              )}
            </Section>

            {/* Shipping Address */}
            <Section icon={FiMapPin} title="Shipping Address" iconColor="text-green-500">
              {addr ? (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-0.5">
                  <p className="font-medium text-gray-900">{addr.fullName}</p>
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  <p>{addr.city}, {addr.state} — {addr.postalCode}</p>
                  <p>{addr.country}</p>
                  <p className="flex items-center gap-1 mt-1 text-gray-600"><FiPhone className="w-3 h-3" /> {addr.phone}</p>
                </div>
              ) : <p className="text-sm text-gray-400">No address available</p>}
            </Section>

            {/* Payment */}
            <Section icon={FiCreditCard} title="Payment" iconColor="text-amber-500">
              <div className="space-y-1">
                <InfoRow label="Method" value={pay?.method === 'cod' ? 'Cash on Delivery' : pay?.method === 'razorpay' ? 'Razorpay' : pay?.method || '—'} />
                <InfoRow label="Status" value={pay?.status ? pay.status.charAt(0).toUpperCase() + pay.status.slice(1) : '—'} />
                {pay?.transactionId && <InfoRow label="Txn ID" value={pay.transactionId} mono copyable />}
                {pay?.razorpayOrderId && <InfoRow label="Razorpay Order" value={pay.razorpayOrderId} mono copyable />}
                {pay?.refundId && <InfoRow label="Refund ID" value={pay.refundId} mono copyable />}
              </div>
            </Section>

            {/* Shipping / Shiprocket */}
            {ship && (ship.awb_code || ship.trackingId || ship.courier_name || ship.shiprocket_order_id) && (
              <Section icon={FiTruck} title="Shipping Details" iconColor="text-orange-500">
                <div className="space-y-1">
                  {ship.awb_code && <InfoRow label="AWB Code" value={ship.awb_code} mono copyable />}
                  {ship.courier_name && <InfoRow label="Courier" value={ship.courier_name} />}
                  {ship.lifecycle_status && <InfoRow label="Lifecycle" value={ship.lifecycle_status.replace(/_/g, ' ')} />}
                  {ship.estimated_delivery_date && <InfoRow label="Est. Delivery" value={new Date(ship.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />}
                  {ship.trackingId && <InfoRow label="Tracking ID" value={ship.trackingId} mono copyable />}
                </div>

                {/* Action links */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {ship.tracking_url && (
                    <a href={ship.tracking_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                      <FiExternalLink className="w-3 h-3" /> Track
                    </a>
                  )}
                  {ship.label_url && (
                    <a href={ship.label_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                      <FiPrinter className="w-3 h-3" /> Label
                    </a>
                  )}
                  {ship.manifest_url && (
                    <a href={ship.manifest_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                      <FiFileText className="w-3 h-3" /> Manifest
                    </a>
                  )}
                </div>
              </Section>
            )}

            {/* Cancellation */}
            {order.status === 'cancelled' && order.cancellation && (
              <Section icon={FiAlertCircle} title="Cancellation" iconColor="text-red-500" defaultOpen>
                <div className="bg-red-50 rounded-lg p-3 text-sm space-y-1">
                  <InfoRow label="Reason" value={order.cancellation.reason || 'Not specified'} />
                  <InfoRow label="By" value={order.cancellation.cancelledBy} />
                  {order.cancellation.cancelledAt && <InfoRow label="Date" value={formatDateTime(order.cancellation.cancelledAt)} />}
                </div>
              </Section>
            )}

            {/* Meta */}
            <Section icon={FiHash} title="Order Meta" iconColor="text-gray-400" defaultOpen={false}>
              <div className="space-y-1 text-xs">
                <InfoRow label="Internal ID" value={order._id} mono copyable />
                <InfoRow label="Fulfillment" value={order.fulfillmentType?.replace(/_/g, ' ')} />
                <InfoRow label="Est. Dispatch" value={order.estimatedDispatchDays ? `${order.estimatedDispatchDays} days` : null} />
                <InfoRow label="Created" value={formatDateTime(order.createdAt)} />
                <InfoRow label="Updated" value={formatDateTime(order.updatedAt)} />
              </div>
            </Section>
          </div>
        )}

        {/* Footer Actions */}
        {order && order.status !== 'cancelled' && (
          <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-3 flex items-center gap-2">
            {/* Quick advance button */}
            {canAdvance && nextStatus && (
              <button
                onClick={() => statusMutation.mutate({ id: order._id, status: nextStatus })}
                disabled={statusMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {statusMutation.isPending ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiArrowRight className="w-4 h-4" />}
                Mark as {STATUS_CONFIG[nextStatus]?.label}
              </button>
            )}

            {/* More status dropdown */}
            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="inline-flex items-center gap-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2.5 rounded-lg transition-colors"
              >
                <FiChevronDown className="w-4 h-4" />
              </button>
              {statusDropdownOpen && (
                <div className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-10">
                  {Object.entries(STATUS_CONFIG).filter(([key]) => key !== order.status).map(([key, cfg]) => (
                    <button key={key} onClick={() => statusMutation.mutate({ id: order._id, status: key })}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Animation keyframes (injected once) */}
      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
