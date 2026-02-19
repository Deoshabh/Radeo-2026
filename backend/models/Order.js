const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    size: String,
    color: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // snapshot price in INR
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema],

    subtotal: Number,
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    coupon: {
      code: String,
      type: String,
      value: Number,
      discount: Number,
    },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            // Accept 10-digit numbers (without country code)
            return /^[0-9]{10}$/.test(v);
          },
          message: (props) =>
            `${props.value} is not a valid 10-digit Indian phone number!`,
        },
      },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "India" },
    },

    payment: {
      method: {
        type: String,
        enum: ["cod", "razorpay", "stripe"],
        default: "cod",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      razorpayOrderId: String,
      refundId: String,
    },

    shipping: {
      trackingId: String,
      courier: String,
      // Shiprocket fields
      shiprocket_order_id: Number,
      shipment_id: Number,
      awb_code: String,
      courier_name: String,
      courier_id: Number,
      label_url: String,
      manifest_url: String,
      pickup_scheduled_date: String,
      estimated_delivery_date: String,
      tracking_url: String,
      current_status: String,
      last_tracking_update: Date,
      // Tracking history timeline
      trackingHistory: [
        {
          status: String,
          timestamp: Date,
          location: String,
          description: String,
          scanType: String,
        },
      ],
      // Shiprocket lifecycle status
      lifecycle_status: {
        type: String,
        enum: [
          "ready_to_ship",
          "shipment_created",
          "pickup_scheduled",
          "picked_up",
          "in_transit",
          "out_for_delivery",
          "delivered",
          "failed_delivery",
          "rto_initiated",
          "rto_delivered",
          "cancelled",
        ],
        default: "ready_to_ship",
      },
      // Duplicate prevention
      shipment_creation_attempted: { type: Boolean, default: false },
      shipment_created_at: Date,
    },

    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "confirmed",
    },

    cancellation: {
      reason: String,
      cancelledAt: Date,
      cancelledBy: {
        type: String,
        enum: ["customer", "admin", "system"],
      },
    },

    fulfillmentType: {
      type: String,
      default: "made_to_order",
    },

    estimatedDispatchDays: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Backward-compat virtual: .total → .totalAmount
orderSchema.virtual("total").get(function () {
  return this.totalAmount;
});

// Virtual: item count
orderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Indexes for common query patterns
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ createdAt: -1 });

// Note: orderId is now generated in the controller
// This hook is kept for backward compatibility in case orderId is not provided
orderSchema.pre("save", async function () {
  if (!this.orderId) {
    // Generate order ID: ORD-YYYYMMDD-XXXXX (e.g., ORD-20251217-00123)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    // Find the last order created today
    const lastOrder = await this.constructor
      .findOne({
        orderId: new RegExp(`^ORD-${dateStr}-`),
      })
      .sort({ orderId: -1 });

    let sequence = 1;
    if (lastOrder && lastOrder.orderId) {
      const lastSequence = parseInt(lastOrder.orderId.split("-")[2]);
      sequence = lastSequence + 1;
    }

    this.orderId = `ORD-${dateStr}-${String(sequence).padStart(5, "0")}`;
  }
});

module.exports = mongoose.model("Order", orderSchema);
