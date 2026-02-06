/**
 * Migration Script: Remove "staff" role
 * Reassigns all users with role="staff" to role="customer"
 *
 * Usage: node migrate-staff-users.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};

const migrateStaffUsers = async () => {
  try {
    await connectDB();

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
      console.log("No staff users found. Migration not needed.");
      process.exit(0);
    }

    console.log(`Found ${staffUsers.length} staff user(s):`);
    staffUsers.forEach((user) => {
      console.log(`- ${user.email} (${user.name})`);
    });

    const result = await User.updateMany(
      { role: "staff" },
      { $set: { role: "customer" } },
    );

    console.log(
      `Successfully migrated ${result.modifiedCount} staff user(s) to customer role`,
    );

    const remainingStaff = await User.countDocuments({ role: "staff" });
    if (remainingStaff === 0) {
      console.log("Migration verified: no staff users remaining.");
    } else {
      console.warn(`Warning: ${remainingStaff} staff user(s) still exist.`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error.message);
    process.exit(1);
  }
};

migrateStaffUsers();
