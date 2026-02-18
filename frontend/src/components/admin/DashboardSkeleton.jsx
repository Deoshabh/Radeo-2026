'use client';

/**
 * Skeleton loading state for the admin dashboard.
 * Mirrors the layout of stat cards, charts, and quick actions.
 */
export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stat Cards Skeleton — 4 cards matching grid-cols-2 lg:grid-cols-4 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-20 bg-primary-200 rounded" />
                <div className="h-8 w-24 bg-primary-200 rounded" />
              </div>
              <div className="w-12 h-12 bg-primary-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton — matches grid-cols-1 lg:grid-cols-3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
        {/* Revenue chart placeholder */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="h-5 w-36 bg-primary-200 rounded mb-4" />
          <div className="h-[300px] bg-primary-100 rounded" />
        </div>
        {/* Pie chart placeholder */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-5 w-28 bg-primary-200 rounded mb-4" />
          <div className="h-[300px] bg-primary-100 rounded" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-6 w-32 bg-primary-200 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-primary-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-primary-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-primary-200 rounded" />
                  <div className="h-3 w-40 bg-primary-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
