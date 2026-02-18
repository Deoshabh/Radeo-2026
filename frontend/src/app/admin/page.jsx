'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import DashboardSkeleton from '@/components/admin/DashboardSkeleton';
import RevenueChart from '@/components/admin/charts/RevenueChart';
import SalesCategoryPieChart from '@/components/admin/charts/SalesCategoryPieChart';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/utils/api';
import { formatCurrency } from '@/utils/helpers';
import {
  FiDollarSign, FiShoppingBag, FiUsers, FiBox, FiSettings, FiTruck,
  FiPackage, FiPercent, FiStar, FiRefreshCw, FiArrowUpRight, FiArrowDownRight,
  FiAlertTriangle, FiClock, FiTrendingUp, FiActivity,
} from 'react-icons/fi';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');

  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await adminAPI.getAdminStats();
      return res.data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Map backend data to chart-expected formats
  const revenueChartData = useCallback(() => {
    if (!stats) return null;
    if (period === '7d') {
      return (stats.salesTrend || []).map(d => ({ name: d.date?.slice(5), revenue: d.revenue, orders: d.orders }));
    }
    // 30d/90d — use monthly trend
    const data = stats.monthlySalesTrend || [];
    if (period === '90d') return data.map(d => ({ name: d.month, revenue: d.revenue, orders: d.orders }));
    return data.slice(-6).map(d => ({ name: d.month, revenue: d.revenue, orders: d.orders }));
  }, [stats, period])();

  const categoryChartData = (stats?.topCategories || []).map(c => ({
    name: c._id || c.name || 'Other',
    value: c.totalRevenue || c.value || c.count || 0,
  }));

  // Alerts
  const alerts = [];
  if (stats?.products?.outOfStock > 0) alerts.push({ type: 'warning', icon: FiAlertTriangle, text: `${stats.products.outOfStock} product${stats.products.outOfStock > 1 ? 's' : ''} out of stock`, href: '/admin/products' });
  if (stats?.orders?.pending > 0) alerts.push({ type: 'info', icon: FiClock, text: `${stats.orders.pending} order${stats.orders.pending > 1 ? 's' : ''} pending confirmation`, href: '/admin/orders' });

  // KPIs
  const kpiCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(stats?.revenue?.total || 0),
      subtitle: `${stats?.growth?.revenue > 0 ? '+' : ''}${stats?.growth?.revenue || 0}% vs last month`,
      trend: parseFloat(stats?.growth?.revenue) || 0,
      icon: FiDollarSign,
      color: 'bg-emerald-500',
      link: '/admin/orders',
    },
    {
      title: 'Orders',
      value: stats?.orders?.total?.toLocaleString() || '0',
      subtitle: `${stats?.orders?.pending || 0} pending`,
      trend: parseFloat(stats?.growth?.orders) || 0,
      icon: FiShoppingBag,
      color: 'bg-blue-500',
      link: '/admin/orders',
    },
    {
      title: 'Products',
      value: stats?.products?.total?.toLocaleString() || '0',
      subtitle: `${stats?.products?.active || 0} active · ${stats?.products?.outOfStock || 0} OOS`,
      trend: null,
      icon: FiBox,
      color: 'bg-indigo-500',
      link: '/admin/products',
    },
    {
      title: 'Customers',
      value: stats?.users?.customers?.toLocaleString() || '0',
      subtitle: 'registered users',
      trend: null,
      icon: FiUsers,
      color: 'bg-purple-500',
      link: '/admin/users',
    },
  ];

  const quickActions = [
    { title: 'Add Product', icon: FiPackage, href: '/admin/products/new', desc: 'Create new listing' },
    { title: 'View Orders', icon: FiTruck, href: '/admin/orders', desc: 'Manage shipments' },
    { title: 'Reviews', icon: FiStar, href: '/admin/reviews', desc: 'Moderate reviews' },
    { title: 'Coupons', icon: FiPercent, href: '/admin/coupons', desc: 'Manage discounts' },
    { title: 'SEO', icon: FiTrendingUp, href: '/admin/seo', desc: 'Optimize pages' },
    { title: 'Settings', icon: FiSettings, href: '/admin/settings', desc: 'Site configuration' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name || 'Admin'}</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <FiRefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Alert Banners */}
            {alerts.length > 0 && (
              <div className="space-y-2 mb-6">
                {alerts.map((alert, i) => {
                  const Icon = alert.icon;
                  return (
                    <Link key={i} href={alert.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      alert.type === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                        : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                    }`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{alert.text}</span>
                      <FiArrowUpRight className="w-4 h-4 shrink-0 opacity-60" />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {kpiCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <Link key={i} href={card.link} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`${card.color} p-2.5 rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {card.trend !== null && (
                        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          card.trend >= 0
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-red-700 bg-red-50'
                        }`}>
                          {card.trend >= 0 ? <FiArrowUpRight className="w-3 h-3" /> : <FiArrowDownRight className="w-3 h-3" />}
                          {Math.abs(card.trend)}%
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-0.5">{card.value}</p>
                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-2">{card.title}</p>
                  </Link>
                );
              })}
            </div>

            {/* Period Selector + Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Revenue Overview</h3>
                    <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                      {[['7d', '7D'], ['30d', '30D'], ['90d', '90D']].map(([key, label]) => (
                        <button key={key} onClick={() => setPeriod(key)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            period === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-1">
                    <RevenueChart data={revenueChartData} />
                  </div>
                </div>
              </div>
              <div>
                <SalesCategoryPieChart data={categoryChartData.length > 0 ? categoryChartData : null} />
              </div>
            </div>

            {/* Revenue Split + Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Payment Split */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiActivity className="w-4 h-4 text-gray-400" /> Payment Split
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Online</p>
                    <p className="text-xl font-bold text-emerald-900">{formatCurrency(stats?.paymentSplit?.online?.revenue || 0)}</p>
                    <p className="text-xs text-emerald-600 mt-1">{stats?.paymentSplit?.online?.count || 0} orders</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">COD</p>
                    <p className="text-xl font-bold text-amber-900">{formatCurrency(stats?.paymentSplit?.cod?.revenue || 0)}</p>
                    <p className="text-xs text-amber-600 mt-1">{stats?.paymentSplit?.cod?.count || 0} orders</p>
                  </div>
                </div>
                {/* Month over month */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">This month</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(stats?.currentMonth?.revenue || 0)} · {stats?.currentMonth?.orders || 0} orders</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500">Last month</span>
                    <span className="text-gray-600">{formatCurrency(stats?.previousMonth?.revenue || 0)} · {stats?.previousMonth?.orders || 0} orders</span>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">Recent Orders</h3>
                  <Link href="/admin/orders" className="text-xs text-amber-600 hover:text-amber-800 font-medium">View All</Link>
                </div>
                <div className="space-y-2">
                  {(stats?.recentOrders || []).slice(0, 5).map((order) => (
                    <div key={order._id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{order.customerName || 'Customer'}</p>
                        <p className="text-xs text-gray-500">#{order.orderId?.slice(-6) || order._id?.slice(-6)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                          order.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                          order.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                          order.status === 'confirmed' ? 'bg-indigo-50 text-indigo-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                  {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-6">No recent orders</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {quickActions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <Link key={i} href={action.href}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-center group">
                      <div className="p-2.5 bg-gray-100 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{action.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{action.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Top Products */}
            {stats?.topProducts?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">Top Selling Products</h3>
                  <Link href="/admin/products" className="text-xs text-amber-600 hover:text-amber-800 font-medium">View All</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-2 font-medium">Product</th>
                        <th className="pb-2 font-medium text-right">Sold</th>
                        <th className="pb-2 font-medium text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topProducts.slice(0, 5).map((p, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="py-2.5 font-medium text-gray-900">{p.name || p._id || `Product ${i + 1}`}</td>
                          <td className="py-2.5 text-right text-gray-600">{p.totalSold || p.count || 0}</td>
                          <td className="py-2.5 text-right font-semibold text-gray-900">{formatCurrency(p.totalRevenue || p.revenue || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
