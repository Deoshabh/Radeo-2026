'use client';

import { useState } from 'react';
import { useAnalyticsSummary, useAnalyticsFunnel } from '@/hooks/useAdmin';
import {
  FiEye, FiUsers, FiShoppingCart, FiTrendingUp,
  FiMonitor, FiSmartphone, FiTablet, FiRefreshCw,
  FiArrowRight, FiPackage, FiMousePointer
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const PERIODS = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
];

const EVENT_COLORS = {
  page_view: '#6366f1',
  product_view: '#8b5cf6',
  add_to_cart: '#f59e0b',
  begin_checkout: '#3b82f6',
  purchase: '#10b981',
  remove_from_cart: '#ef4444',
  wishlist_add: '#ec4899',
};

const DEVICE_COLORS = { desktop: '#6366f1', mobile: '#f59e0b', tablet: '#10b981' };
const DEVICE_ICONS = { desktop: FiMonitor, mobile: FiSmartphone, tablet: FiTablet };

function StatCard({ label, value, icon: Icon, color = 'primary', subtitle }) {
  const colors = {
    primary: 'text-primary-600',
    indigo: 'text-indigo-600',
    green: 'text-green-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-primary-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-primary-500 font-medium">{label}</p>
        <Icon className={`w-4 h-4 ${colors[color]}`} />
      </div>
      <p className="text-2xl font-bold text-primary-900">{value?.toLocaleString() ?? '—'}</p>
      {subtitle && <p className="text-xs text-primary-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function FunnelStep({ label, count, uniqueUsers, rate, isLast }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-white rounded-lg border border-primary-200 p-4">
        <p className="text-sm font-medium text-primary-800">{label}</p>
        <p className="text-xl font-bold text-primary-900 mt-1">{count?.toLocaleString() || 0}</p>
        <p className="text-xs text-primary-500 mt-0.5">{uniqueUsers || 0} unique users</p>
      </div>
      {!isLast && (
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <FiArrowRight className="w-5 h-5 text-primary-300" />
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            (rate || 0) >= 50 ? 'bg-green-100 text-green-700' :
            (rate || 0) >= 20 ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {rate != null ? `${rate.toFixed(1)}%` : '—'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d');
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useAnalyticsSummary(period);
  const { data: funnel, isLoading: funnelLoading, refetch: refetchFunnel } = useAnalyticsFunnel(period);
  const loading = summaryLoading || funnelLoading;

  const fetchData = () => { refetchSummary(); refetchFunnel(); };

  // Prepare device chart data
  const deviceData = (summary?.deviceBreakdown || summary?.devices)
    ? Object.entries(summary?.deviceBreakdown || summary?.devices)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({ name: key, value }))
    : [];

  // Prepare event type chart data
  const eventTypeData = summary?.eventCounts
    ? Object.entries(summary.eventCounts).map(([key, value]) => ({
        name: key.replace(/_/g, ' '),
        count: value,
        fill: EVENT_COLORS[key] || '#94a3b8',
      }))
    : [];

  // Funnel steps — backend returns array: [{step, total, uniqueUsers, conversionRate}]
  const funnelArr = Array.isArray(funnel?.funnel) ? funnel.funnel : [];
  const FUNNEL_LABELS = { product_view: 'Product Views', add_to_cart: 'Add to Cart', begin_checkout: 'Begin Checkout', purchase: 'Purchase' };
  const funnelSteps = funnelArr.map((s, i) => ({
    label: FUNNEL_LABELS[s.step] || s.step,
    total: s.total,
    uniqueUsers: s.uniqueUsers,
    rate: i === 0 ? null : s.conversionRate,
  }));

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Analytics</h1>
            <p className="text-sm text-primary-500 mt-1">Website traffic, conversion funnel &amp; engagement</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white border border-primary-200 rounded-lg overflow-hidden">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    period === p.key ? 'bg-primary-900 text-white' : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <FiRefreshCw className="w-6 h-6 animate-spin text-primary-400" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Events" value={summary?.totalEvents} icon={FiMousePointer} color="indigo" />
              <StatCard label="Unique Visitors" value={summary?.uniqueVisitors} icon={FiUsers} color="green" />
              <StatCard label="Product Views" value={summary?.eventCounts?.product_view} icon={FiEye} color="blue" />
              <StatCard label="Purchases" value={summary?.eventCounts?.purchase} icon={FiShoppingCart} color="amber" />
            </div>

            {/* Daily Trend Chart */}
            <div className="bg-white rounded-xl border border-primary-200 p-5 mb-6">
              <h2 className="text-sm font-semibold text-primary-800 mb-4">Daily Event Trend</h2>
              {(() => {
                // Backend returns [{_id:{date,event}, count}] — aggregate by date for chart
                const raw = summary?.dailyTrend || [];
                const byDate = {};
                raw.forEach(d => {
                  const date = d._id?.date || d.date;
                  if (!date) return;
                  byDate[date] = (byDate[date] || 0) + (d.count || 0);
                });
                const trendData = Object.entries(byDate).sort().map(([date, count]) => ({ date, count }));
                return trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#trendGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-primary-400 py-8">No trend data available</p>
              );
              })()}
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-xl border border-primary-200 p-5 mb-6">
              <h2 className="text-sm font-semibold text-primary-800 mb-4">Conversion Funnel</h2>
              {funnelSteps.length > 0 ? (
                <>
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {funnelSteps.map((step, i) => (
                      <FunnelStep
                        key={step.label}
                        label={step.label}
                        count={step.total}
                        uniqueUsers={step.uniqueUsers}
                        rate={step.rate}
                        isLast={i === funnelSteps.length - 1}
                      />
                    ))}
                  </div>
                  {funnel?.overallConversion != null && (
                    <p className="text-xs text-primary-500 mt-3 text-center">
                      Overall conversion: <span className="font-semibold text-primary-800">{funnel.overallConversion.toFixed(2)}%</span>
                      {' '}(view → purchase)
                    </p>
                  )}
                </>
              ) : (
                <p className="text-center text-primary-400 py-8">No funnel data available</p>
              )}
            </div>

            {/* Two Column: Event Types + Devices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Event Type Breakdown */}
              <div className="bg-white rounded-xl border border-primary-200 p-5">
                <h2 className="text-sm font-semibold text-primary-800 mb-4">Events by Type</h2>
                {eventTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={eventTypeData} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                        {eventTypeData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-primary-400 py-8">No event data</p>
                )}
              </div>

              {/* Device Breakdown */}
              <div className="bg-white rounded-xl border border-primary-200 p-5">
                <h2 className="text-sm font-semibold text-primary-800 mb-4">Device Breakdown</h2>
                {deviceData.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={deviceData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {deviceData.map((entry, i) => (
                            <Cell key={i} fill={DEVICE_COLORS[entry.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {deviceData.map(d => {
                        const total = deviceData.reduce((s, x) => s + x.value, 0);
                        const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : 0;
                        const Icon = DEVICE_ICONS[d.name] || FiMonitor;
                        return (
                          <div key={d.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEVICE_COLORS[d.name] || '#94a3b8' }} />
                            <Icon className="w-4 h-4 text-primary-500" />
                            <span className="text-sm capitalize text-primary-700">{d.name}</span>
                            <span className="text-sm font-semibold text-primary-900 ml-auto">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-primary-400 py-8">No device data</p>
                )}
              </div>
            </div>

            {/* Two Column: Top Products + Top Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Viewed Products */}
              <div className="bg-white rounded-xl border border-primary-200 p-5">
                <h2 className="text-sm font-semibold text-primary-800 mb-3">Top Viewed Products</h2>
                {summary?.topProducts?.length > 0 ? (
                  <div className="space-y-2">
                    {summary.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-primary-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-medium text-primary-400 w-5">{i + 1}.</span>
                          <span className="text-sm text-primary-800 truncate">{p.name || p._id || p.productId}</span>
                        </div>
                        <span className="text-sm font-semibold text-primary-900 flex-shrink-0">{p.views?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-primary-400 py-6">No product view data</p>
                )}
              </div>

              {/* Top Pages */}
              <div className="bg-white rounded-xl border border-primary-200 p-5">
                <h2 className="text-sm font-semibold text-primary-800 mb-3">Top Pages</h2>
                {summary?.topPages?.length > 0 ? (
                  <div className="space-y-2">
                    {summary.topPages.map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-primary-50 transition-colors">
                        <span className="text-sm text-primary-800 truncate font-mono">{p._id || p.page}</span>
                        <span className="text-sm font-semibold text-primary-900 flex-shrink-0">{p.views?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-primary-400 py-6">No page view data</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
