#!/usr/bin/env node

/**
 * Quick Database Check Script
 * Run this on your VPS to verify products are being saved correctly
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const Product = require("../models/Product");

async function quickCheck() {
  try {
    console.log("🔍 Quick Database Check\n");
    console.log("=".repeat(60));

    // Show connection string (masked)
    const mongoUri = process.env.MONGO_URI || "NOT SET";
    console.log("📡 MongoDB URI:", mongoUri.replace(/:[^:@]+@/, ":****@"));

    // Connect
    console.log("\n⏳ Connecting...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected!\n");

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📂 Database: ${dbName}\n`);

    // Count products
    const totalCount = await Product.countDocuments();
    const activeCount = await Product.countDocuments({ isActive: true });
    const inactiveCount = await Product.countDocuments({ isActive: false });

    console.log("📊 Product Counts:");
    console.log(`   Total: ${totalCount}`);
    console.log(`   Active (isActive=true): ${activeCount}`);
    console.log(`   Inactive (isActive=false): ${inactiveCount}\n`);

    if (totalCount === 0) {
      console.log("❌ NO PRODUCTS FOUND!");
      console.log("\nPossible reasons:");
      console.log("1. Products were not saved due to validation error");
      console.log("2. Connected to wrong database");
      console.log("3. Products were deleted");
      console.log("\nSolution:");
      console.log("- Try creating a product again through admin panel");
      console.log("- Check backend logs for errors during product creation");
      console.log("- Verify MONGO_URI environment variable in Dokploy\n");
    } else {
      console.log("✅ Products exist!\n");

      // Show recent products
      console.log("📦 Recent Products:");
      const recentProducts = await Product.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name slug category price isActive featured createdAt");

      recentProducts.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   Slug: ${p.slug}`);
        console.log(`   Category: ${p.category}`);
        console.log(`   Price: ₹${p.price}`);
        console.log(`   Active: ${p.isActive ? "✅ Yes" : "❌ No"}`);
        console.log(`   Featured: ${p.featured ? "⭐ Yes" : "No"}`);
        console.log(`   Created: ${p.createdAt.toLocaleString()}`);
      });

      if (activeCount === 0 && totalCount > 0) {
        console.log("\n\n⚠️  WARNING: Products exist but ALL are INACTIVE!");
        console.log("Products won't show on frontend unless isActive=true");
        console.log("\nTo fix: Set products to active in admin panel\n");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Check complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\nFull error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  quickCheck();
}

module.exports = quickCheck;
