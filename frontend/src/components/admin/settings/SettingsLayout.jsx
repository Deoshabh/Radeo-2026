'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FiHome, FiImage, FiLayout, FiFileText, FiPhone, FiSettings,
} from 'react-icons/fi';

const SETTINGS_TABS = [
  { key: 'homepage', label: 'Homepage', href: '/admin/settings/homepage', icon: <FiHome className="w-4 h-4" /> },
  { key: 'branding', label: 'Branding', href: '/admin/settings/branding', icon: <FiImage className="w-4 h-4" /> },
  { key: 'banners', label: 'Banners', href: '/admin/settings/banners', icon: <FiLayout className="w-4 h-4" /> },
  { key: 'announcement', label: 'Announcement', href: '/admin/settings/announcement', icon: <span className="text-sm">📢</span> },
  { key: 'theme', label: 'Theme', href: '/admin/settings/theme', icon: <span className="text-sm">🎨</span> },
  { key: 'about', label: 'About', href: '/admin/settings/about', icon: <span className="text-sm">📄</span> },
  { key: 'policies', label: 'Policies', href: '/admin/settings/policies', icon: <FiFileText className="w-4 h-4" /> },
  { key: 'contact', label: 'Contact', href: '/admin/settings/contact', icon: <FiPhone className="w-4 h-4" /> },
  { key: 'system', label: 'System', href: '/admin/settings/system', icon: <FiSettings className="w-4 h-4" /> },
];

export default function SettingsLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Site Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your website&apos;s content, appearance, and configuration.</p>
        </div>

        {/* Tab bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 flex overflow-x-auto no-scrollbar">
          {SETTINGS_TABS.map(t => {
            const isActive = pathname === t.href || (t.key === 'homepage' && pathname === '/admin/settings');
            return (
              <Link
                key={t.key}
                href={t.href}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-gray-900 text-gray-900 bg-gray-50/50'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.icon} {t.label}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
