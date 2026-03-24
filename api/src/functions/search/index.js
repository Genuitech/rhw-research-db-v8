/**
 * Azure Function: search
 * GET /api/search?q=...&status=approved&type=memo&limit=20&offset=0
 *
 * Full-text search across research entries with filtering
 * Requires Entra SSO authentication
 * Visibility: staff see published entries without transcripts, admin sees all
 */

import * as cosmosDb from '../../utils/cosmosDb.js'
import { buildSearchQuery, applyVisibilityRules, formatSearchResponse } from '../../utils/searchUtil.js'

export async function search(req, context) {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user.email) {
      return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authentication required' })
      }
    }

    // Extract query and filters from query params
    const query = req.query?.q || ''
    const filters = {
      status: req.query?.status || undefined,
      type: req.query?.type || undefined,
      author: req.query?.author || undefined,
      createdAfter: req.query?.createdAfter || undefined,
      createdBefore: req.query?.createdBefore || undefined,
      tags: req.query?.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined,
      limit: req.query?.limit ? Math.min(parseInt(req.query.limit, 10), 100) : 20,
      offset: req.query?.offset ? Math.max(0, parseInt(req.query.offset, 10)) : 0
    }

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key]
    })

    // Initialize database
    await cosmosDb.initCosmosDb()

    // Get the entries container
    const entriesContainer = cosmosDb.getEntriesContainer()

    // Build and execute search query
    const { sql, parameters } = buildSearchQuery(query, filters)

    const { resources: results } = await entriesContainer.items
      .query({ query: sql, parameters })
      .fetchAll()

    // Get total count (without pagination)
    const countQuery = sql
      .replace(/OFFSET \d+ LIMIT \d+/, '')
      .replace(/SELECT \*/, 'SELECT VALUE COUNT(1)')

    const { resources: countResult } = await entriesContainer.items
      .query({ query: countQuery, parameters })
      .fetchAll()

    const total = countResult[0] || results.length

    // Apply visibility rules (hide conversation from non-admin)
    const visibleResults = applyVisibilityRules(results, req.user)

    // Format response
    const response = formatSearchResponse(
      visibleResults,
      total,
      filters.limit || 20,
      filters.offset || 0
    )

    context.log(`Search completed: query="${query}", filters=${JSON.stringify(filters)}, total=${total}`)

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    }
  } catch (error) {
    context.log.error(`Search error: ${error.message}`, error)

    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Search failed',
        message: error.message
      })
    }
  }
}

export default search
