'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/utils/api';
import { FiPackage, FiTruck, FiCheck, FiX, FiArrowRight, FiClock } from 'react-icons/fi';
import { formatPrice } from '@/utils/helpers';

const FILTER_TABS = ['all', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filter, setFilter] = useState('all');
  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({});

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

  // Animated underline indicator
  useEffect(() => {
    const el = tabRefs.current[filter];
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await orderAPI.getAll();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return <FiCheck className="w-4 h-4" />;
      case 'cancelled': return <FiX className="w-4 h-4" />;
      case 'shipped': return <FiTruck className="w-4 h-4" />;
      case 'processing': return <FiClock className="w-4 h-4" />;
      default: return <FiPackage className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'text-green-700 bg-green-50 border-green-200';
      case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
      case 'shipped': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'processing': return 'text-amber-700 bg-amber-50 border-amber-200';
      default: return 'text-primary-700 bg-primary-50 border-primary-200';
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return order.status?.toLowerCase() === filter;
  });

  if (loading || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-background)]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-4xl">

        {/* Header */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-primary-900 mb-3 tracking-tight">
          My Orders
        </h1>
        <p className="text-primary-500 text-sm mb-10">Track and manage your purchases</p>

        {/* Filter Tabs with animated underline */}
        <div className="relative mb-10">
          <div className="flex gap-8 border-b border-[color:var(--color-border)]">
            {FILTER_TABS.map((status) => (
              <button
                key={status}
                ref={(el) => (tabRefs.current[status] = el)}
                onClick={() => setFilter(status)}
                className={`pb-3 text-sm font-medium transition-colors duration-150 capitalize ${
                  filter === status ? 'text-primary-900' : 'text-primary-400 hover:text-primary-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          {/* Gold sliding underline */}
          <div
            className="absolute bottom-0 h-[2px] bg-[color:var(--color-accent)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={indicatorStyle}
          />
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          /* Branded empty state */
          <div className="py-20 text-center">
            {/* Minimal line-art shoebox illustration */}
            <div className="mx-auto w-24 h-24 mb-8 relative">
              <svg viewBox="0 0 96 96" fill="none" className="w-full h-full text-primary-300">
                <rect x="12" y="36" width="72" height="40" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 36L24 20H72L84 36" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <line x1="48" y1="36" x2="48" y2="76" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                <path d="M36 36V28C36 24 40 20 48 20C56 20 60 24 60 28V36" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl font-medium text-primary-900 mb-3">
              {filter === 'all' ? 'Your shelf is bare — for now.' : `No ${filter} orders yet.`}
            </h3>
            <p className="text-primary-500 text-sm mb-10 max-w-sm mx-auto">
              {filter === 'all'
                ? 'When you place your first order, it will appear here. Every great collection starts with one pair.'
                : `Orders with "${filter}" status will appear here.`}
            </p>
            <Link href="/products" className="btn-editorial inline-block max-w-xs">
              <span>Explore Collection</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white border border-[color:var(--color-border)] hover:border-primary-300 transition-all duration-150 group">
                {/* Order Header */}
                <div className="px-6 py-5 border-b border-[color:var(--color-border)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      <div>
                        <p className="label-upper text-primary-400 mb-1">Order</p>
                        <p className="font-mono text-sm font-medium text-primary-900 break-all">{order.orderId}</p>
                      </div>
                      <div className="hidden sm:block h-8 w-px bg-[color:var(--color-border)]"></div>
                      <div>
                        <p className="label-upper text-primary-400 mb-1">Date</p>
                        <p className="text-sm font-medium text-primary-900">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="hidden sm:block h-8 w-px bg-[color:var(--color-border)]"></div>
                      <div>
                        <p className="label-upper text-primary-400 mb-1">Total</p>
                        <p className="font-serif text-lg font-semibold text-primary-900">
                          {formatPrice(order.totalAmount || order.total || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium capitalize ${getStatusStyle(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status || 'confirmed'}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  {order.shipping?.awb_code && (
                    <div className="mt-4 pt-4 border-t border-[color:var(--color-border)]">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-primary-600">
                          <FiTruck className="w-3.5 h-3.5" />
                          <span className="font-medium">{order.shipping.courier_name || order.shipping.courier}</span>
                        </div>
                        <span className="text-primary-300">|</span>
                        <span className="font-mono text-primary-900">{order.shipping.awb_code}</span>
                        {order.shipping.current_status && (
                          <>
                            <span className="text-primary-300">|</span>
                            <span className="text-green-700 font-medium">{order.shipping.current_status}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="px-6 py-5">
                  <div className="space-y-4">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center gap-5">
                        <div className="relative w-14 h-14 flex-shrink-0 bg-[color:var(--color-background)]">
                          <Image
                            src={item.product?.images?.[0]?.url || item.product?.images?.[0] || '/placeholder.svg'}
                            alt={item.product?.name || 'Product'}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-sm font-medium text-primary-900 truncate">{item.product?.name || 'Product'}</h4>
                          <p className="text-xs text-primary-500 mt-0.5">
                            Size {item.size} · Qty {item.quantity}
                          </p>
                        </div>
                        <p className="font-mono text-sm font-medium text-primary-900">{formatPrice(item.price ?? 0)}</p>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-xs text-primary-400 text-center pt-2">
                        +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* View Details link */}
                  <div className="mt-5 pt-5 border-t border-[color:var(--color-border)] flex items-center justify-between">
                    <div>
                      <p className="text-xs text-primary-500">
                        {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.postalCode}
                      </p>
                    </div>
                    <Link
                      href={`/orders/${order._id}`}
                      className="label-upper text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-hover)] transition-colors duration-150 flex items-center gap-1.5"
                    >
                      View Details <FiArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
