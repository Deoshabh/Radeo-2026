const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

/**
 * Script to make a user an admin
 * Usage: node utils/makeAdmin.js <email>
 */

async function makeAdmin(email) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    user.role = "admin";
    await user.save();

    console.log(`✅ User "${user.name}" (${user.email}) is now an admin`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: node utils/makeAdmin.js <email>");
  process.exit(1);
}

makeAdmin(email);
