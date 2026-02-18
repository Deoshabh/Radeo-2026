/**
 * Migration Script: Convert Product.category from String to ObjectId
 * Matches each product's category string (slug/name) to a Category document,
 * then stores the Category ObjectId.
 *
 * Usage: node scripts/migrate-product-categories.js [--dry-run]
 *
 * Run with --dry-run first to preview changes without writing.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const DRY_RUN = process.argv.includes("--dry-run");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};

async function migrate() {
  await connectDB();

  const Category = require("../models/Category");
  const db = mongoose.connection.db;
  const productsCol = db.collection("products");

  // Build lookup map: slug → _id, name (lowercase) → _id
  const categories = await Category.find({});
  const slugMap = new Map();
  const nameMap = new Map();
  for (const cat of categories) {
    slugMap.set(cat.slug, cat._id);
    nameMap.set(cat.name.toLowerCase(), cat._id);
  }
  console.log(`Found ${categories.length} categories`);

  // Find all products where category is still a string (not ObjectId)
  const products = await productsCol
    .find({ category: { $type: "string" } })
    .project({ _id: 1, name: 1, category: 1 })
    .toArray();

  console.log(`Found ${products.length} products with string category`);

  let matched = 0;
  let unmatched = 0;
  const unmatchedList = [];

  for (const product of products) {
    const catStr = (product.category || "").trim().toLowerCase();
    const catId = slugMap.get(catStr) || nameMap.get(catStr);

    if (!catId) {
      unmatched++;
      unmatchedList.push({
        productId: product._id,
        name: product.name,
        category: product.category,
      });
      continue;
    }

    if (!DRY_RUN) {
      await productsCol.updateOne(
        { _id: product._id },
        { $set: { category: catId } }
      );
    }
    matched++;
  }

  console.log(`\n--- Results ${DRY_RUN ? "(DRY RUN)" : ""} ---`);
  console.log(`Matched & updated: ${matched}`);
  console.log(`Unmatched: ${unmatched}`);

  if (unmatchedList.length > 0) {
    console.log("\nUnmatched products:");
    for (const p of unmatchedList) {
      console.log(`  - ${p.name} (category: "${p.category}")`);
    }
    console.log(
      "\nCreate missing categories or manually fix these products."
    );
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
