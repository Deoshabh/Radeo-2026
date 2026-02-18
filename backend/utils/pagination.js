/**
 * Shared pagination utility for all list endpoints.
 * Parses page/limit from query string with sensible defaults and max caps.
 *
 * @param {Object} query - req.query object
 * @param {number} [maxLimit=200] - Maximum allowed limit per request
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query, maxLimit = 200) {
  const page = Math.max(parseInt(query?.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query?.limit, 10) || 50, 1), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build standard pagination response metadata.
 *
 * @param {number} total - Total document count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {{ total: number, page: number, pages: number, limit: number }}
 */
function paginationMeta(total, page, limit) {
  return {
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
}

module.exports = { parsePagination, paginationMeta };
