import axios from "axios";
import Cookies from "js-cookie";
import { getApiUrl } from "./getApiUrl";

// Client-side: "/api/v1" (proxied via Next.js rewrite → no CORS)
// Server-side: full backend URL for SSR/ISR
const API_URL = getApiUrl();

/* ═══════════════════════════════════════════════════════════
   Retry with exponential backoff
   Retries on network errors and 502/503/504 (server down).
   ═══════════════════════════════════════════════════════════ */
const RETRY_CONFIG = {
  maxRetries: 2,          // up to 2 retries (3 total attempts)
  baseDelay: 1000,        // 1s → 2s → 4s
  retryableStatuses: [502, 503, 504],
};

function isRetryable(error) {
  // Network error (CORS blocks, DNS fail, server unreachable)
  if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
    return true;
  }
  // Server error responses that indicate temporary outage
  if (error.response && RETRY_CONFIG.retryableStatuses.includes(error.response.status)) {
    return true;
  }
  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ═══════════════════════════════════════════════════════════
   Friendly error message for users
   ═══════════════════════════════════════════════════════════ */
export function getFriendlyError(error) {
  if (!error) return 'Something went wrong. Please try again.';

  // Server returned an error message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Network / CORS / Server down
  if (!error.response || error.code === 'ERR_NETWORK') {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  const status = error.response?.status;
  if (status === 502 || status === 503 || status === 504) {
    return 'Our servers are temporarily unavailable. Please try again in a moment.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait a moment before trying again.';
  }
  if (status === 403) {
    return 'Access denied. Please contact support if this persists.';
  }

  return error.message || 'Something went wrong. Please try again.';
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000, // 15s timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Initialize retry counter
    if (config._retryCount === undefined) {
      config._retryCount = 0;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: retry with backoff + token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── Retry on transient failures (502/503/504/network) ──
    if (isRetryable(error) && originalRequest._retryCount < RETRY_CONFIG.maxRetries) {
      originalRequest._retryCount += 1;
      const delay = RETRY_CONFIG.baseDelay * Math.pow(2, originalRequest._retryCount - 1);
      await sleep(delay);
      return api(originalRequest);
    }

    // ── Token refresh on 401 ──
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
          },
        );

        const { accessToken } = response.data;
        Cookies.set("accessToken", accessToken, { expires: 1 });

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");

        if (typeof window !== "undefined") {
          const isProtectedPageRoute = [
            "/checkout",
            "/orders",
            "/profile",
            "/admin",
          ].some((route) => window.location.pathname.startsWith(route));

          if (isProtectedPageRoute) {
            window.location.href = "/auth/login";
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// API endpoints
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getCurrentUser: () => api.get("/auth/me"),
  changePassword: (data) => api.post("/auth/change-password", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  firebaseLogin: (data) => api.post("/auth/firebase-login", data),
};

export const productAPI = {
  getAllProducts: (params) => api.get("/products", { params }),
  getBrands: () => api.get("/products/brands"),
  getMaterials: () => api.get("/products/materials"),
  getPriceRange: () => api.get("/products/price-range"),
  getColors: () => api.get("/products/colors"),
  getSizes: () => api.get("/products/sizes"),
};

export const settingsAPI = {
  getPublicSettings: () => api.get("/settings/public"),
};

export const adminAPI = {
  // ... other admin APIs ...

  // CMS Settings
  getAllSettings: () => api.get("/settings"), // GET /api/v1/settings (Singleton - Branding/Banners)
  getAdvancedSettings: () => api.get("/admin/settings"), // GET /api/v1/admin/settings (Key-Value List)
  updateSettings: (data) => api.put("/settings", data), // PUT /api/v1/settings
  getCmsPages: (params) => api.get('/admin/cms/pages', { params }),
  getCmsPage: (id) => api.get(`/admin/cms/pages/${id}`),
  createCmsPage: (data) => api.post('/admin/cms/pages', data),
  updateCmsPage: (id, data) => api.put(`/admin/cms/pages/${id}`, data),
  publishCmsPage: (id) => api.post(`/admin/cms/pages/${id}/publish`),
  deleteCmsPage: (id) => api.delete(`/admin/cms/pages/${id}`),
  getCmsMedia: (params) => api.get('/admin/cms/media', { params }),
  updateCmsMedia: (id, data) => api.put(`/admin/cms/media/${id}`, data),
  getCmsMenus: () => api.get('/admin/cms/menus'),
  createCmsMenu: (data) => api.post('/admin/cms/menus', data),

  // Filters
  getAllFilters: () => api.get('/admin/filters'),
  createFilter: (data) => api.post('/admin/filters', data),
  updateFilter: (id, data) => api.patch(`/admin/filters/${id}`, data),
  toggleFilterStatus: (id) => api.patch(`/admin/filters/${id}/toggle`),
  deleteFilter: (id) => api.delete(`/admin/filters/${id}`),

  // Products, Orders, etc. (keep existing)
  getAllProducts: (params) => api.get("/admin/products", { params }),
  getProductById: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post("/admin/products", data),
  updateProduct: (id, data) => api.patch(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  toggleProductStatus: (id) => api.patch(`/admin/products/${id}/toggle`),
  toggleProductFeatured: (id) =>
    api.patch(`/admin/products/${id}/toggle-featured`),
  updateProductStatus: (id, data) => api.patch(`/admin/products/${id}/status`, data),
  bulkDeleteProducts: (ids) => api.post("/admin/products/bulk-delete", { ids }),
  bulkUpdateProductStatus: (ids, isActive) => api.post("/admin/products/bulk-status", { ids, isActive }),
  getStockMovements: (productId, params) => api.get(`/admin/products/stock-movements/${productId}`, { params }),

  // Orders
  getAllOrders: (params) => api.get("/admin/orders", { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) =>
    api.patch(`/admin/orders/${id}`, { status }),

  // Bulk operations
  bulkUpdateStatus: (orderIds, status) =>
    api.post("/admin/orders/bulk/status", { orderIds, status }),
  bulkCreateShipments: (orderIds) =>
    api.post("/admin/orders/bulk/create-shipments", { orderIds }),
  bulkPrintLabels: (orderIds) =>
    api.post("/admin/orders/bulk/print-labels", { orderIds }),

  // Shiprocket
  getShippingRates: (data) => api.post("/admin/shiprocket/rates", data),
  createShipment: (orderId, data) =>
    api.post(`/admin/shiprocket/create-shipment/${orderId}`, data),
  trackShipment: (orderId) => api.get(`/admin/shiprocket/track/${orderId}`),
  generateInvoice: (orderId) =>
    api.post(`/admin/shiprocket/invoice/${orderId}`),
  getShiprocketHealth: () => api.get('/admin/shiprocket/health'),
  triggerShiprocketReconciliation: () => api.post('/admin/shiprocket/reconcile'),
  getPickupAddresses: () => api.get("/admin/shiprocket/pickup-addresses"),

  // Users
  getAllUsers: (params) => api.get("/admin/users", { params }),
  getUserHistory: (id) => api.get(`/admin/users/${id}/history`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleUserBlock: (id) => api.patch(`/admin/users/${id}/toggle-block`),
  createAdmin: (data) => api.post("/admin/users/create-admin", data),
  sendPasswordReset: (id) => api.post(`/admin/users/${id}/send-password-reset`),
  forceLogout: (id) => api.post(`/admin/users/${id}/force-logout`),
  getSecurityEvents: (params) => api.get("/admin/users/security-events", { params }),
  impersonateUser: (id) => api.post(`/admin/users/${id}/impersonate`),

  // Categories
  getAllCategories: () => api.get("/admin/categories"),
  createCategory: (data) => api.post("/admin/categories", data),
  updateCategory: (id, data) => api.patch(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  toggleCategoryStatus: (id) => api.patch(`/admin/categories/${id}/toggle`),

  // Coupons
  getAllCoupons: () => api.get("/admin/coupons"),
  createCoupon: (data) => api.post("/admin/coupons", data),
  updateCoupon: (id, data) => api.patch(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
  toggleCouponStatus: (id) => api.patch(`/admin/coupons/${id}/toggle`),
  getCouponStats: () => api.get("/admin/coupons/stats"),

  // Reviews
  getAllReviews: (params) => api.get("/admin/reviews", { params }),
  toggleReviewHidden: (id) => api.patch(`/admin/reviews/${id}/toggle-hidden`),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  bulkHideReviews: (data) => api.post("/admin/reviews/bulk-hide", data),
  bulkDeleteReviews: (data) => api.post("/admin/reviews/bulk-delete", data),
  replyToReview: (id, text) => api.patch(`/admin/reviews/${id}/reply`, { text }),
  deleteReviewReply: (id) => api.delete(`/admin/reviews/${id}/reply`),

  // Media
  getUploadUrl: (data) => api.post("/admin/media/upload-url", data),
  getOrphanedMedia: (params) => api.get("/admin/media/orphaned", { params }),
  deleteOrphanedMedia: (ids) => api.delete("/admin/media/orphaned/bulk", { data: { ids } }),

  // Stats
  getAdminStats: () => api.get("/admin/stats"),
  getDependenciesHealth: () => api.get("/admin/health/deps"),
  getAnalyticsSummary: (period) => api.get("/admin/analytics/summary", { params: { period } }),
  getAnalyticsFunnel: (period) => api.get("/admin/analytics/funnel", { params: { period } }),

  // Site Settings
  updateSetting: (key, value) => api.put(`/admin/settings/${key}`, { value }),

  // SEO
  getSeoSettings: () => api.get('/admin/seo'),
  updateSeoSettings: (seoSettings) => api.put('/admin/seo', { seoSettings }),
  autoGenerateSeo: (type) => api.post('/admin/seo/auto-generate', { type }),
  auditSeo: () => api.get('/admin/seo/audit'),

  // ── Mobile App Management ──────────────────────────
  // Dashboard
  getAppStats: () => api.get("/admin/app/stats"),
  getAppAnalytics: (period) => api.get("/admin/app/analytics", { params: { period } }),

  // Config
  getAppConfig: () => api.get("/app/config"),
  updateAppConfig: (data) => api.put("/admin/app/config", data),

  // Banners
  getAppBanners: () => api.get("/admin/app/banners"),
  createAppBanner: (data) => api.post("/admin/app/banners", data),
  updateAppBanner: (id, data) => api.patch(`/admin/app/banners/${id}`, data),
  deleteAppBanner: (id) => api.delete(`/admin/app/banners/${id}`),
  reorderAppBanners: (orderedIds) => api.patch("/admin/app/banners/reorder", { orderedIds }),

  // Push Notifications
  sendAppNotification: (data) => api.post("/admin/app/notifications/send", data),
  getNotificationHistory: (params) => api.get("/admin/app/notifications/history", { params }),
  getNotificationTargetCount: (params) => api.get("/admin/app/notifications/target-count", { params }),

  // Helpers
  searchAppUsers: (q) => api.get("/admin/app/users/search", { params: { q } }),
  getAppCities: () => api.get("/admin/app/cities"),
};

export const categoryAPI = {
  getAllCategories: () => api.get("/categories"),
  getNavbarCategories: () => api.get("/categories/navbar"),
};

export const addressAPI = {
  getAll: () => api.get("/user/addresses"),
  create: (data) => api.post("/user/addresses", data),
  update: (id, data) => api.patch(`/user/addresses/${id}`, data),
  delete: (id) => api.delete(`/user/addresses/${id}`),
};

export const couponAPI = {
  validate: (code) => api.post("/coupons/validate", { code }),
};

export const orderAPI = {
  create: (data) => api.post("/orders", data),
  getAll: (params) => api.get("/orders/my", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  createRazorpayOrder: (id) => api.post(`/orders/${id}/razorpay`),
  verifyRazorpayPayment: (id, data) =>
    api.post(`/orders/${id}/razorpay/verify`, data),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
};

export const contactAPI = {
  submit: (data) => api.post("/contact", data),
};

export const userAPI = {
  updateProfile: (data) => api.patch("/user/profile", data),
};

export const cartAPI = {
  get: () => api.get("/cart"),
  add: (data) => api.post("/cart", data),
  update: (data) => api.put("/cart/items", data),
  remove: (productId, size) =>
    api.delete(
      `/cart/${encodeURIComponent(productId)}/${encodeURIComponent(size)}`,
    ),
  clear: () => api.delete("/cart"),
};

export const wishlistAPI = {
  get: () => api.get("/wishlist"),
  add: (productId) => api.post("/wishlist/toggle", { productId }),
  remove: (productId) => api.post("/wishlist/toggle", { productId }),
};
