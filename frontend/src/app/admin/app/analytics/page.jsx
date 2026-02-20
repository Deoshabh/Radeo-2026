'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/utils/api';
import Link from 'next/link';
import {
  FiArrowLeft, FiDownload, FiSmartphone, FiTrendingUp,
  FiBell, FiEye, FiCalendar,
} from 'react-icons/fi';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

const PERIODS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

const PIE_COLORS = ['#3B2F2F', '#8D6E63'];
const BAR_COLORS = ['#5D4037', '#D7CCC8', '#8D6E63', '#3B2F2F', '#A1887F'];

export default function AppAnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'app', 'analytics', period],
    queryFn: async () => {
      const r = await adminAPI.getAppAnalytics(period);
      return r.data?.data ?? r.data;
    },
    staleTime: 120_000,
  });

  const statsQ = useQuery({
    queryKey: ['admin', 'app', 'stats'],
    queryFn: async () => {
      const r = await adminAPI.getAppStats();
      return r.data?.data ?? r.data;
    },
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900" />
      </div>
    );
  }

  const installs = data?.installsByDay ?? [];
  const platformSplit = data?.platformSplit ?? [];
  const notifsByDay = data?.notificationsByDay ?? [];
  const notifTypes = data?.notificationTypes ?? [];
  const screenViews = data?.screenViews ?? [];
  const stats = statsQ.data ?? {};

  // Derived KPIs
  const totalInstalls = installs.reduce((s, d) => s + (d.count || 0), 0);
  const avgDaily = installs.length ? Math.round(totalInstalls / installs.length) : 0;
  const totalNotifs = notifsByDay.reduce((s, d) => s + (d.count || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/app" className="text-gray-400 hover:text-gray-600 transition-colors">
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">App Analytics</h1>
              <p className="text-sm text-gray-500 mt-0.5">Mobile app performance insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === p.value ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mini KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KPI icon={FiSmartphone} label="New Installs" value={totalInstalls} color="bg-blue-50 text-blue-600" />
          <KPI icon={FiTrendingUp} label="Avg / Day" value={avgDaily} color="bg-emerald-50 text-emerald-600" />
          <KPI icon={FiBell} label="Notifs Sent" value={totalNotifs} color="bg-amber-50 text-amber-600" />
          <KPI icon={FiEye} label="Active Today" value={stats.activeToday ?? '—'} color="bg-purple-50 text-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── Installs Over Time (2 col) ─── */}
          <div className="lg:col-span-2">
            <ChartCard title="App Installs" subtitle="New installs per day">
              {installs.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={installs} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="installGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B2F2F" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3B2F2F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => fmtDate(v)} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Installs" stroke="#3B2F2F" strokeWidth={2} fillOpacity={1} fill="url(#installGrad)" dot={false} activeDot={{ r: 4, stroke: '#3B2F2F', strokeWidth: 2, fill: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* ─── Platform Split (1 col) ─── */}
          <ChartCard title="Platform Split" subtitle="Android vs iOS">
            {platformSplit.length === 0 ? <EmptyState /> : (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={platformSplit} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="count" nameKey="_id" startAngle={90} endAngle={-270}>
                      {platformSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  {platformSplit.map((p, i) => (
                    <div key={p._id} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-600 capitalize">{p._id}</span>
                      <span className="font-semibold text-gray-800">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>

          {/* ─── Notifications Over Time (2 col) ─── */}
          <div className="lg:col-span-2">
            <ChartCard title="Notifications Sent" subtitle="Daily notification volume">
              {notifsByDay.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={notifsByDay} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => fmtDate(v)} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Notifications" fill="#5D4037" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* ─── Notification Type Breakdown (1 col) ─── */}
          <ChartCard title="Notification Types" subtitle="Breakdown by type">
            {notifTypes.length === 0 ? <EmptyState /> : (
              <div className="space-y-2.5">
                {notifTypes.map((t, i) => {
                  const total = notifTypes.reduce((s, x) => s + x.count, 0);
                  const pct = total ? Math.round((t.count / total) * 100) : 0;
                  return (
                    <div key={t._id} className="group">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 capitalize">{(t._id || 'other').replace(/_/g, ' ')}</span>
                        <span className="font-medium text-gray-800">{t.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ChartCard>

          {/* ─── Screen Views (full width) ─── */}
          <div className="lg:col-span-3">
            <ChartCard title="Popular Screens" subtitle="Based on recently viewed products">
              {screenViews.length === 0 ? <EmptyState /> : (
                <div className="overflow-x-auto -mx-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-gray-100">
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-right">Views</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {screenViews.slice(0, 15).map((sv, i) => {
                        const totalViews = screenViews.reduce((s, x) => s + x.count, 0);
                        const pct = totalViews ? ((sv.count / totalViews) * 100).toFixed(1) : 0;
                        return (
                          <tr key={sv._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-gray-800">{sv.name || sv._id}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-700">{sv.count.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="text-xs font-medium text-gray-500">{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function KPI({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <FiCalendar className="w-8 h-8 mb-2" />
      <p className="text-sm">No data for this period</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="text-gray-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-medium">{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
