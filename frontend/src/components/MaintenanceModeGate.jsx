'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const MaintenanceScreen = ({ title, message, estimatedEndTime }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-primary-50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
          {title}
        </h1>
        <p className="text-lg text-primary-700 mb-6">{message}</p>
        {estimatedEndTime && (
          <p className="text-sm text-primary-600">
            Estimated end time: {new Date(estimatedEndTime).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default function MaintenanceModeGate({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { settings, loading, error } = useSiteSettings();

  const maintenance = settings.maintenanceMode || {};
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAdminUser = user?.role === 'admin';

  if (loading) {
    return (
      <MaintenanceScreen
        title="Checking site status"
        message="Please wait while we verify availability."
      />
    );
  }

  if (error && !isAdminRoute && !isAdminUser) {
    return (
      <MaintenanceScreen
        title="Site temporarily unavailable"
        message="We are unable to verify site availability right now. Please try again shortly."
      />
    );
  }

  const shouldBypass =
    (maintenance.allowAdminAccess &&
      (isAdminRoute || isAdminUser));

  if (!maintenance.enabled || shouldBypass) {
    return children;
  }

  return (
    <MaintenanceScreen
      title={maintenance.title || 'Maintenance in progress'}
      message={maintenance.message || 'We are performing scheduled maintenance. Please check back soon.'}
      estimatedEndTime={maintenance.estimatedEndTime}
    />
  );
}
