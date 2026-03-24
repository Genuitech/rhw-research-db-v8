/**
 * Search utility functions for Cosmos DB full-text search
 */

/**
 * Build SQL query for searching entries with filters
 * @param {string} query - Search term (optional)
 * @param {object} filters - Filter options { status, type, author, tags, createdAfter, createdBefore, limit, offset }
 * @returns {object} { sql, parameters }
 */
export function buildSearchQuery(query, filters = {}) {
  let sql = 'SELECT * FROM c WHERE 1=1'
  const parameters = []
  let paramIndex = 0

  // Full-text search across multiple fields
  if (query && query.trim()) {
    sql += ` AND (
      CONTAINS(c.memo, @searchQuery) OR
      CONTAINS(c.client, @searchQuery) OR
      CONTAINS(c.question, @searchQuery) OR
      CONTAINS(c.title, @searchQuery) OR
      CONTAINS(c.content, @searchQuery) OR
      CONTAINS(LOWER(c.tags), @searchQuery)
    )`
    parameters.push({ name: '@searchQuery', value: query.trim() })
    paramIndex++
  }

  // Filter by status
  if (filters.status) {
    const paramName = `@status`
    sql += ` AND c.status = ${paramName}`
    parameters.push({ name: paramName, value: filters.status })
  }

  // Filter by type (memo, sop, policy)
  if (filters.type) {
    const paramName = `@type`
    sql += ` AND c.type = ${paramName}`
    parameters.push({ name: paramName, value: filters.type })
  }

  // Filter by author
  if (filters.author) {
    const paramName = `@author`
    sql += ` AND c.author = ${paramName}`
    parameters.push({ name: paramName, value: filters.author })
  }

  // Filter by date range
  if (filters.createdAfter) {
    const paramName = `@createdAfter`
    sql += ` AND c.createdAt >= ${paramName}`
    parameters.push({ name: paramName, value: filters.createdAfter })
  }

  if (filters.createdBefore) {
    const paramName = `@createdBefore`
    sql += ` AND c.createdAt <= ${paramName}`
    parameters.push({ name: paramName, value: filters.createdBefore })
  }

  // Filter by tags (array contains)
  if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
    filters.tags.forEach((tag, idx) => {
      const paramName = `@tag${idx}`
      sql += ` AND ARRAY_CONTAINS(c.tags, ${paramName})`
      parameters.push({ name: paramName, value: tag })
    })
  }

  // Sorting
  sql += ' ORDER BY c.createdAt DESC'

  // Pagination
  const limit = Math.min(filters.limit || 20, 100) // Max 100 per request
  const offset = filters.offset || 0

  sql += ` OFFSET ${offset} LIMIT ${limit}`

  return { sql, parameters, limit, offset }
}

/**
 * Apply visibility rules to search results
 * @param {array} entries - Raw entries from database
 * @param {object} user - Current user { email, isAdmin }
 * @returns {array} Entries with appropriate visibility
 */
export function applyVisibilityRules(entries, user) {
  if (!user) return []

  return entries.map(entry => {
    if (user.isAdmin) {
      return entry.toAdminJSON ? entry.toAdminJSON() : entry
    } else {
      return entry.toStaffJSON ? entry.toStaffJSON() : entry
    }
  })
}

/**
 * Format search response with metadata
 * @param {array} results - Filtered, visible entries
 * @param {number} total - Total count (before pagination)
 * @param {number} limit - Page size
 * @param {number} offset - Current offset
 * @returns {object} Formatted response
 */
export function formatSearchResponse(results, total, limit, offset) {
  const page = Math.floor(offset / limit) + 1
  const pageSize = results.length
  const hasMore = offset + limit < total

  return {
    results,
    total,
    page,
    pageSize,
    limit,
    offset,
    hasMore
  }
}
