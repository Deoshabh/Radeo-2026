'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAdminStats, useDepsHealth } from '@/hooks/useAdmin';
import { formatCurrency, formatDate } from '@/utils/helpers';
import {
  FiShoppingBag,
  FiDollarSign,
  FiPackage,
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiCheck,
  FiTruck,
  FiX,
  FiCreditCard,
  FiAlertCircle,
} from 'react-icons/fi';

export default function AdminStatsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: depsHealth } = useDepsHealth();
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'
  const [showAllOrders, setShowAllOrders] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading || loadingStats) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );
  }

  if (!stats) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No statistics available</p>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Statistics</h1>
            <p className="text-gray-600 mt-2">Overview of your business performance</p>
          </div>

          {depsHealth && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">System Dependencies</h2>
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${depsHealth.status === 'OK'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}
                >
                  {depsHealth.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(depsHealth.dependencies || {}).map(([name, service]) => {
                  const isOperational = service?.status === 'operational';
                  return (
                    <div key={name} className="border rounded-lg p-4 bg-gray-50">
                      <div className="text-sm text-gray-600 capitalize mb-1">{name}</div>
                      <div
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isOperational
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {service?.status || 'unknown'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Growth Indicators */}
          {stats.growth && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Revenue Growth</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.growth.revenue > 0 ? '+' : ''}{stats.growth.revenue}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Current: {formatCurrency(stats.currentMonth?.revenue)} | 
                      Previous: {formatCurrency(stats.previousMonth?.revenue)}
                    </div>
                  </div>
                  {stats.growth.revenue >= 0 ? (
                    <FiTrendingUp className="w-12 h-12 text-green-500" />
                  ) : (
                    <FiTrendingDown className="w-12 h-12 text-red-500" />
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Orders Growth</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.growth.orders > 0 ? '+' : ''}{stats.growth.orders}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Current: {stats.currentMonth?.orders} | 
                      Previous: {stats.previousMonth?.orders}
                    </div>
                  </div>
                  {stats.growth.orders >= 0 ? (
                    <FiTrendingUp className="w-12 h-12 text-green-500" />
                  ) : (
                    <FiTrendingDown className="w-12 h-12 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <FiDollarSign className="w-8 h-8" />
                <FiTrendingUp className="w-6 h-6 opacity-75" />
              </div>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(stats.revenue?.total)}
              </div>
              <div className="text-green-100">Total Revenue</div>
              <div className="mt-4 text-sm text-green-100">
                Pending: {formatCurrency(stats.revenue?.pending)}
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <FiShoppingBag className="w-8 h-8" />
                <span className="text-2xl font-bold">{stats.orders?.total}</span>
              </div>
              <div className="text-3xl font-bold mb-2">{stats.orders?.delivered}</div>
              <div className="text-blue-100">Delivered Orders</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-blue-100">
                <div>Pending: {stats.orders?.pending}</div>
                <div>Shipped: {stats.orders?.shipped}</div>
              </div>
            </div>

            {/* Total Products */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <FiPackage className="w-8 h-8" />
                <span className="text-2xl font-bold">{stats.products?.total}</span>
              </div>
              <div className="text-3xl font-bold mb-2">{stats.products?.active}</div>
              <div className="text-purple-100">Active Products</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-purple-100">
                <div>Inactive: {stats.products?.inactive}</div>
                <div>Out of Stock: {stats.products?.outOfStock}</div>
              </div>
            </div>

            {/* Total Customers */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <FiUsers className="w-8 h-8" />
                <FiTrendingUp className="w-6 h-6 opacity-75" />
              </div>
              <div className="text-3xl font-bold mb-2">{stats.users?.customers}</div>
              <div className="text-orange-100">Total Customers</div>
              <div className="mt-4 text-sm text-orange-100">
                Admins: {stats.users?.admins}
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiClock className="w-5 h-5 text-yellow-600" />
                    <span className="text-gray-700">Pending</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">{stats.orders?.pending}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${(stats.orders?.pending / stats.orders?.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">{stats.orders?.confirmed}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(stats.orders?.confirmed / stats.orders?.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiTruck className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">Shipped</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">{stats.orders?.shipped}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(stats.orders?.shipped / stats.orders?.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Delivered</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">{stats.orders?.delivered}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(stats.orders?.delivered / stats.orders?.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiX className="w-5 h-5 text-red-600" />
                    <span className="text-gray-700">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">{stats.orders?.cancelled}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(stats.orders?.cancelled / stats.orders?.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Methods</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-orange-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FiDollarSign className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-gray-900">Cash on Delivery</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stats.paymentSplit?.cod?.count}
                  </div>
                  <div className="text-sm text-gray-600">
                    Revenue: {formatCurrency(stats.paymentSplit?.cod?.revenue)}
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCreditCard className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">Online Payment</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stats.paymentSplit?.online?.count}
                  </div>
                  <div className="text-sm text-gray-600">
                    Revenue: {formatCurrency(stats.paymentSplit?.online?.revenue)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">COD Revenue</div>
                      <div className="text-lg font-bold text-orange-600">
                        {((stats.paymentSplit?.cod?.revenue / stats.revenue?.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Online Revenue</div>
                      <div className="text-lg font-bold text-green-600">
                        {((stats.paymentSplit?.online?.revenue / stats.revenue?.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Trend */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Sales Trend {viewMode === 'daily' ? '(Last 7 Days)' : '(Last 12 Months)'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'daily'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {viewMode === 'daily' ? (
                stats.salesTrend?.map((day, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600">{formatDate(day.date)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {day.orders} orders
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(day.revenue)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(day.revenue / Math.max(...stats.salesTrend.map(d => d.revenue))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                stats.monthlySalesTrend?.map((month, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600">{month.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {month.orders} orders ({month.delivered} delivered, {month.cancelled} cancelled)
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(month.revenue)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(month.revenue / Math.max(...stats.monthlySalesTrend.map(m => m.revenue))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Products & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Selling Products */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
              <div className="space-y-4">
                {stats.topProducts?.map((product, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        Sold: {product.quantity} units
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(product.revenue)}</div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>
                  </div>
                ))}
                {(!stats.topProducts || stats.topProducts.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Orders</h2>
              <div className="space-y-3">
                {stats.recentOrders?.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900">{order.orderId}</div>
                      <div className="text-sm text-gray-600">{order.customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(order.total)}</div>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No orders yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Categories */}
          {stats.topCategories && stats.topCategories.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Top Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats.topCategories.map((category, index) => (
                  <div key={index} className="border rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-gray-900 capitalize mb-2">
                      {category.category}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {category.quantity} units
                    </div>
                    <div className="font-semibold text-blue-600">
                      {formatCurrency(category.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business History Overview */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Business History Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="text-sm text-gray-600 mb-2">Total Business Revenue</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(stats.revenue?.total)}
                </div>
                <div className="text-sm text-gray-600">
                  From {stats.orders?.delivered} delivered orders
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <div className="text-sm text-gray-600 mb-2">Average Order Value</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(stats.orders?.delivered > 0 ? stats.revenue?.total / stats.orders?.delivered : 0)}
                </div>
                <div className="text-sm text-gray-600">
                  Per delivered order
                </div>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <div className="text-sm text-gray-600 mb-2">Success Rate</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.orders?.total > 0 
                    ? ((stats.orders?.delivered / stats.orders?.total) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">
                  Order fulfillment rate
                </div>
              </div>
            </div>

            {/* Monthly Performance Chart */}
            {stats.monthlySalesTrend && stats.monthlySalesTrend.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">12-Month Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Month</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Orders</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Delivered</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Cancelled</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.monthlySalesTrend.map((month, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{month.month}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{month.orders}</td>
                          <td className="px-4 py-3 text-right text-green-600">{month.delivered}</td>
                          <td className="px-4 py-3 text-right text-red-600">{month.cancelled}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {formatCurrency(month.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* All Orders Access */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">All Orders History</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Access complete order records ({stats.orders?.total} total orders)
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/orders')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                View All Orders
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-800">{stats.orders?.pending}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-800">{stats.orders?.confirmed}</div>
                <div className="text-sm text-blue-600">Confirmed</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-800">{stats.orders?.shipped}</div>
                <div className="text-sm text-purple-600">Shipped</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-800">{stats.orders?.delivered}</div>
                <div className="text-sm text-green-600">Delivered</div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders Preview</h3>
              <div className="space-y-2">
                {stats.recentOrders?.slice(0, 5).map((order, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => router.push('/admin/orders')}
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{order.orderId}</div>
                      <div className="text-sm text-gray-600">{order.customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(order.total)}</div>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push('/admin/orders')}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View All {stats.orders?.total} Orders →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
