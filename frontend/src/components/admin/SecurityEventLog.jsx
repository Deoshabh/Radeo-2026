'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/utils/api';
import { formatDistanceToNow } from 'date-fns';
import { FiShield, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

const eventTypeColors = {
  'failed-login': 'bg-red-100 text-red-700',
  login: 'bg-green-100 text-green-700',
  'role-change': 'bg-amber-100 text-amber-700',
  block: 'bg-red-100 text-red-700',
  'coupon-probe': 'bg-orange-100 text-orange-700',
  'password-reset': 'bg-blue-100 text-blue-700',
  'token-reuse': 'bg-purple-100 text-purple-700',
  'ip-anomaly': 'bg-yellow-100 text-yellow-700',
};

export function SecurityEventLog() {
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['security-events', page],
    queryFn: () => adminAPI.getSecurityEvents({ page, limit }),
    staleTime: 60_000,
    refetchInterval: 30_000, // Auto-refresh every 30s
  });

  const events = data?.events || data?.data?.events || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiShield className="w-5 h-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Security Events
          </h3>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-sm text-gray-400 py-8 text-center">
          Loading security events...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-500 py-4 text-center flex items-center justify-center gap-2">
          <FiAlertTriangle className="w-4 h-4" />
          Failed to load security events
        </div>
      )}

      {/* Event List */}
      {!isLoading && !error && events.length === 0 && (
        <div className="text-sm text-gray-400 py-8 text-center">
          No security events recorded
        </div>
      )}

      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event._id}
            className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                eventTypeColors[event.eventType] ||
                'bg-gray-100 text-gray-600'
              }`}
            >
              {event.eventType}
            </span>
            <span className="text-gray-900 font-medium flex-1 truncate">
              {event.actor?.name || event.actorEmail || 'Unknown'}
            </span>
            <span className="text-gray-400 text-xs hidden sm:inline">
              {event.ipAddress || '—'}
            </span>
            <span className="text-gray-400 text-xs whitespace-nowrap">
              {event.createdAt
                ? formatDistanceToNow(new Date(event.createdAt), {
                    addSuffix: true,
                  })
                : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-xs border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= (data?.totalPages || 1)}
            className="px-3 py-1 text-xs border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
