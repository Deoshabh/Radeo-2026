'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import anime from 'animejs';
import AdminLayout from '@/components/AdminLayout';
import AnimatedEntry from '@/components/ui/AnimatedEntry';
import RevenueChart from '@/components/admin/charts/RevenueChart';
import SalesCategoryPieChart from '@/components/admin/charts/SalesCategoryPieChart';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/utils/api';
import { formatCurrency } from '@/utils/helpers';
import { FiDollarSign, FiShoppingBag, FiUsers, FiBox, FiSettings, FiTruck } from 'react-icons/fi';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getAdminStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const AnimeCounter = ({ value, format = (v) => v }) => {
    const nodeRef = useRef(null);

    useEffect(() => {
      if (!nodeRef.current) return;

      const controls = anime({
        targets: nodeRef.current,
        innerHTML: [0, value],
        round: 1,
        easing: 'easeOutExpo',
        duration: 2000,
        update: function (anim) {
          if (nodeRef.current) {
            nodeRef.current.innerHTML = format(anim.animations[0].currentValue);
          }
        }
      });

      return () => controls.pause();
    }, [value, format]);

    return <span ref={nodeRef}>0</span>;
  };

  const adminCards = [
    {
      title: 'Total Revenue',
      value: loading ? '...' : formatCurrency(stats?.revenue?.total),
      icon: FiDollarSign,
      color: 'bg-green-500',
      link: '/admin/orders'
    },
    {
      title: 'Total Orders',
      value: loading ? '...' : (stats?.orders?.total || 0),
      icon: FiShoppingBag,
      color: 'bg-blue-500',
      link: '/admin/orders'
    },
    {
      title: 'Products',
      value: loading ? '...' : (stats?.products?.total || 0),
      icon: FiBox,
      color: 'bg-indigo-500',
      link: '/admin/products'
    },
    {
      title: 'Customers',
      value: loading ? '...' : (stats?.users?.customers || 0),
      icon: FiUsers,
      color: 'bg-purple-500',
      link: '/admin/users'
    }
  ];

  const quickLinks = [
    {
      title: 'Add New Product',
      description: 'Create a new product listing',
      icon: FiBox,
      href: '/admin/products/new'
    },
    {
      title: 'View Orders',
      description: 'Manage customer orders',
      icon: FiTruck,
      href: '/admin/orders'
    },
    {
      title: 'Site CMS Settings',
      description: 'Manage branding, banners, home and theme colors',
      icon: FiSettings,
      href: '/admin/cms'
    }
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-primary-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <AnimatedEntry className="mb-6 sm:mb-8" delay={0}>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-primary-600">Welcome back, {user?.name}!</p>
          </AnimatedEntry>

          {/* Stats Cards */}
          <AnimatedEntry className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8" delay={100}>
            {adminCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Link
                  key={index}
                  href={card.link}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-600 text-sm mb-1">{card.title}</p>
                      <p className="text-2xl font-bold text-primary-900">
                        {loading ? '...' : (
                          card.title === 'Total Revenue' ?
                            <AnimeCounter value={stats?.revenue?.total || 0} format={formatCurrency} /> :
                            <AnimeCounter value={parseInt(card.value) || 0} />
                        )}
                      </p>
                    </div>
                    <div className={`${card.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </AnimatedEntry>

          {/* Stats Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
            <AnimatedEntry className="lg:col-span-2" delay={200}>
              <RevenueChart data={stats?.revenue_history} />
            </AnimatedEntry>
            <AnimatedEntry delay={250}>
              <SalesCategoryPieChart data={stats?.category_sales} />
            </AnimatedEntry>
          </div>

          {/* Quick Links */}
          <AnimatedEntry className="bg-white rounded-lg shadow-md p-6" delay={300}>
            <h2 className="text-xl font-bold text-primary-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={index}
                    href={link.href}
                    className="border border-primary-200 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-brand-brown group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary-900 mb-1">{link.title}</h3>
                        <p className="text-sm text-primary-600">{link.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </AnimatedEntry>

          {/* Notice */}
          <AnimatedEntry className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4" delay={400}>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Admin Panel</h3>
                <p className="text-sm text-yellow-800">
                  This is the admin dashboard. Individual admin pages (Products, Orders, Users, etc.) will be created as you need them.
                  Click on any of the quick actions above to manage different aspects of your e-commerce store.
                </p>
              </div>
            </div>
          </AnimatedEntry>
        </div>
      </div>
    </AdminLayout>
  );
}
