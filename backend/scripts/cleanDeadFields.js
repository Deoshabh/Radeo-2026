#!/usr/bin/env node

/**
 * Dead Field Migration Script
 * Removes unused/dead fields from MongoDB documents.
 *
 * Usage:
 *   node scripts/cleanDeadFields.js --dry-run    # Preview changes only
 *   node scripts/cleanDeadFields.js              # Execute removal
 *
 * Dead fields identified during the codebase cleanup audit (see docs/CODEBASE_CLEANUP_REPORT.md)
 */

const mongoose = require('mongoose');
const path = require('path');

// Load env from project root
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DRY_RUN = process.argv.includes('--dry-run');

const DEAD_FIELDS = {
  // Collection name → array of dead field paths
  addresses: [
    'verifiedDelivery',
    'codAvailable',
    'lastVerified',
  ],
  contentpages: [
    'passwordHash',
    'publishedVersion',
    'lastPublishedAt',
    'lastPublishedBy',
    'lastRenderedAt',
    'parentPage',
  ],
  media: [
    'thumbnailUrl',
    'optimizedUrl',
    'dominantColor',
    'visibility',
    'allowedRoles',
    'processingStatus',
    'optimizationLog',
    'archivedAt',
    'deleteAt',
    'description',
  ],
  navigationmenus: [
    'maxDepth',
  ],
};

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌ No MONGODB_URI or MONGO_URI found in .env');
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Dead Field Migration ${DRY_RUN ? '(DRY RUN — no changes will be made)' : '(LIVE RUN)'}`);
  console.log(`${'='.repeat(60)}\n`);

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;
  let totalDocs = 0;
  let totalFields = 0;

  for (const [collectionName, fields] of Object.entries(DEAD_FIELDS)) {
    console.log(`── ${collectionName} ──`);

    // Build $or query: docs that have at least one dead field
    const existsFilter = {
      $or: fields.map((f) => ({ [f]: { $exists: true } })),
    };

    const affectedCount = await db.collection(collectionName).countDocuments(existsFilter);

    if (affectedCount === 0) {
      console.log(`   No documents have dead fields — skipping.\n`);
      continue;
    }

    // Build $unset object
    const unsetObj = {};
    for (const f of fields) {
      unsetObj[f] = '';
    }

    console.log(`   Fields to remove : ${fields.join(', ')}`);
    console.log(`   Documents affected: ${affectedCount}`);

    if (!DRY_RUN) {
      const result = await db.collection(collectionName).updateMany(
        existsFilter,
        { $unset: unsetObj },
      );
      console.log(`   ✅ Modified: ${result.modifiedCount} documents`);
    } else {
      console.log('   🔍 DRY RUN — no changes applied.');
    }

    totalDocs += affectedCount;
    totalFields += fields.length;
    console.log('');
  }

  console.log(`${'─'.repeat(60)}`);
  console.log(`Summary: ${totalFields} field definitions across ${Object.keys(DEAD_FIELDS).length} collections`);
  console.log(`         ${totalDocs} total documents would be ${DRY_RUN ? 'affected' : 'were modified'}`);
  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to apply changes.');
  }
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
