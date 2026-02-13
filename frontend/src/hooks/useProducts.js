import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/utils/api';
import toast from 'react-hot-toast';

export const useProducts = (params) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await adminAPI.getAllProducts(params);
      return data;
    },
    keepPreviousData: true, // Keep showing old data while fetching new page
    staleTime: 60 * 1000, 
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries(['products']);
    },
    onError: () => toast.error('Failed to delete product'),
  });
};

export const useBulkDeleteProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => adminAPI.bulkDeleteProducts(ids),
    onSuccess: () => {
      toast.success('Products deleted successfully');
      queryClient.invalidateQueries(['products']);
    },
    onError: () => toast.error('Failed to delete products'),
  });
};

export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => adminAPI.toggleProductStatus(id),
    onSuccess: (_, { currentStatus }) => {
      toast.success(`Product ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully`);
      queryClient.invalidateQueries(['products']);
    },
    onError: () => toast.error('Failed to update product status'),
  });
};

export const useBulkUpdateProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }) => adminAPI.bulkUpdateProductStatus(ids, status === 'active'),
    onSuccess: () => {
      toast.success('Product status updated');
      queryClient.invalidateQueries(['products']);
    },
    onError: () => toast.error('Failed to update status'),
  });
};

export const useToggleFeatured = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id }) => adminAPI.toggleProductFeatured(id),
      onSuccess: (_, { currentFeatured }) => {
        toast.success(`Product ${currentFeatured ? 'unmarked' : 'marked'} as featured`);
        queryClient.invalidateQueries(['products']);
      },
      onError: () => toast.error('Failed to update featured status'),
    });
  };
