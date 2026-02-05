const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Accept 10-digit numbers (without country code)
          return /^[0-9]{10}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid 10-digit Indian phone number!`,
      },
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Indian PIN codes are 6 digits
          return /^[0-9]{6}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid 6-digit PIN code!`,
      },
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    // Serviceability flags (Amazon/Flipkart style)
    verifiedDelivery: {
      type: Boolean,
      default: false,
    },
    codAvailable: {
      type: Boolean,
      default: false,
    },
    lastVerified: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Ensure only one default address per user
addressSchema.pre("save", async function () {
  if (this.isDefault && this.isModified("isDefault")) {
    await mongoose
      .model("Address")
      .updateMany(
        { user: this.user, _id: { $ne: this._id } },
        { isDefault: false },
      );
  }
});

module.exports = mongoose.model("Address", addressSchema);
