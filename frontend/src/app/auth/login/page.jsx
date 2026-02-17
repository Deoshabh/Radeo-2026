'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/');
      return;
    }

    // Redirect to Firebase authentication for unauthenticated users
    router.replace('/auth/firebase-login');
  }, [router, isAuthenticated, loading]);

  if (!loading && isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-brown mx-auto mb-4"></div>
        <p className="text-primary-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
