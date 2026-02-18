'use client';

import { useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error('[AdminPanel]', error.message, error.stack);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <FiAlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {error.message || 'An unexpected error occurred in the admin panel.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-gray-900 text-white text-sm py-2.5 rounded hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = '/admin')}
            className="flex-1 border border-gray-200 text-gray-700 text-sm py-2.5 rounded hover:bg-gray-50"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
