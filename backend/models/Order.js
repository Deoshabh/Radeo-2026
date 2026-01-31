const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: String,
    image: String,
    size: String,
    quantity: Number,
    price: Number, // snapshot price (₹ in cents)
  },
  { _id: false }
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
    discount: { type: Number, default: 0 },
    total: Number,

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
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      transactionId: String,
      razorpayOrderId: String,
    },

    shipping: {
      trackingId: String,
      courier: String,
    },

    status: {
      type: String,
      enum: ["confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "confirmed",
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
  { timestamps: true }
);

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
