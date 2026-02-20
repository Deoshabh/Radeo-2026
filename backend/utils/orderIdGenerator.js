/**
 * orderIdGenerator.js
 *
 * Generates a professional, human-readable display order ID in the format:
 *   ORD-YYMMDD-####
 *
 * Examples:
 *   ORD-260220-1001   ← first order on 20 Feb 2026
 *   ORD-260220-1023   ← twenty-third order that day
 *
 * Strategy:
 *   - A dedicated `counters` MongoDB collection holds one document per day,
 *     keyed as  "orders-YYMMDD".
 *   - `findOneAndUpdate` with `$inc` is a single, atomic operation – fully
 *     safe under concurrent requests without any application-level locking.
 *   - On the first order of each day: MongoDB upserts the counter at seq=0
 *     and $inc bumps it to 1  →  displaySeq = 1000 + 1 = 1001.
 *   - seq 2 → 1002, seq 99 → 1099, seq 1000 → 2000, etc.
 *   - The #### segment is zero-padded to at least 4 digits (handles >9999 orders/day).
 *
 * Guarantees:
 *   ✓  No race conditions (atomic MongoDB operation)
 *   ✓  Resets automatically every new UTC day (counter key changes)
 *   ✓  Sequential and gap-free within a day
 *   ✓  displayOrderId is globally unique (date prefix + daily counter)
 */

"use strict";

const Counter = require("../models/Counter");

/**
 * Returns today's date-part string in "YYMMDD" format (UTC).
 * @returns {string}  e.g. "260220"
 */
function todayDateStr() {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);          // "26"
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0"); // "02"
  const dd = String(now.getUTCDate()).padStart(2, "0");       // "20"
  return `${yy}${mm}${dd}`;                                   // "260220"
}

/**
 * Atomically generates the next `displayOrderId` for the current UTC day.
 *
 * @returns {Promise<string>}  e.g. "ORD-260220-1023"
 *
 * @example
 * const displayOrderId = await generateDisplayOrderId();
 * // "ORD-260220-1001"
 */
async function generateDisplayOrderId() {
  const dateStr = todayDateStr();
  const counterId = `orders-${dateStr}`;

  // Atomic increment – upserts on first call each day.
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    {
      upsert: true,   // create the counter document if it doesn't exist yet
      new: true,      // return the document AFTER the update
      // `runValidators` is false by default for findOneAndUpdate – fine here
    },
  );

  // seq starts at 0 (default), first $inc gives 1 → 1001
  const displaySeq = 1000 + counter.seq;

  // Zero-pad to at least 4 digits; grows naturally for >9999 orders/day
  const seqStr = String(displaySeq).padStart(4, "0");

  return `ORD-${dateStr}-${seqStr}`;
}

module.exports = { generateDisplayOrderId, todayDateStr };
