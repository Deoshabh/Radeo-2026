/**
 * Index Audit Script
 *
 * Checks all MongoDB collections for missing indexes and applies them.
 *
 * Usage:
 *   node scripts/index-audit.js           # Dry-run — list missing indexes
 *   node scripts/index-audit.js --apply   # Apply missing indexes
 */

require("dotenv").config();
const mongoose = require("mongoose");

const REQUIRED_INDEXES = [
  // ── Order (HIGH priority) ────────────────────────────
  {
    collection: "orders",
    index: { user: 1, createdAt: -1 },
    options: { name: "user_createdAt", background: true },
  },
  {
    collection: "orders",
    index: { status: 1, createdAt: -1 },
    options: { name: "status_createdAt", background: true },
  },
  {
    collection: "orders",
    index: { user: 1, status: 1 },
    options: { name: "user_status", background: true },
  },
  {
    collection: "orders",
    index: { "payment.status": 1 },
    options: { name: "payment_status", background: true },
  },

  // ── ContactMessage (HIGH priority) ───────────────────
  {
    collection: "contactmessages",
    index: { status: 1, createdAt: -1 },
    options: { name: "status_createdAt", background: true },
  },
  {
    collection: "contactmessages",
    index: { email: 1 },
    options: { name: "email", background: true },
  },

  // ── User (MEDIUM priority) ──────────────────────────
  {
    collection: "users",
    index: { role: 1, createdAt: -1 },
    options: { name: "role_createdAt", background: true },
  },
  {
    collection: "users",
    index: { isBlocked: 1 },
    options: { name: "isBlocked", background: true },
  },

  // ── Address (MEDIUM priority) ───────────────────────
  {
    collection: "addresses",
    index: { user: 1, isDefault: 1 },
    options: { name: "user_isDefault", background: true },
  },

  // ── Coupon (MEDIUM priority) ────────────────────────
  {
    collection: "coupons",
    index: { isActive: 1, expiry: 1 },
    options: { name: "isActive_expiry", background: true },
  },

  // ── Filter (MEDIUM priority) ───────────────────────
  {
    collection: "filters",
    index: { type: 1, isActive: 1 },
    options: { name: "type_isActive", background: true },
  },

  // ── Category (LOW priority) ────────────────────────
  {
    collection: "categories",
    index: { isActive: 1, displayOrder: 1 },
    options: { name: "isActive_displayOrder", background: true },
  },

  // ── Product (LOW priority) ─────────────────────────
  {
    collection: "products",
    index: { sku: 1 },
    options: { name: "sku", background: true, sparse: true },
  },

  // ── Review (LOW priority) ──────────────────────────
  {
    collection: "reviews",
    index: { product: 1, createdAt: -1 },
    options: { name: "product_createdAt", background: true },
  },

  // ── WebhookLog (LOW priority) ──────────────────────
  {
    collection: "webhooklogs",
    index: { status: 1 },
    options: { name: "status", background: true },
  },
];

async function getExistingIndexes(db, collectionName) {
  try {
    const indexes = await db.collection(collectionName).indexes();
    return indexes.map((idx) => JSON.stringify(idx.key));
  } catch {
    return [];
  }
}

async function audit(apply = false) {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`Connected to ${uri.replace(/\/\/.*@/, "//***@")}\n`);

  let missing = 0;
  let applied = 0;

  for (const spec of REQUIRED_INDEXES) {
    const existing = await getExistingIndexes(db, spec.collection);
    const key = JSON.stringify(spec.index);

    if (existing.includes(key)) {
      console.log(`  ✓ ${spec.collection}.${spec.options.name}`);
      continue;
    }

    missing++;
    if (apply) {
      try {
        await db
          .collection(spec.collection)
          .createIndex(spec.index, spec.options);
        console.log(`  ✚ CREATED ${spec.collection}.${spec.options.name}`);
        applied++;
      } catch (err) {
        console.error(
          `  ✗ FAILED ${spec.collection}.${spec.options.name}: ${err.message}`,
        );
      }
    } else {
      console.log(
        `  ⚠ MISSING ${spec.collection}.${spec.options.name} → ${key}`,
      );
    }
  }

  console.log(`\n${REQUIRED_INDEXES.length} checked, ${missing} missing, ${applied} applied`);
  if (missing > 0 && !apply) {
    console.log('\nRun with --apply to create missing indexes.');
  }

  await mongoose.disconnect();
}

const shouldApply = process.argv.includes("--apply");
audit(shouldApply).catch((err) => {
  console.error(err);
  process.exit(1);
});
