/**
 * JSDoc Type Definitions for all Mongoose models.
 * Provides IntelliSense and type checking in JS files when jsconfig.json has checkJs enabled.
 *
 * Usage in any JS file:
 *   /** @type {import('./types').IProduct} *\/
 *   const product = await Product.findById(id);
 */

import { Document, Types } from "mongoose";

// ─── Common ──────────────────────────────────────────────

export type ObjectId = Types.ObjectId;

// ─── Address ─────────────────────────────────────────────

export interface IAddress extends Document {
  user: ObjectId;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  verifiedDelivery: boolean;
  codAvailable: boolean;
  lastVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── AnalyticsEvent ──────────────────────────────────────

export type AnalyticsEventType =
  | "page_view"
  | "product_view"
  | "product_search"
  | "product_filter"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "purchase"
  | "sign_up"
  | "login"
  | "wishlist_add"
  | "wishlist_remove"
  | "review_submit"
  | "share"
  | "banner_click"
  | "newsletter_signup";

export interface IAnalyticsEvent extends Document {
  event: AnalyticsEventType;
  userId?: ObjectId;
  sessionId?: string;
  properties: Record<string, any>;
  page?: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  device: "desktop" | "mobile" | "tablet" | "unknown";
  createdAt: Date;
  updatedAt: Date;
}

// ─── Cart ────────────────────────────────────────────────

export interface ICartItem {
  product: ObjectId;
  size: string;
  quantity: number;
  color?: string;
}

export interface ICart extends Document {
  user: ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Category ────────────────────────────────────────────

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: { url?: string; publicId?: string };
  isActive: boolean;
  showInNavbar: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── ContactMessage ──────────────────────────────────────

export interface IContactMessage extends Document {
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "resolved";
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── ContentPage ─────────────────────────────────────────

export interface IContentBlock {
  type:
    | "hero" | "text" | "image" | "gallery" | "features" | "testimonials"
    | "cta" | "columns" | "accordion" | "table" | "row" | "column"
    | "container" | "heading" | "button" | "divider" | "spacer";
  position: number;
  config: Record<string, any>;
  visibility: "all" | "mobile" | "desktop";
}

export interface IContentPage extends Document {
  title: string;
  slug: string;
  path: string;
  blocks: IContentBlock[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  openGraphImage?: string;
  canonicalUrl?: string;
  noIndex: boolean;
  noFollow: boolean;
  template: "default" | "full-width" | "sidebar-left" | "sidebar-right";
  status: "draft" | "review" | "published" | "archived";
  visibility: "public" | "private" | "password";
  passwordHash?: string;
  publishAt?: Date;
  unpublishAt?: Date;
  category: "page" | "post" | "faq" | "policy" | "help" | "custom";
  tags: string[];
  parentPage?: ObjectId;
  order: number;
  version: number;
  publishedVersion?: number;
  lastPublishedAt?: Date;
  lastPublishedBy?: ObjectId;
  createdBy: ObjectId;
  updatedBy?: ObjectId;
  cacheKey?: string;
  lastRenderedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Coupon ──────────────────────────────────────────────

export interface ICoupon extends Document {
  code: string;
  type: "flat" | "percent";
  value: number;
  maxDiscount?: number;
  minOrder: number;
  expiry: Date;
  validFrom: Date;
  isActive: boolean;
  usageLimit?: number;
  perUserLimit?: number;
  usedCount: number;
  firstOrderOnly: boolean;
  applicableCategories: ObjectId[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Filter ──────────────────────────────────────────────

export interface IFilter extends Document {
  type: "category" | "priceRange" | "size" | "color" | "material";
  name: string;
  value: string;
  displayOrder: number;
  isActive: boolean;
  minPrice?: number;
  maxPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Media ───────────────────────────────────────────────

export interface IMedia extends Document {
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extension: string;
  bucket: string;
  key: string;
  storageUrl: string;
  cdnUrl: string;
  thumbnailUrl?: string;
  optimizedUrl?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  dominantColor?: string;
  type: "image" | "video" | "document" | "audio" | "other";
  category: "banner" | "gallery" | "product" | "avatar" | "background" | "icon" | "other";
  tags: string[];
  usageCount: number;
  usedIn: Array<{
    model: string;
    modelId: ObjectId;
    field: string;
    addedAt: Date;
  }>;
  uploadedBy: ObjectId;
  visibility: "public" | "private" | "protected";
  allowedRoles: string[];
  altText?: string;
  caption?: string;
  description?: string;
  credit?: string;
  processingStatus: "pending" | "processing" | "optimized" | "failed";
  optimizationLog: Array<{
    action: string;
    status: string;
    message: string;
    timestamp: Date;
  }>;
  isArchived: boolean;
  archivedAt?: Date;
  deleteAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Order ───────────────────────────────────────────────

export interface IOrderItem {
  product: ObjectId;
  name?: string;
  image?: string;
  size?: string;
  color?: string;
  quantity?: number;
  price?: number;
}

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type LifecycleStatus =
  | "ready_to_ship"
  | "shipment_created"
  | "pickup_scheduled"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed_delivery"
  | "rto_initiated"
  | "rto_delivered"
  | "cancelled";

export interface ITrackingEntry {
  status: string;
  timestamp: Date;
  location?: string;
  description?: string;
  scanType?: string;
}

export interface IOrder extends Document {
  orderId: string;
  displayOrderId?: string; // Human-readable: ORD-YYMMDD-#### (e.g. ORD-260220-1023)
  user: ObjectId;
  items: IOrderItem[];
  subtotal?: number;
  shippingCost: number;
  discount: number;
  total?: number;
  totalAmount?: number;
  coupon?: {
    code: string;
    type: string;
    value: number;
    discount: number;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  payment: {
    method: "cod" | "razorpay" | "stripe";
    status: "pending" | "paid" | "failed";
    transactionId?: string;
    razorpayOrderId?: string;
  };
  shipping: {
    trackingId?: string;
    courier?: string;
    shiprocket_order_id?: number;
    shipment_id?: number;
    awb_code?: string;
    courier_name?: string;
    courier_id?: number;
    label_url?: string;
    manifest_url?: string;
    pickup_scheduled_date?: string;
    estimated_delivery_date?: string;
    tracking_url?: string;
    current_status?: string;
    last_tracking_update?: Date;
    trackingHistory: ITrackingEntry[];
    lifecycle_status: LifecycleStatus;
    shipment_creation_attempted: boolean;
    shipment_created_at?: Date;
  };
  status: OrderStatus;
  fulfillmentType: string;
  estimatedDispatchDays: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Product ─────────────────────────────────────────────

export interface IProductImage {
  url: string;
  key: string;
  isPrimary: boolean;
  order: number;
  color?: string;
}

export interface IProductSize {
  size: string;
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  specifications: {
    material?: string;
    sole?: string;
    construction?: string;
    madeIn?: string;
  };
  careInstructions: string[];
  category: string;
  price: number;
  gstPercentage: number;
  averageDeliveryCost: number;
  comparePrice?: number;
  brand?: string;
  sku?: string;
  stock: number;
  sizes: IProductSize[];
  colors: string[];
  tags: string[];
  images: IProductImage[];
  images360: Array<{ url: string; key: string; order: number }>;
  hotspots360: Array<{
    id: string;
    frame: number;
    x: number;
    y: number;
    label: string;
  }>;
  isActive: boolean;
  isOutOfStock: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Review ──────────────────────────────────────────────

export interface IReview extends Document {
  user: ObjectId;
  product: ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images: Array<{ url: string; publicId?: string }>;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  status: "pending" | "approved" | "rejected";
  moderation_flag: boolean;
  isHidden: boolean;
  ai_tags?: {
    nsfw_score?: number;
    contains_prohibited_objects?: boolean;
    detected_objects?: string[];
    duplicate_hash?: string;
    is_duplicate?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ─── User ────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  firebaseUid?: string;
  authProvider: "local" | "phone" | "password" | "google" | "facebook";
  phone?: string;
  profilePicture?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: "customer" | "admin" | "designer" | "publisher";
  isBlocked: boolean;
  addresses: Array<{
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
  }>;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── WebhookLog ──────────────────────────────────────────

export interface IWebhookLog extends Document {
  eventId: string;
  eventType: string;
  shiprocketOrderId?: string;
  shipmentId?: string;
  awbCode?: string;
  orderId?: ObjectId;
  payload: Record<string, any>;
  status: "pending" | "processed" | "failed" | "duplicate";
  result?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  requestIP?: string;
  requestHeaders?: Record<string, any>;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Wishlist ────────────────────────────────────────────

export interface IWishlist extends Document {
  user: ObjectId;
  products: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Settings ────────────────────────────────────────────

export interface ISiteSetting extends Document {
  key: string;
  category: string;
  value: any;
  isPublic: boolean;
  version: number;
  updatedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISecurityEvent extends Document {
  eventType: string;
  actorUserId?: ObjectId;
  targetUserId?: ObjectId;
  reason?: string;
  ip?: string;
  userAgent?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshToken extends Document {
  tokenId: string;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdByIp?: string;
  createdAt: Date;
  updatedAt: Date;
}
