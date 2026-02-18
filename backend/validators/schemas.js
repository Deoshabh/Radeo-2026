const { z } = require("zod");

/**
 * ========================================
 * Authentication Validation Schemas
 * ========================================
 */

// Register schema
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    phone: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone must be 10 digits")
      .optional(),
  }),
});

// Login schema
const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

// Refresh token schema
const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

/**
 * ========================================
 * Product Validation Schemas
 * ========================================
 */

// Create product schema
const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Product name must be at least 3 characters"),
    slug: z.string().min(3, "Slug must be at least 3 characters").optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    price: z.number().min(0, "Price must be positive"),
    compareAtPrice: z.number().min(0).optional(),
    costPerItem: z.number().min(0).optional(),
    category: z.string().min(1, "Category is required"),
    brand: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    trackQuantity: z.boolean().optional(),
    quantity: z.number().int().min(0).optional(),
    images: z.array(z.string().url()).min(1, "At least one image is required"),
    colors: z
      .array(
        z.object({
          name: z.string(),
          hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        }),
      )
      .optional(),
    sizes: z.array(z.string()).optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

// Update product schema (all fields optional except id in params)
const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    slug: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z.number().min(0).optional(),
    compareAtPrice: z.number().min(0).optional(),
    costPerItem: z.number().min(0).optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    trackQuantity: z.boolean().optional(),
    quantity: z.number().int().min(0).optional(),
    images: z.array(z.string().url()).optional(),
    colors: z
      .array(
        z.object({
          name: z.string(),
          hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        }),
      )
      .optional(),
    sizes: z.array(z.string()).optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

// Get product by ID schema
const productIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
  }),
});

/**
 * ========================================
 * Cart Validation Schemas
 * ========================================
 */

// Add to cart schema
const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    size: z.string().optional(),
    color: z.string().optional(),
  }),
});

// Update cart item schema
const updateCartItemSchema = z.object({
  params: z.object({
    itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid item ID"),
  }),
  body: z.object({
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
  }),
});

/**
 * ========================================
 * Order Validation Schemas
 * ========================================
 */

// Create order schema
const createOrderSchema = z.object({
  body: z.object({
    shippingAddressId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid address ID"),
    billingAddressId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid address ID")
      .optional(),
    paymentMethod: z.enum(["cod", "razorpay", "card"], {
      errorMap: () => ({ message: "Invalid payment method" }),
    }),
    couponCode: z.string().optional(),
  }),
});

// Update order status schema
const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID"),
  }),
  body: z.object({
    status: z.enum(
      ["pending", "processing", "shipped", "delivered", "cancelled"],
      {
        errorMap: () => ({ message: "Invalid order status" }),
      },
    ),
    trackingNumber: z.string().optional(),
  }),
});

/**
 * ========================================
 * Address Validation Schemas
 * ========================================
 */

// Create/Update address schema
const addressSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
    addressLine1: z.string().min(5, "Address must be at least 5 characters"),
    addressLine2: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be 6 digits"),
    country: z.string().default("India"),
    isDefault: z.boolean().optional(),
  }),
});

const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid address ID"),
  }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: z
      .string()
      .regex(/^[0-9]{10}$/)
      .optional(),
    addressLine1: z.string().min(5).optional(),
    addressLine2: z.string().optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    pincode: z
      .string()
      .regex(/^[0-9]{6}$/)
      .optional(),
    country: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
});

/**
 * ========================================
 * Category Validation Schemas
 * ========================================
 */

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Category name must be at least 2 characters"),
    slug: z.string().min(2).optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID"),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * ========================================
 * Coupon Validation Schemas
 * ========================================
 */

const createCouponSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(3, "Coupon code must be at least 3 characters")
      .max(20)
      .toUpperCase(),
    type: z.enum(["percentage", "fixed"], {
      errorMap: () => ({ message: "Type must be percentage or fixed" }),
    }),
    value: z.number().min(0, "Value must be positive"),
    minOrderValue: z.number().min(0).optional(),
    maxDiscount: z.number().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * ========================================
 * User Profile Validation Schemas
 * ========================================
 */

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone must be 10 digits")
      .optional(),
    avatar: z.string().url().optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),
});

/**
 * ========================================
 * Common ID Schema
 * ========================================
 */

const mongoIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID"),
  }),
});

module.exports = {
  // Auth
  registerSchema,
  loginSchema,
  refreshTokenSchema,

  // Products
  createProductSchema,
  updateProductSchema,
  productIdSchema,

  // Cart
  addToCartSchema,
  updateCartItemSchema,

  // Orders
  createOrderSchema,
  updateOrderStatusSchema,

  // Addresses
  addressSchema,
  updateAddressSchema,

  // Categories
  createCategorySchema,
  updateCategorySchema,

  // Coupons
  createCouponSchema,

  // User Profile
  updateProfileSchema,
  changePasswordSchema,

  // Common
  mongoIdSchema,

  // Settings
  updateSettingsSchema: z.object({
    body: z.object({
      branding: z.object({
        logo: z.object({ url: z.string().url().optional(), alt: z.string().max(200).optional() }).optional(),
        favicon: z.object({ url: z.string().url().optional() }).optional(),
        siteName: z.string().max(100).optional(),
      }).optional(),
      banners: z.array(z.object({
        image: z.string().optional(),
        title: z.string().max(200).optional(),
        subtitle: z.string().max(500).optional(),
        link: z.string().max(500).optional(),
        isActive: z.boolean().optional(),
      })).max(20).optional(),
      announcementBar: z.object({
        enabled: z.boolean().optional(),
        text: z.string().max(500).optional(),
        link: z.string().max(500).optional(),
        backgroundColor: z.string().max(20).optional(),
        textColor: z.string().max(20).optional(),
      }).optional(),
      homePage: z.any().optional(),
      homeSections: z.any().optional(),
      layout: z.array(z.any()).optional(),
      layoutSchemaVersion: z.number().int().min(1).optional(),
      theme: z.record(z.any()).optional(),
      publishWorkflow: z.object({
        status: z.enum(['draft', 'scheduled', 'live']).optional(),
        scheduledAt: z.string().datetime().optional().nullable(),
      }).optional(),
      versionLabel: z.string().max(100).optional(),
    }).strict(),
  }),
};
