'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Firebase handles password reset through its own UI flow
    // Redirect to login page after a short delay
    const timeout = setTimeout(() => {
      router.push('/auth/firebase-login');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-primary-50 pt-24 flex items-center justify-center">
      <div className="container-custom py-12">
        <div className="max-w-md mx-auto">
          <Link href="/auth/firebase-login" className="inline-flex items-center gap-2 text-primary-600 hover:text-brand-brown mb-8">
            <FiArrowLeft />
            Back to Login
          </Link>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-brand-brown"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>

            <h1 className="font-serif text-3xl font-bold text-primary-900 mb-4">Password Reset</h1>
            
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-4 rounded-lg mb-6">
              <p className="font-medium mb-2">Firebase Authentication</p>
              <p className="text-sm">
                Password resets are now handled through Firebase. Please use the reset link sent to your email or request a new one from the login page.
              </p>
            </div>

            <p className="text-primary-600 mb-6">
              Redirecting to login page...
            </p>

            <Link href="/auth/firebase-login" className="btn btn-primary">
              Go to Login Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
