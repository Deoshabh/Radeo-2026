'use client';

import { useEffect } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import Link from 'next/link';

export default function ProductError({ error, reset }) {
  useEffect(() => {
    console.error('[Product Page Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <FiAlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-primary-900 mb-2">Product not available</h2>
        <p className="text-primary-500 mb-6">
          We couldn&apos;t load this product. It may be temporarily unavailable.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-brown text-white rounded-lg font-medium hover:bg-brand-brown/90 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/products"
            className="flex items-center gap-2 px-5 py-2.5 border border-primary-200 text-primary-700 rounded-lg font-medium hover:bg-primary-50 transition-colors"
          >
            <FiHome className="w-4 h-4" />
            All Products
          </Link>
        </div>
      </div>
    </div>
  );
}
