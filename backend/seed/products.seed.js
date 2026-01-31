/* =====================================================
   ⚠️  TEMPORARY SEED FILE - DELETE AFTER PHASE 3  ⚠️
   =====================================================
   
   This seed file is TEMPORARY and must be removed once 
   admin product management is implemented.
   
   Purpose: Provide demo data for Phase 2-3 development only.
   
   TO DELETE: After implementing admin product CRUD operations.
   
   ===================================================== */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("../models/Product");

dotenv.config();

const products = [
  {
    name: "Classic Oxford Leather Shoes",
    slug: "classic-oxford-leather-shoes",
    description:
      "Timeless oxford shoes crafted from premium full-grain leather. Perfect for formal occasions and business wear. Features Goodyear welt construction for durability and comfort.",
    category: "oxford",
    price: 12999,
    images: [
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509",
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4",
    ],
    sizes: [
      { size: "7", stock: 15 },
      { size: "8", stock: 20 },
      { size: "9", stock: 25 },
      { size: "10", stock: 20 },
      { size: "11", stock: 10 },
    ],
    isActive: true,
  },
  {
    name: "Brown Chelsea Boots",
    slug: "brown-chelsea-boots",
    description:
      "Elegant brown leather Chelsea boots with elastic side panels. Versatile design works with both casual and smart-casual outfits. Premium suede leather upper with cushioned insole.",
    category: "boots",
    price: 15499,
    images: [
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f",
      "https://images.unsplash.com/photo-1586788680434-30d324b2d46f",
    ],
    sizes: [
      { size: "7", stock: 12 },
      { size: "8", stock: 18 },
      { size: "9", stock: 22 },
      { size: "10", stock: 18 },
      { size: "11", stock: 8 },
      { size: "12", stock: 5 },
    ],
    isActive: true,
  },
  {
    name: "Tan Leather Brogues",
    slug: "tan-leather-brogues",
    description:
      "Sophisticated tan brogues featuring intricate perforations and wingtip design. Hand-burnished leather finish adds character. Leather sole with rubber heel for traction.",
    category: "brogue",
    price: 11499,
    images: [
      "https://images.unsplash.com/photo-1478460326510-3a68b554f72f",
      "https://images.unsplash.com/photo-1581101767113-1677fc2beaa8",
    ],
    sizes: [
      { size: "7", stock: 10 },
      { size: "8", stock: 15 },
      { size: "9", stock: 20 },
      { size: "10", stock: 15 },
      { size: "11", stock: 12 },
    ],
    isActive: true,
  },
  {
    name: "Black Leather Loafers",
    slug: "black-leather-loafers",
    description:
      "Sleek black leather penny loafers with a modern slim profile. Slip-on design with padded collar for comfort. Perfect for smart-casual occasions and office wear.",
    category: "loafer",
    price: 9999,
    images: [
      "https://images.unsplash.com/photo-1582897085656-c636d006a246",
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509",
    ],
    sizes: [
      { size: "6", stock: 8 },
      { size: "7", stock: 18 },
      { size: "8", stock: 25 },
      { size: "9", stock: 25 },
      { size: "10", stock: 20 },
      { size: "11", stock: 10 },
    ],
    isActive: true,
  },
  {
    name: "Burgundy Derby Shoes",
    slug: "burgundy-derby-shoes",
    description:
      "Rich burgundy leather Derby shoes with open lacing system. Versatile style suitable for both formal and casual settings. Features cushioned footbed and durable rubber sole.",
    category: "derby",
    price: 13499,
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2",
    ],
    sizes: [
      { size: "7", stock: 14 },
      { size: "8", stock: 20 },
      { size: "9", stock: 18 },
      { size: "10", stock: 16 },
      { size: "11", stock: 9 },
      { size: "12", stock: 6 },
    ],
    isActive: true,
  },
];

async function seedProducts() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected\n");

    // Delete existing products to prevent duplicates
    console.log("🗑️  Clearing existing products...");
    const deleteResult = await Product.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} existing products\n`);

    // Insert new products
    console.log("📦 Inserting demo products...");
    const insertedProducts = await Product.insertMany(products);
    console.log(
      `✅ Successfully inserted ${insertedProducts.length} products:\n`
    );

    insertedProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      Slug: ${product.slug}`);
      console.log(`      Price: ₹${product.price.toLocaleString("en-IN")}`);
      console.log(`      Sizes: ${product.sizes.length} available\n`);
    });

    console.log("🎉 Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
    process.exit(0);
  }
}

seedProducts();
