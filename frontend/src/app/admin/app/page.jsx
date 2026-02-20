'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/utils/api';
import {
  FiSmartphone, FiUsers, FiBell, FiRefreshCw, FiImage,
  FiSettings, FiBarChart2, FiSend, FiArrowUpRight,
  FiToggleRight, FiAlertTriangle, FiCheckCircle,
} from 'react-icons/fi';

export default function AppDashboardPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'app', 'stats'],
    queryFn: async () => {
      const res = await adminAPI.getAppStats();
      return res.data?.data ?? res.data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900" />
      </div>
    );
  }

  const stats = data || {};

  const kpiCards = [
    {
      title: 'App Installs',
      value: (stats.totalAppInstalls || 0).toLocaleString(),
      subtitle: `${stats.iosUsers || 0} iOS · ${stats.androidUsers || 0} Android`,
      icon: FiSmartphone,
      color: 'bg-indigo-500',
      href: '/admin/app/analytics',
    },
    {
      title: 'Active Today',
      value: (stats.activeToday || 0).toLocaleString(),
      subtitle: 'users active today',
      icon: FiUsers,
      color: 'bg-emerald-500',
      href: '/admin/app/analytics',
    },
    {
      title: 'Notifications Sent',
      value: (stats.notifsSentThisMonth || 0).toLocaleString(),
      subtitle: 'this month',
      icon: FiBell,
      color: 'bg-amber-500',
      href: '/admin/app/notifications',
    },
    {
      title: 'App Version',
      value: stats.currentVersion || '1.0.0',
      subtitle: stats.forceUpdate ? 'Force update ON' : `Min: v${stats.minAppVersion || '1.0.0'}`,
      icon: FiToggleRight,
      color: stats.forceUpdate ? 'bg-red-500' : 'bg-blue-500',
      href: '/admin/app/config',
    },
  ];

  const quickActions = [
    { title: 'Manage Banners', icon: FiImage, href: '/admin/app/banners', desc: `${stats.activeBanners || 0} active banners` },
    { title: 'App Config', icon: FiSettings, href: '/admin/app/config', desc: 'Maintenance, features, version' },
    { title: 'Send Notification', icon: FiSend, href: '/admin/app/notifications', desc: 'Push to app users' },
    { title: 'App Analytics', icon: FiBarChart2, href: '/admin/app/analytics', desc: 'Installs, platform split' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mobile App</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your React Native app without releasing updates</p>
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

        {/* Alerts */}
        {stats.maintenanceMode && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium bg-red-50 border-red-200 text-red-800 mb-6">
            <FiAlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">Maintenance mode is currently ON — app users see the maintenance screen</span>
            <Link href="/admin/app/config" className="text-red-600 hover:text-red-700">
              <FiArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {stats.forceUpdate && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium bg-amber-50 border-amber-200 text-amber-800 mb-6">
            <FiAlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">Force update is enabled — users below v{stats.minAppVersion} must update</span>
            <Link href="/admin/app/config" className="text-amber-600 hover:text-amber-700">
              <FiArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!stats.maintenanceMode && !stats.forceUpdate && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium bg-emerald-50 border-emerald-200 text-emerald-800 mb-6">
            <FiCheckCircle className="w-4 h-4 shrink-0" />
            <span>App is running normally</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {kpiCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Link key={i} href={card.href} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`${card.color} p-2.5 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{card.value}</p>
                <p className="text-xs text-gray-500">{card.subtitle}</p>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-2">{card.title}</p>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} href={action.href} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-gray-600 group-hover:text-primary-900 transition-colors" />
                  <span className="font-semibold text-sm text-gray-900">{action.title}</span>
                </div>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
