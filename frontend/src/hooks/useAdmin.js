import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, categoryAPI, productAPI } from '@/utils/api';
import toast from 'react-hot-toast';

// ─── Query-key factories ───────────────────────────────────────────
export const adminKeys = {
  all:        ['admin'],
  stats:      ()          => [...adminKeys.all, 'stats'],
  depsHealth: ()          => [...adminKeys.all, 'deps-health'],

  orders:     (params)    => [...adminKeys.all, 'orders', params],
  order:      (id)        => [...adminKeys.all, 'orders', id],

  users:      (params)    => [...adminKeys.all, 'users', params],
  user:       (id)        => [...adminKeys.all, 'users', id],
  userHistory:(id)        => [...adminKeys.all, 'users', id, 'history'],

  reviews:    (params)    => [...adminKeys.all, 'reviews', params],

  categories: ()          => [...adminKeys.all, 'categories'],
  publicCats: ()          => ['categories'],

  coupons:    ()          => [...adminKeys.all, 'coupons'],
  couponStats:()          => [...adminKeys.all, 'coupon-stats'],

  filters:    ()          => [...adminKeys.all, 'filters'],

  inventory:  ()          => [...adminKeys.all, 'inventory'],
  stockMoves: (id)        => [...adminKeys.all, 'stock-movements', id],

  analytics:  (period)    => [...adminKeys.all, 'analytics', period],
  funnel:     (period)    => [...adminKeys.all, 'funnel', period],

  seo:        ()          => [...adminKeys.all, 'seo'],
  seoAudit:   ()          => [...adminKeys.all, 'seo-audit'],

  cmsPages:   (params)    => [...adminKeys.all, 'cms-pages', params],
  cmsMedia:   (params)    => [...adminKeys.all, 'cms-media', params],
  cmsMenus:   ()          => [...adminKeys.all, 'cms-menus'],
  orphanMedia:()          => [...adminKeys.all, 'orphan-media'],

  brands:     ()          => [...adminKeys.all, 'brands'],

  settings:   ()          => [...adminKeys.all, 'settings'],
  advSettings:()          => [...adminKeys.all, 'adv-settings'],
};

// ─── Stats / Health ────────────────────────────────────────────────
export const useAdminStats = () =>
  useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => { const { data } = await adminAPI.getAdminStats(); return data; },
    staleTime: 60_000,
  });

export const useDepsHealth = () =>
  useQuery({
    queryKey: adminKeys.depsHealth(),
    queryFn: async () => { const { data } = await adminAPI.getDependenciesHealth(); return data; },
    staleTime: 60_000,
  });

// ─── Analytics ─────────────────────────────────────────────────────
export const useAnalyticsSummary = (period) =>
  useQuery({
    queryKey: adminKeys.analytics(period),
    queryFn: async () => { const { data } = await adminAPI.getAnalyticsSummary(period); return data; },
    staleTime: 60_000,
  });

export const useAnalyticsFunnel = (period) =>
  useQuery({
    queryKey: adminKeys.funnel(period),
    queryFn: async () => { const { data } = await adminAPI.getAnalyticsFunnel(period); return data; },
    staleTime: 60_000,
  });

// ─── Orders ────────────────────────────────────────────────────────
export const useOrders = (params) =>
  useQuery({
    queryKey: adminKeys.orders(params),
    queryFn: async () => { const { data } = await adminAPI.getAllOrders(params); return data; },
    keepPreviousData: true,
    staleTime: 30_000,
  });

export const useTrackShipment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => adminAPI.trackShipment(orderId),
    onSuccess: () => { toast.success('Tracking updated'); qc.invalidateQueries({ queryKey: ['admin', 'orders'] }); },
    onError: () => toast.error('Tracking failed'),
  });
};

export const useGenerateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => adminAPI.generateInvoice(orderId),
    onSuccess: (res) => {
      toast.success('Invoice generated');
      if (res?.data?.invoiceUrl) window.open(res.data.invoiceUrl, '_blank');
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: () => toast.error('Invoice generation failed'),
  });
};

export const useShiprocketSync = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminAPI.triggerShiprocketReconciliation(),
    onSuccess: () => { toast.success('Shiprocket sync complete'); qc.invalidateQueries({ queryKey: ['admin', 'orders'] }); },
    onError: () => toast.error('Sync failed'),
  });
};

export const useBulkCreateShipments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderIds) => adminAPI.bulkCreateShipments(orderIds),
    onSuccess: () => { toast.success('Shipments created'); qc.invalidateQueries({ queryKey: ['admin', 'orders'] }); },
    onError: () => toast.error('Failed to create shipments'),
  });
};

export const useBulkPrintLabels = () =>
  useMutation({
    mutationFn: (orderIds) => adminAPI.bulkPrintLabels(orderIds),
    onSuccess: (res) => {
      toast.success('Labels ready');
      if (res?.data?.url) window.open(res.data.url, '_blank');
    },
    onError: () => toast.error('Failed to print labels'),
  });

export const useBulkUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderIds, status }) => adminAPI.bulkUpdateStatus(orderIds, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['admin', 'orders'] }); },
    onError: () => toast.error('Status update failed'),
  });
};

// ─── Users ─────────────────────────────────────────────────────────
export const useUsers = (params) =>
  useQuery({
    queryKey: adminKeys.users(params),
    queryFn: async () => { const { data } = await adminAPI.getAllUsers(params); return data; },
    staleTime: 60_000,
  });

export const useUserHistory = (userId) =>
  useQuery({
    queryKey: adminKeys.userHistory(userId),
    queryFn: async () => { const { data } = await adminAPI.getUserHistory(userId); return data; },
    enabled: !!userId,
  });

export const useUpdateUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }) => adminAPI.updateUserRole(userId, role),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: () => toast.error('Failed to update role'),
  });
};

export const useToggleUserBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => adminAPI.toggleUserBlock(userId),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: () => toast.error('Failed to update user status'),
  });
};

export const useCreateAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminAPI.createAdmin(data),
    onSuccess: () => { toast.success('Admin created'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create admin'),
  });
};

// ─── Reviews ───────────────────────────────────────────────────────
export const useReviews = (params) =>
  useQuery({
    queryKey: adminKeys.reviews(params),
    queryFn: async () => { const { data } = await adminAPI.getAllReviews(params); return data; },
    keepPreviousData: true,
    staleTime: 30_000,
  });

export const useToggleReviewHidden = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.toggleReviewHidden(id),
    onSuccess: () => { toast.success('Review visibility toggled'); qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }); },
    onError: () => toast.error('Failed to toggle review'),
  });
};

export const useDeleteReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.deleteReview(id),
    onSuccess: () => { toast.success('Review deleted'); qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }); },
    onError: () => toast.error('Failed to delete review'),
  });
};

export const useBulkHideReviews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewIds, hide }) => adminAPI.bulkHideReviews({ reviewIds, hide }),
    onSuccess: () => { toast.success('Reviews updated'); qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }); },
    onError: () => toast.error('Bulk update failed'),
  });
};

export const useBulkDeleteReviews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reviewIds) => adminAPI.bulkDeleteReviews({ reviewIds }),
    onSuccess: () => { toast.success('Reviews deleted'); qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }); },
    onError: () => toast.error('Bulk delete failed'),
  });
};

export const useReplyToReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }) => adminAPI.replyToReview(id, text),
    onSuccess: () => { toast.success('Reply posted'); qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }); },
    onError: () => toast.error('Failed to post reply'),
  });
};

export const useDeleteReviewReply = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.deleteReviewReply(id),
    onSuccess: () => { toast.success('Reply deleted'); qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }); },
    onError: () => toast.error('Failed to delete reply'),
  });
};

// ─── Categories ────────────────────────────────────────────────────
export const useAdminCategories = () =>
  useQuery({
    queryKey: adminKeys.categories(),
    queryFn: async () => { const { data } = await adminAPI.getAllCategories(); return data; },
    staleTime: 60_000,
  });

export const usePublicCategories = () =>
  useQuery({
    queryKey: adminKeys.publicCats(),
    queryFn: async () => { const { data } = await categoryAPI.getAllCategories(); return data; },
    staleTime: 5 * 60_000,
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminAPI.createCategory(data),
    onSuccess: () => { toast.success('Category created'); qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); qc.invalidateQueries({ queryKey: ['categories'] }); },
    onError: () => toast.error('Failed to create category'),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateCategory(id, data),
    onSuccess: () => { toast.success('Category updated'); qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); qc.invalidateQueries({ queryKey: ['categories'] }); },
    onError: () => toast.error('Failed to update category'),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.deleteCategory(id),
    onSuccess: () => { toast.success('Category deleted'); qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); qc.invalidateQueries({ queryKey: ['categories'] }); },
    onError: () => toast.error('Failed to delete category'),
  });
};

export const useToggleCategoryStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.toggleCategoryStatus(id),
    onSuccess: () => { toast.success('Category status toggled'); qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); qc.invalidateQueries({ queryKey: ['categories'] }); },
    onError: () => toast.error('Failed to toggle category'),
  });
};

// ─── Coupons ───────────────────────────────────────────────────────
export const useCoupons = () =>
  useQuery({
    queryKey: adminKeys.coupons(),
    queryFn: async () => { const { data } = await adminAPI.getAllCoupons(); return data; },
    staleTime: 60_000,
  });

export const useCouponStats = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.couponStats(),
    queryFn: async () => { const { data } = await adminAPI.getCouponStats(); return data; },
    enabled,
    staleTime: 60_000,
  });

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminAPI.createCoupon(data),
    onSuccess: () => { toast.success('Coupon created'); qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }); },
    onError: () => toast.error('Failed to create coupon'),
  });
};

export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateCoupon(id, data),
    onSuccess: () => { toast.success('Coupon updated'); qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }); },
    onError: () => toast.error('Failed to update coupon'),
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.deleteCoupon(id),
    onSuccess: () => { toast.success('Coupon deleted'); qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }); },
    onError: () => toast.error('Failed to delete coupon'),
  });
};

export const useToggleCouponStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.toggleCouponStatus(id),
    onSuccess: () => { toast.success('Coupon status updated'); qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }); },
    onError: () => toast.error('Failed to toggle coupon'),
  });
};

// ─── Filters ───────────────────────────────────────────────────────
export const useFilters = () =>
  useQuery({
    queryKey: adminKeys.filters(),
    queryFn: async () => { const { data } = await adminAPI.getAllFilters(); return data; },
    staleTime: 60_000,
  });

export const useCreateFilter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminAPI.createFilter(data),
    onSuccess: () => { toast.success('Filter created'); qc.invalidateQueries({ queryKey: ['admin', 'filters'] }); },
    onError: () => toast.error('Failed to create filter'),
  });
};

export const useUpdateFilter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateFilter(id, data),
    onSuccess: () => { toast.success('Filter updated'); qc.invalidateQueries({ queryKey: ['admin', 'filters'] }); },
    onError: () => toast.error('Failed to update filter'),
  });
};

export const useDeleteFilter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.deleteFilter(id),
    onSuccess: () => { toast.success('Filter deleted'); qc.invalidateQueries({ queryKey: ['admin', 'filters'] }); },
    onError: () => toast.error('Failed to delete filter'),
  });
};

export const useToggleFilterStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.toggleFilterStatus(id),
    onSuccess: () => { toast.success('Filter status toggled'); qc.invalidateQueries({ queryKey: ['admin', 'filters'] }); },
    onError: () => toast.error('Failed to toggle filter'),
  });
};

// ─── Inventory ─────────────────────────────────────────────────────
export const useInventory = () =>
  useQuery({
    queryKey: adminKeys.inventory(),
    queryFn: async () => { const { data } = await adminAPI.getAllProducts({ limit: 1000 }); return data; },
    staleTime: 60_000,
  });

export const useStockMovements = (productId) =>
  useQuery({
    queryKey: adminKeys.stockMoves(productId),
    queryFn: async () => { const { data } = await adminAPI.getStockMovements(productId); return data; },
    enabled: !!productId,
  });

export const useUpdateStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stock, sizes }) => adminAPI.updateProduct(id, { stock, sizes }),
    onSuccess: () => { toast.success('Stock updated'); qc.invalidateQueries({ queryKey: ['admin', 'inventory'] }); qc.invalidateQueries({ queryKey: ['products'] }); },
    onError: () => toast.error('Failed to update stock'),
  });
};

// ─── SEO ───────────────────────────────────────────────────────────
export const useSeoSettings = () =>
  useQuery({
    queryKey: adminKeys.seo(),
    queryFn: async () => { const { data } = await adminAPI.getSeoSettings(); return data; },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

export const useUpdateSeoSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seoSettings) => adminAPI.updateSeoSettings(seoSettings),
    onSuccess: () => { toast.success('SEO settings saved'); qc.invalidateQueries({ queryKey: ['admin', 'seo'] }); },
    onError: () => toast.error('Failed to save SEO settings'),
  });
};

export const useSeoAudit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminAPI.auditSeo(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'seo-audit'] }); },
    onError: () => toast.error('Audit failed'),
  });
};

export const useAutoGenerateSeo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (type) => adminAPI.autoGenerateSeo(type),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'seo'] }); },
    onError: () => toast.error('Auto-generate failed'),
  });
};

// ─── CMS ───────────────────────────────────────────────────────────
export const useCmsPages = (params) =>
  useQuery({
    queryKey: adminKeys.cmsPages(params),
    queryFn: async () => { const { data } = await adminAPI.getCmsPages(params); return data; },
    keepPreviousData: true,
    staleTime: 30_000,
  });

export const useCmsMedia = (params, enabled = true) =>
  useQuery({
    queryKey: adminKeys.cmsMedia(params),
    queryFn: async () => { const { data } = await adminAPI.getCmsMedia(params); return data; },
    keepPreviousData: true,
    enabled,
    staleTime: 30_000,
  });

export const useCmsMenus = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.cmsMenus(),
    queryFn: async () => { const { data } = await adminAPI.getCmsMenus(); return data; },
    enabled,
    staleTime: 60_000,
  });

export const useOrphanedMedia = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.orphanMedia(),
    queryFn: async () => { const { data } = await adminAPI.getOrphanedMedia({ limit: 50 }); return data; },
    enabled,
    staleTime: 60_000,
  });

export const useCreateCmsPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminAPI.createCmsPage(data),
    onSuccess: () => { toast.success('Page created'); qc.invalidateQueries({ queryKey: ['admin', 'cms-pages'] }); },
    onError: () => toast.error('Failed to create page'),
  });
};

export const useUpdateCmsPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateCmsPage(id, data),
    onSuccess: () => { toast.success('Page updated'); qc.invalidateQueries({ queryKey: ['admin', 'cms-pages'] }); },
    onError: () => toast.error('Failed to update page'),
  });
};

export const useDeleteCmsPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.deleteCmsPage(id),
    onSuccess: () => { toast.success('Page deleted'); qc.invalidateQueries({ queryKey: ['admin', 'cms-pages'] }); },
    onError: () => toast.error('Failed to delete page'),
  });
};

export const usePublishCmsPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminAPI.publishCmsPage(id),
    onSuccess: () => { toast.success('Page published'); qc.invalidateQueries({ queryKey: ['admin', 'cms-pages'] }); },
    onError: () => toast.error('Failed to publish page'),
  });
};

export const useDeleteOrphanedMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => adminAPI.deleteOrphanedMedia(ids),
    onSuccess: () => { toast.success('Orphaned media cleaned'); qc.invalidateQueries({ queryKey: ['admin', 'orphan-media'] }); qc.invalidateQueries({ queryKey: ['admin', 'cms-media'] }); },
    onError: () => toast.error('Failed to clean orphaned media'),
  });
};

export const useUpdateCmsMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateCmsMedia(id, data),
    onSuccess: () => { toast.success('Media updated'); qc.invalidateQueries({ queryKey: ['admin', 'cms-media'] }); },
    onError: () => toast.error('Failed to update media'),
  });
};

export const useCreateCmsMenu = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminAPI.createCmsMenu(data),
    onSuccess: () => { toast.success('Menu created'); qc.invalidateQueries({ queryKey: ['admin', 'cms-menus'] }); },
    onError: () => toast.error('Failed to create menu'),
  });
};

// ─── Brands (for product filter dropdowns) ─────────────────────────
export const useBrands = () =>
  useQuery({
    queryKey: adminKeys.brands(),
    queryFn: async () => { const { data } = await productAPI.getBrands(); return data; },
    staleTime: 5 * 60_000,
  });

// ─── Site Settings (combined fetch) ────────────────────────────────
export const useAllSettings = () =>
  useQuery({
    queryKey: adminKeys.settings(),
    queryFn: async () => {
      const [mainRes, advRes] = await Promise.all([
        adminAPI.getAllSettings(),
        adminAPI.getAdvancedSettings(),
      ]);
      return { main: mainRes.data, advanced: advRes.data };
    },
    staleTime: 5 * 60_000,
  });
