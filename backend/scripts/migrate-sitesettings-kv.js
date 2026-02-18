/**
 * Migration: Move key-value settings from 'sitesettings' to 'site_settings_kv'
 *
 * The SiteSetting (key-value) and SiteSettings (singleton) models both
 * defaulted to the 'sitesettings' collection, causing a collision.
 * SiteSetting now targets 'site_settings_kv'.
 *
 * This script copies key-value docs (those with a `key` field) from
 * 'sitesettings' into 'site_settings_kv', then removes the originals.
 *
 * Usage:
 *   node scripts/migrate-sitesettings-kv.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { log } = require('../utils/logger');

const MONGO_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/shoes';

async function migrate() {
  log.info('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  log.info('Connected.');

  const db = mongoose.connection.db;
  const oldCollection = db.collection('sitesettings');
  const newCollection = db.collection('site_settings_kv');

  // Find key-value documents (have a `key` field â€” singleton docs don't)
  const kvDocs = await oldCollection.find({ key: { $exists: true } }).toArray();

  if (kvDocs.length === 0) {
    log.info('No key-value docs found in sitesettings â€” nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  log.info(`Found ${kvDocs.length} key-value doc(s) to migrate.`);

  // Insert into new collection (skip duplicates)
  let inserted = 0;
  for (const doc of kvDocs) {
    try {
      await newCollection.insertOne(doc);
      inserted++;
    } catch (err) {
      if (err.code === 11000) {
        log.warn(`Skipping duplicate key: ${doc.key}`);
      } else {
        throw err;
      }
    }
  }

  // Remove originals from old collection
  const ids = kvDocs.map((d) => d._id);
  const { deletedCount } = await oldCollection.deleteMany({ _id: { $in: ids } });

  log.success(`Migrated ${inserted} doc(s), removed ${deletedCount} from sitesettings.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  log.error('Migration failed:', err);
  process.exit(1);
});
