require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Order = require("../models/Order");

async function checkOrderData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get one recent order
    const order = await Order.findOne()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    if (!order) {
      console.log("No orders found");
      process.exit(0);
    }

    console.log("\n=== ORDER DATA STRUCTURE ===");
    console.log("Order ID:", order.orderId);
    console.log("\n--- Shipping Address ---");
    console.log("Full object:", JSON.stringify(order.shippingAddress, null, 2));
    console.log("\n--- User Info ---");
    console.log("User:", JSON.stringify(order.user, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkOrderData();
