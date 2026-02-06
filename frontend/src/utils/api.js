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
  searchProducts: (query) =>
    api.get("/products/search", { params: { q: query } }),
};

export const categoryAPI = {
  getAllCategories: () => api.get("/categories"),
  getNavbarCategories: () => api.get("/categories/navbar"),
  getCategoryBySlug: (slug) => api.get(`/categories/${slug}`),
};

export const cartAPI = {
  getCart: () => api.get("/cart"),
  addToCart: (data) => api.post("/cart", data),
  removeFromCart: (productId, size) => api.delete(`/cart/${productId}/${size}`),
  clearCart: () => api.delete("/cart"),
};

export const wishlistAPI = {
  getWishlist: () => api.get("/wishlist"),
  toggleWishlist: (productId) => api.post("/wishlist/toggle", { productId }),
  // Deprecated but kept for backward compatibility
  addToWishlist: (productId) => api.post("/wishlist/toggle", { productId }),
  removeFromWishlist: (productId) =>
    api.post("/wishlist/toggle", { productId }),
  clearWishlist: () => api.delete("/wishlist"),
};

export const orderAPI = {
  createOrder: (data) => api.post("/orders", data),
  getMyOrders: () => api.get("/orders/my"),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),
  createRazorpayOrder: (orderId) => api.post(`/orders/${orderId}/razorpay`),
  verifyRazorpayPayment: (orderId, data) =>
    api.post(`/orders/${orderId}/razorpay/verify`, data),
};

export const addressAPI = {
  getAddresses: () => api.get("/addresses"),
  addAddress: (data) => api.post("/addresses", data),
  updateAddress: (id, data) => api.patch(`/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/addresses/${id}/default`),
};

export const userAPI = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data) => api.patch("/user/profile", data),
};

export const couponAPI = {
  validateCoupon: (code) => api.post("/coupons/validate", { code }),
};

export const filterAPI = {
  getFilters: () => api.get("/filters"),
};

export const adminAPI = {
  // Products
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
  getUserContact: (id) => api.get(`/admin/users/${id}/contact`),
  getUserHistory: (id, page = 1, limit = 10) =>
    api.get(`/admin/users/${id}/history`, { params: { page, limit } }),
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

  // Filters - Removed manual filter management (filters now auto-generated from products)
  // Brand filters: auto-populated from product.brand field
  // Material filters: auto-extracted from product.materialAndCare field
  // Price range: dynamically calculated from product prices

  // Media
  getUploadUrl: (data) => api.post("/admin/media/upload-url", data),
  deleteMedia: (key) => api.delete("/admin/media", { data: { key } }),

  // Stats
  getAdminStats: () => api.get("/admin/stats"),
  getStats: () => api.get("/admin/stats"), // Alias for backward compatibility
};
