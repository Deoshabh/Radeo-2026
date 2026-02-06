/**
 * Migration Script: Remove "staff" role
 * This script reassigns all users with role="staff" to role="customer"
 * Run this before deploying the User model schema change
 *
 * Usage: node migrate-staff-users.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ MongoDB connected");
  } catch (error) {
    console.error("✗ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const migrateStaffUsers = async () => {
  try {
    await connectDB();

    // Find all users with role="staff"
    const User = mongoose.model(
      "User",
      new mongoose.Schema(
        {
          name: String,
          email: String,
          role: String,
        },
        { strict: false },
      ),
    );

    const staffUsers = await User.find({ role: "staff" });

    if (staffUsers.length === 0) {
      console.log("✓ No staff users found. Migration not needed.");
      process.exit(0);
    }

    console.log(`Found ${staffUsers.length} staff user(s):`);
    staffUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.name})`);
    });

    // Update all staff users to customer role
    const result = await User.updateMany(
      { role: "staff" },
      { $set: { role: "customer" } },
    );

    console.log(
      `\n✓ Successfully migrated ${result.modifiedCount} staff user(s) to customer role`,
    );

    // Verify the migration
    const remainingStaff = await User.countDocuments({ role: "staff" });
    if (remainingStaff === 0) {
      console.log("✓ Migration verified: No staff users remaining");
    } else {
      console.warn(`⚠ Warning: ${remainingStaff} staff user(s) still exist`);
    }

    process.exit(0);
  } catch (error) {
    console.error("✗ Migration error:", error.message);
    process.exit(1);
  }
};

// Run migration
migrateStaffUsers();
