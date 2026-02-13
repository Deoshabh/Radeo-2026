import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/utils/api';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const { data } = await adminAPI.getAdminStats();
      return {
        totalOrders: data.orders?.total || 0,
        totalProducts: data.products?.total || 0,
        totalUsers: data.users?.customers || 0,
        totalRevenue: data.revenue?.total || 0,
        // Keep raw data available if needed
        raw: data
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (stats don't change every second)
    // We will use invalidation for real-time updates later
  });
};
