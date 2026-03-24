/**
 * Azure Function: getEntry
 * GET /api/entry/{id}
 *
 * Retrieve a single research entry with approval history
 * Requires Entra SSO authentication
 * Visibility: staff see published entries without conversation, admin sees all
 */

import * as cosmosDb from '../../utils/cosmosDb.js'

export async function getEntry(req, context) {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user.email) {
      return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authentication required' })
      }
    }

    // Get entry ID from route param
    const entryId = req.params?.id

    if (!entryId) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing entry ID' })
      }
    }

    // Initialize database
    await cosmosDb.initCosmosDb()

    // Get entry from Cosmos DB
    const entriesContainer = cosmosDb.getEntriesContainer()
    let entry = null

    // Try to fetch by ID (partition key is 'type', but we need to query)
    const { resources } = await entriesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: entryId }]
      })
      .fetchAll()

    if (resources.length === 0) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Entry not found' })
      }
    }

    entry = resources[0]

    // Get approval history
    const approvalHistory = await cosmosDb.getApprovalHistory(entryId)

    // Apply visibility rules
    const visibleEntry = req.user.isAdmin ? entry : {
      ...entry,
      conversation: undefined,
      draftEmail: undefined,
      editHistory: undefined
    }

    context.log(`Entry retrieved: ${entryId}, user: ${req.user.email}`)

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...visibleEntry,
        approvalHistory
      })
    }
  } catch (error) {
    context.log.error(`Get entry error: ${error.message}`, error)

    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to retrieve entry',
        message: error.message
      })
    }
  }
}

export default getEntry
