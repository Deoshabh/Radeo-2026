import axios from "axios";
import Cookies from "js-cookie";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Backend sends refreshToken in httpOnly cookie, so we don't need to send it
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            withCredentials: true, // Important: send cookies
          },
        );

        const { accessToken } = response.data;
        Cookies.set("accessToken", accessToken, { expires: 1 }); // 1 day

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");

        // Only redirect to login if:
        // 1. User is on a protected page route
        // 2. OR the original request was to a protected API endpoint that requires auth
        if (typeof window !== "undefined") {
          const isProtectedPageRoute = [
            "/checkout",
            "/orders",
            "/profile",
            "/admin",
          ].some((route) => window.location.pathname.startsWith(route));

          // Don't redirect from /cart - let the page handle showing login prompt
          // Don't redirect from product pages - users should be able to browse

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
  getProductBySlug: (slug) => api.get(`/products/${slug}`),
  getCategories: () => api.get("/products/categories"),
  getBrands: () => api.get("/products/brands"),
  getMaterials: () => api.get("/products/materials"),
  getPriceRange: () => api.get("/products/price-range"),
  getColors: () => api.get("/products/colors"),
  getSizes: () => api.get("/products/sizes"),
  getTopRatedProducts: (params) => api.get("/products/top-rated", { params }),
  searchProducts: (query) =>
    api.get("/products/search", { params: { q: query } }),
};

export const settingsAPI = {
  getPublicSettings: () => api.get("/settings/public"),
};

export const adminAPI = {
  // ... other admin APIs ...

  // CMS Settings
  getAllSettings: () => api.get("/settings"), // GET /api/v1/settings (Admin protected)
  updateSettings: (data) => api.put("/settings", data), // PUT /api/v1/settings (Admin protected)

  // Products, Orders, etc. (keep existing)
  getAllProducts: (params) => api.get("/admin/products", { params }),
  getProductById: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post("/admin/products", data),
  updateProduct: (id, data) => api.patch(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  toggleProductStatus: (id) => api.patch(`/admin/products/${id}/toggle`),
  toggleProductFeatured: (id) =>
    api.patch(`/admin/products/${id}/toggle-featured`),

  // Orders
  getAllOrders: (params) => api.get("/admin/orders", { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) =>
    api.patch(`/admin/orders/${id}`, { status }),
  updateShippingAddress: (id, data) =>
    api.put(`/admin/orders/${id}/shipping-address`, data),

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
  generateLabel: (orderId) => api.post(`/admin/shiprocket/label/${orderId}`),
  trackShipment: (orderId) => api.get(`/admin/shiprocket/track/${orderId}`),
  cancelShipment: (orderId) => api.post(`/admin/shiprocket/cancel/${orderId}`),
  schedulePickup: (orderId, data) =>
    api.post(`/admin/shiprocket/schedule-pickup/${orderId}`, data),
  generateManifest: (orderId) =>
    api.post(`/admin/shiprocket/manifest/${orderId}`),
  markAsShipped: (orderId) =>
    api.post(`/admin/shiprocket/mark-shipped/${orderId}`),
  getPickupAddresses: () => api.get("/admin/shiprocket/pickup-addresses"),

  // Users
  getAllUsers: (params) => api.get("/admin/users", { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  getUserHistory: (id) => api.get(`/admin/users/${id}/history`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleUserBlock: (id) => api.patch(`/admin/users/${id}/toggle-block`),
  createAdmin: (data) => api.post("/admin/users/create-admin", data),

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

  // Reviews
  getAllReviews: (params) => api.get("/admin/reviews", { params }),
  getReviewById: (id) => api.get(`/admin/reviews/${id}`),
  getReviewStats: () => api.get("/admin/reviews/stats"),
  toggleReviewHidden: (id) => api.patch(`/admin/reviews/${id}/toggle-hidden`),
  updateReviewNotes: (id, data) =>
    api.patch(`/admin/reviews/${id}/notes`, data),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  bulkHideReviews: (data) => api.post("/admin/reviews/bulk-hide", data),
  bulkDeleteReviews: (data) => api.post("/admin/reviews/bulk-delete", data),

  // Media
  getUploadUrl: (data) => api.post("/admin/media/upload-url", data),
  deleteMedia: (key) => api.delete("/admin/media", { data: { key } }),

  // Stats
  getAdminStats: () => api.get("/admin/stats"),
  getStats: () => api.get("/admin/stats"),
};

export const categoryAPI = {
  getAllCategories: () => api.get("/products/categories"),
  getNavbarCategories: () => api.get("/products/categories"),
  getCategoryBySlug: (slug) => api.get(`/products/categories/${slug}`),
};

export const addressAPI = {
  getAll: () => api.get("/user/addresses"),
  getAddresses: () => api.get("/user/addresses"),
  getById: (id) => api.get(`/user/addresses/${id}`),
  create: (data) => api.post("/user/addresses", data),
  update: (id, data) => api.put(`/user/addresses/${id}`, data),
  delete: (id) => api.delete(`/user/addresses/${id}`),
  setDefault: (id) => api.put(`/user/addresses/${id}/default`),
};

export const couponAPI = {
  validate: (code) => api.post("/coupons/validate", { code }),
  getAll: () => api.get("/coupons"), // Public coupons if any
};

export const orderAPI = {
  create: (data) => api.post("/orders", data),
  getAll: (params) => api.get("/orders", { params }),
  getMyOrders: (params) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  verifyPayment: (data) => api.post("/orders/verify-payment", data),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
};

export const contactAPI = {
  submit: (data) => api.post("/contact", data),
};

export const userAPI = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data) => api.put("/user/profile", data),
  changePassword: (data) => api.put("/user/change-password", data),
  uploadAvatar: (formData) =>
    api.post("/user/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const cartAPI = {
  get: () => api.get("/cart"),
  getCart: () => api.get("/cart"),
  add: (data) => api.post("/cart", data),
  update: (itemId, data) => api.put(`/cart/${itemId}`, data),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete("/cart"),
  sync: (cartItems) => api.post("/cart/sync", { cartItems }), // For syncing local cart after login
};

export const wishlistAPI = {
  getWishlist: () => api.get("/wishlist"),
  get: () => api.get("/wishlist"),
  add: (productId) => api.post("/wishlist", { productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  check: (productId) => api.get(`/wishlist/check/${productId}`),
};
