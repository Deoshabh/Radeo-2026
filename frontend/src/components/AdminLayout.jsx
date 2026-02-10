'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag, FiPercent, FiStar, FiEdit3, FiLayout } from 'react-icons/fi';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', icon: FiGrid, label: 'Dashboard', exact: true },
    { href: '/admin/products', icon: FiPackage, label: 'Products' },
    { href: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
    { href: '/admin/reviews', icon: FiStar, label: 'Reviews' },
    { href: '/admin/users', icon: FiUsers, label: 'Users' },
    { href: '/admin/categories', icon: FiTag, label: 'Categories' },
    { href: '/admin/coupons', icon: FiPercent, label: 'Coupons' },
    { href: '/admin/cms', icon: FiLayout, label: 'Branding & Banners' },
    { href: '/admin/content', icon: FiEdit3, label: 'Advanced Content' },
  ];

  const isActive = (href, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-primary-50 pt-[80px]">
      <div className="flex">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside className="hidden lg:block w-64 bg-white shadow-md fixed left-0 top-[80px] bottom-0 overflow-y-auto">
          <div className="p-4 border-b border-primary-200">
            <h2 className="text-xl font-bold text-primary-900">Admin Panel</h2>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active
                        ? 'bg-primary-900 text-white'
                        : 'text-primary-700 hover:bg-primary-100'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Mobile Navigation - Horizontal scroll on mobile */}
        <div className="lg:hidden fixed left-0 right-0 top-[80px] bg-white shadow-md z-40 overflow-x-auto">
          <nav className="flex p-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${active
                    ? 'bg-primary-900 text-white'
                    : 'text-primary-700 hover:bg-primary-100'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
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
