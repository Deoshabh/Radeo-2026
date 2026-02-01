// ===============================
// Diagnostic Script for Product Fetching Issues
// ===============================
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

async function diagnose() {
  try {
    console.log("🔍 Starting Product Diagnosis...\n");

    // 1. Check MongoDB connection
    console.log("1️⃣ Connecting to MongoDB...");
    console.log(
      "   MongoDB URI:",
      process.env.MONGO_URI?.replace(/:[^:@]+@/, ":****@"),
    );
    await mongoose.connect(process.env.MONGO_URI);
    console.log("   ✅ MongoDB connected\n");

    // 2. Count all products
    console.log("2️⃣ Counting products...");
    const totalCount = await Product.countDocuments();
    console.log(`   Total products in database: ${totalCount}\n`);

    // 3. Count active products
    const activeCount = await Product.countDocuments({ isActive: true });
    console.log(`   Active products: ${activeCount}`);
    const inactiveCount = await Product.countDocuments({ isActive: false });
    console.log(`   Inactive products: ${inactiveCount}\n`);

    // 4. Fetch all products (like the API does)
    console.log("3️⃣ Fetching products (as API would)...");
    const products = await Product.find({ isActive: true }).sort({
      createdAt: -1,
    });
    console.log(`   Found ${products.length} active products:\n`);

    if (products.length === 0) {
      console.log("   ⚠️  NO ACTIVE PRODUCTS FOUND!");
      console.log("   This is why products aren't showing on the frontend.\n");

      // Check if there are any products at all
      const allProducts = await Product.find();
      if (allProducts.length > 0) {
        console.log("   However, found inactive products:");
        allProducts.forEach((p, i) => {
          console.log(
            `   ${i + 1}. ${p.name} - Active: ${p.isActive}, ID: ${p._id}`,
          );
        });
      } else {
        console.log("   ⚠️  NO PRODUCTS EXIST IN DATABASE AT ALL!");
      }
    } else {
      // Display products
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      Slug: ${product.slug}`);
        console.log(`      Category: ${product.category}`);
        console.log(`      Price: ₹${product.price}`);
        console.log(`      Active: ${product.isActive}`);
        console.log(`      Featured: ${product.featured}`);
        console.log(`      Images: ${product.images?.length || 0}`);
        if (product.images && product.images.length > 0) {
          product.images.forEach((img, i) => {
            console.log(`         Image ${i + 1}: ${img.url}`);
          });
        }
        console.log(`      Created: ${product.createdAt}`);
        console.log();
      });
    }

    // 5. Check MinIO configuration
    console.log("4️⃣ Checking MinIO Configuration...");
    console.log(`   MINIO_ENDPOINT: ${process.env.MINIO_ENDPOINT}`);
    console.log(`   MINIO_PORT: ${process.env.MINIO_PORT}`);
    console.log(`   MINIO_USE_SSL: ${process.env.MINIO_USE_SSL}`);
    console.log(`   MINIO_BUCKET: ${process.env.MINIO_BUCKET}`);
    console.log(
      `   Expected image URL format: https://${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/...`,
    );
    console.log();

    // 6. Recommendations
    console.log("5️⃣ Recommendations:");
    if (products.length === 0) {
      console.log("   ❌ No active products found");
      console.log("   → Add products through admin panel");
      console.log("   → OR activate existing products");
    } else {
      console.log("   ✅ Products exist and should be fetchable");
      console.log("   → Check frontend NEXT_PUBLIC_API_URL configuration");
      console.log("   → Check CORS settings in server.js");
      console.log("   → Check browser console for API errors");
    }

    console.log("\n✅ Diagnosis complete!");
  } catch (error) {
    console.error("❌ Diagnosis failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

diagnose();
