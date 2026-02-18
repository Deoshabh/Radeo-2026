/**
 * Migration: Consolidate duplicate address storage.
 *
 * Copies addresses embedded in User.addresses[] into standalone Address
 * documents, then unsets the embedded array. Existing Address documents
 * are left unchanged (idempotent — skips users that have no embedded
 * addresses).
 *
 * Usage:
 *   NODE_ENV=production node scripts/migrateAddresses.js
 *
 * Requires MONGODB_URI in env or .env
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Address = require('../models/Address');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const users = await User.find({ 'addresses.0': { $exists: true } }).lean();
  console.log(`Found ${users.length} user(s) with embedded addresses`);

  let created = 0;

  for (const user of users) {
    for (const addr of user.addresses) {
      // Avoid duplicates — check if an Address doc already exists for this
      const exists = await Address.findOne({
        user: user._id,
        addressLine1: addr.addressLine1,
        postalCode: addr.postalCode,
      });

      if (exists) continue;

      await Address.create({
        user: user._id,
        fullName: addr.fullName || user.name,
        phone: addr.phone || user.phone || '',
        addressLine1: addr.addressLine1 || addr.street || '',
        addressLine2: addr.addressLine2 || '',
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postalCode || addr.pincode || '',
        country: addr.country || 'India',
        isDefault: addr.isDefault || false,
        label: addr.label || 'home',
      });
      created++;
    }

    await User.updateOne({ _id: user._id }, { $unset: { addresses: 1 } });
  }

  console.log(`Created ${created} standalone Address document(s)`);
  console.log(`Cleared embedded addresses from ${users.length} user(s)`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
