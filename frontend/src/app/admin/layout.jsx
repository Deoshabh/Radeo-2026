'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';

/**
 * Shared Admin layout — wraps all /admin/* pages.
 * Provides:
 *   1. Client-side role guard (redirect non-admins)
 *   2. <AdminLayout> UI shell (sidebar, header)
 *
 * Middleware already blocks unauthenticated users server-side.
 */
export default function AdminRootLayout({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }

    setAuthorized(true);
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF9F7' }}>
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: '#E5E2DC', borderTopColor: '#1A1714' }} />
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
