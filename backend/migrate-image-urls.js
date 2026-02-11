/**
 * Migration Script: Update image URLs from api.minio.radeo.in → minio.radeo.in
 *
 * Run on VPS: node migrate-image-urls.js
 * Requires MONGO_URI env var (reads from .env automatically)
 */
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");

const OLD_DOMAIN = "api.minio.radeo.in";
const NEW_DOMAIN = "minio.radeo.in";

async function migrate() {
  console.log("🔄 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected\n");

  const db = mongoose.connection.db;

  // 1. Products — images[].url
  console.log("📦 Migrating Product image URLs...");
  const products = db.collection("products");
  const productDocs = await products
    .find({ "images.url": { $regex: OLD_DOMAIN } })
    .toArray();
  let productCount = 0;
  for (const doc of productDocs) {
    const updatedImages = doc.images.map((img) => ({
      ...img,
      url: img.url.replace(OLD_DOMAIN, NEW_DOMAIN),
    }));
    await products.updateOne(
      { _id: doc._id },
      { $set: { images: updatedImages } },
    );
    productCount++;
  }
  console.log(`   ✅ Updated ${productCount} products\n`);

  // 2. Categories — image.url
  console.log("📁 Migrating Category image URLs...");
  const categories = db.collection("categories");
  const catResult = await categories.updateMany(
    { "image.url": { $regex: OLD_DOMAIN } },
    [
      {
        $set: {
          "image.url": {
            $replaceAll: {
              input: "$image.url",
              find: OLD_DOMAIN,
              replacement: NEW_DOMAIN,
            },
          },
        },
      },
    ],
  );
  console.log(`   ✅ Updated ${catResult.modifiedCount} categories\n`);

  // 3. SiteSettings — branding.logo.url, branding.favicon.url, banners[].imageUrl
  console.log("⚙️  Migrating SiteSettings image URLs...");
  const settings = db.collection("sitesettings");
  const settingsDocs = await settings
    .find({
      $or: [
        { "branding.logo.url": { $regex: OLD_DOMAIN } },
        { "branding.favicon.url": { $regex: OLD_DOMAIN } },
        { "banners.imageUrl": { $regex: OLD_DOMAIN } },
      ],
    })
    .toArray();
  let settingsCount = 0;
  for (const doc of settingsDocs) {
    const update = {};
    if (doc.branding?.logo?.url?.includes(OLD_DOMAIN)) {
      update["branding.logo.url"] = doc.branding.logo.url.replace(
        OLD_DOMAIN,
        NEW_DOMAIN,
      );
    }
    if (doc.branding?.favicon?.url?.includes(OLD_DOMAIN)) {
      update["branding.favicon.url"] = doc.branding.favicon.url.replace(
        OLD_DOMAIN,
        NEW_DOMAIN,
      );
    }
    if (doc.banners?.length) {
      update.banners = doc.banners.map((b) => ({
        ...b,
        imageUrl: b.imageUrl
          ? b.imageUrl.replace(OLD_DOMAIN, NEW_DOMAIN)
          : b.imageUrl,
      }));
    }
    if (Object.keys(update).length > 0) {
      await settings.updateOne({ _id: doc._id }, { $set: update });
      settingsCount++;
    }
  }
  console.log(`   ✅ Updated ${settingsCount} site settings docs\n`);

  console.log("🎉 Migration complete!");
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
