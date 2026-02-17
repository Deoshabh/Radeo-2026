'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag, FiPercent, FiStar, FiArrowLeft, FiSettings, FiSearch } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/context/AdminContext';
import AdminCommandPalette from '@/components/admin/AdminCommandPalette';

// Navigation Link Component that checks dirty state
const AdminLink = ({ href, active, icon: Icon, label, className }) => {
  const { isFormDirty } = useAdmin();
  const router = useRouter();

  const handleClick = (e) => {
    e.preventDefault();
    if (isFormDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(href);
      }
    } else {
      router.push(href);
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      <Icon className="w-5 h-5" />
      {label}
    </a>
  );
};

// Mobile Link Component
const MobileAdminLink = ({ href, active, icon: Icon, label, className }) => {
  const { isFormDirty } = useAdmin();
  const router = useRouter();

  const handleClick = (e) => {
    e.preventDefault();
    if (isFormDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(href);
      }
    } else {
      router.push(href);
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </a>
  );
};

const Sidebar = ({ navItems, isActive }) => {
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (sidebarRef.current) {
      anime({
        targets: sidebarRef.current.children,
        translateX: [-20, 0],
        opacity: [0, 1],
        delay: anime.stagger(50),
        easing: 'easeOutQuad',
        duration: 400
      });
    }
  }, []);

  return (
    <aside className="hidden lg:block w-64 bg-white shadow-md fixed left-0 top-[80px] bottom-0 overflow-y-auto">
      <div className="p-4 border-b border-primary-200">
        <h2 className="text-xl font-bold text-primary-900">Admin Panel</h2>
      </div>
      <nav className="p-4">
        <ul ref={sidebarRef} className="space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href} className="opacity-0">
                <AdminLink
                  href={item.href}
                  active={active}
                  icon={item.icon}
                  label={item.label}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${active
                    ? 'bg-primary-900 text-white'
                    : 'text-primary-700 hover:bg-primary-100'
                    }`}
                />
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}

function AdminLayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isFormDirty } = useAdmin();

  const handleBackToStore = (e) => {
    e.preventDefault();
    if (isFormDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  };

  const navItems = [
    { href: '/admin', icon: FiGrid, label: 'Dashboard', exact: true },
    { href: '/admin/products', icon: FiPackage, label: 'Products' },
    { href: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
    { href: '/admin/reviews', icon: FiStar, label: 'Reviews' },
    { href: '/admin/users', icon: FiUsers, label: 'Users' },
    { href: '/admin/categories', icon: FiTag, label: 'Categories' },
    { href: '/admin/coupons', icon: FiPercent, label: 'Coupons' },
    { href: '/admin/seo', icon: FiSearch, label: 'SEO' },
    { href: '/admin/cms', icon: FiSettings, label: 'Settings' },
  ];

  const isActive = (href, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <AdminCommandPalette />
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 h-[80px] bg-white shadow-sm z-50 px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold font-serif text-primary-900">Radeo Admin</span>
        </div>
        <button
          onClick={handleBackToStore}
          className="flex items-center gap-2 text-primary-600 hover:text-brand-brown transition-colors px-3 py-2 rounded-lg hover:bg-primary-50"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Store</span>
        </button>
      </header>

      <div className="flex">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <Sidebar navItems={navItems} isActive={isActive} />

        {/* Mobile Navigation - Horizontal scroll on mobile */}
        <div className="lg:hidden fixed left-0 right-0 top-[80px] bg-white shadow-md z-40 overflow-x-auto">
          <nav className="flex p-2 gap-2">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <MobileAdminLink
                  key={item.href}
                  href={item.href}
                  active={active}
                  icon={item.icon}
                  label={item.label}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${active
                    ? 'bg-primary-900 text-white'
                    : 'text-primary-700 hover:bg-primary-100'
                    }`}
                />
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 mt-0 lg:mt-0">
          <div className="pt-16 lg:pt-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
