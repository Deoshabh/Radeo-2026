const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    passwordHash: {
      type: String,
      required: false, // Optional for Firebase users
      select: false, // Never return password hash in queries by default
    },

    // Firebase Authentication fields
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
    },

    authProvider: {
      type: String,
      enum: ["local", "phone", "password", "google", "facebook"],
      default: "local",
    },

    phone: {
      type: String,
      sparse: true, // Allows null values while maintaining uniqueness
    },

    profilePicture: {
      type: String,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["customer", "admin", "designer", "publisher"],
      default: "customer",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    addresses: [
      {
        fullName: String,
        phone: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        postalCode: String,
        country: { type: String, default: "India" },
        isDefault: { type: Boolean, default: false },
      },
    ],

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // ─── App-specific fields (React Native) ────────────────
    expoPushToken: { type: String, default: "" },
    fcmToken: { type: String, default: "" },
    pushTokenPlatform: { type: String, enum: ["ios", "android", ""], default: "" },

    recentlyViewed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    sizePreference: { type: String, default: "" },

    notificationPreferences: {
      orders: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newArrivals: { type: Boolean, default: true },
      priceDrops: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });

module.exports = mongoose.model("User", userSchema);
