// ===============================
// Review Moderation Service
// Text-based moderation with blocklist, spam detection, scoring
// ===============================

/**
 * Blocklist of prohibited words/phrases (lowercase)
 * Expand this list as needed
 */
const BLOCKLIST = [
  // Keep a minimal, representative set — extend per business needs
  "spam", "scam", "fake", "fraud",
  "buy now", "click here", "free money",
  "http://", "https://", "bit.ly", "tinyurl",
];

const BLOCKLIST_REGEX = new RegExp(
  BLOCKLIST.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "gi",
);

/**
 * Spam detection patterns
 */
const SPAM_PATTERNS = [
  /(.)\1{6,}/,                    // Same char repeated 7+ times
  /\b\d{10,}\b/,                  // Phone numbers (10+ digits)
  /[A-Z\s]{20,}/,                 // ALL CAPS 20+ chars
  /(.{3,})\1{3,}/,                // Repeated phrase 4+ times
  /(buy|order|discount|offer|sale|deal|promo|coupon)\s+(now|today|here)/gi,
];

/**
 * Moderate review text (title + comment)
 *
 * @param {string} title - Review title
 * @param {string} comment - Review body
 * @returns {{ score: number, flags: string[], action: 'approve'|'flag'|'reject' }}
 *   score: 0 (safe) → 100 (spam/abuse)
 *   flags: array of triggered rule labels
 *   action: suggested moderation action
 */
const moderateReview = (title = "", comment = "") => {
  const text = `${title} ${comment}`.trim();
  const flags = [];
  let score = 0;

  if (!text || text.length < 2) {
    return { score: 0, flags: [], action: "approve" };
  }

  // 1. Blocklist check
  const blockhits = text.match(BLOCKLIST_REGEX);
  if (blockhits) {
    const unique = [...new Set(blockhits.map((h) => h.toLowerCase()))];
    score += Math.min(unique.length * 20, 60);
    flags.push(`blocklist:${unique.join(",")}`);
  }

  // 2. Spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      score += 15;
      flags.push(`spam_pattern:${pattern.source.slice(0, 30)}`);
    }
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
  }

  // 3. Too short comment (could be low-quality)
  if (comment.trim().length > 0 && comment.trim().length < 10) {
    score += 5;
    flags.push("short_comment");
  }

  // 4. Excessive URLs
  const urlCount = (text.match(/https?:\/\//gi) || []).length;
  if (urlCount >= 2) {
    score += 25;
    flags.push(`urls:${urlCount}`);
  }

  // 5. Excessive caps ratio
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 10) {
    const capsRatio = (text.replace(/[^A-Z]/g, "").length) / letters.length;
    if (capsRatio > 0.7) {
      score += 10;
      flags.push("excessive_caps");
    }
  }

  // Clamp score
  score = Math.min(score, 100);

  // Determine action
  let action = "approve";
  if (score >= 60) {
    action = "reject";
  } else if (score >= 25) {
    action = "flag";
  }

  return { score, flags, action };
};

module.exports = { moderateReview };
