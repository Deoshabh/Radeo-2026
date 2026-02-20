/**
 * Counter model – used for atomic daily sequential IDs.
 *
 * Each document tracks a named counter for a specific day:
 *   _id : "orders-YYMMDD"
 *   seq : <auto-incremented integer starting from 0>
 *
 * Usage:
 *   const counter = await Counter.findOneAndUpdate(
 *     { _id: 'orders-260220' },
 *     { $inc: { seq: 1 } },
 *     { upsert: true, new: true }
 *   );
 *   // displaySeq = 1000 + counter.seq  → 1001, 1002, …
 *
 * Stale counters (>7 days old) can be purged by a separate cron job.
 */

const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "orders-260220"
    seq: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "counters" },
);

module.exports = mongoose.model("Counter", counterSchema);
