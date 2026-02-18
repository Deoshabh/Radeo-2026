// ===============================
// HTML Content Sanitizer Middleware
// Strips dangerous tags/attributes from CMS HTML fields
// Uses regex-based sanitization (no external dependency)
// ===============================

/**
 * Dangerous tags that should be removed from CMS HTML
 */
const DANGEROUS_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "applet",
  "form",
  "input",
  "textarea",
  "select",
  "button",
  "meta",
  "link",
  "base",
  "frame",
  "frameset",
];

const DANGEROUS_TAG_REGEX = new RegExp(
  `<\\s*/?\\s*(${DANGEROUS_TAGS.join("|")})(\\s[^>]*)?>`,
  "gi",
);

/**
 * Dangerous attributes (event handlers, javascript: URIs)
 */
const DANGEROUS_ATTR_REGEX = /\s(on\w+|formaction)\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URI_REGEX = /\s(href|src|action)\s*=\s*["']\s*javascript\s*:/gi;

/**
 * Sanitize an HTML string — strip dangerous tags and attributes
 * @param {string} html
 * @returns {string}
 */
function sanitizeHtml(html) {
  if (typeof html !== "string") return html;

  let clean = html;

  // Remove dangerous tags (including content between open/close)
  for (const tag of DANGEROUS_TAGS) {
    const fullTagRegex = new RegExp(
      `<\\s*${tag}(\\s[^>]*)?>([\\s\\S]*?)<\\s*/\\s*${tag}\\s*>`,
      "gi",
    );
    clean = clean.replace(fullTagRegex, "");
  }

  // Remove any remaining self-closing dangerous tags
  clean = clean.replace(DANGEROUS_TAG_REGEX, "");

  // Remove event handler attributes
  clean = clean.replace(DANGEROUS_ATTR_REGEX, "");

  // Remove javascript: URIs
  clean = clean.replace(JAVASCRIPT_URI_REGEX, "");

  return clean;
}

/**
 * Recursively sanitize string values in an object
 */
function deepSanitize(obj, fields) {
  if (typeof obj !== "object" || obj === null) return obj;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string" && fields.includes(key)) {
      obj[key] = sanitizeHtml(obj[key]);
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      deepSanitize(obj[key], fields);
    }
  }

  return obj;
}

/**
 * Express middleware — sanitize specified body fields that may contain HTML
 * @param  {...string} htmlFields - Field names to sanitize
 * @returns {Function} Express middleware
 *
 * @example
 *   router.post("/pages", sanitizeHtmlFields("content", "excerpt"), createPage);
 */
const sanitizeHtmlFields = (...htmlFields) => {
  return (req, _res, next) => {
    if (req.body && typeof req.body === "object") {
      deepSanitize(req.body, htmlFields);
    }
    next();
  };
};

module.exports = { sanitizeHtml, sanitizeHtmlFields };
