/**
 * Azure Function: approveEntry
 * POST /api/approveEntry
 *
 * Approve, reject, or request changes on pending research entries
 * Admin only (requireAdmin middleware)
 */

import { Entry } from '../../models/Entry.js'
import { ApprovalHistory } from '../../models/ApprovalHistory.js'
import * as cosmosDb from '../../utils/cosmosDb.js'

export async function approveEntry(req, context) {
  try {
    // Verify admin authentication
    if (!req.user || !req.user.isAdmin) {
      return {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admin access required' })
      }
    }

    // Parse request body
    const { entryId, action, notes } = req.body

    // Validate inputs
    if (!entryId) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing entryId' })
      }
    }

    if (!action || !['approve', 'reject', 'request_changes'].includes(action)) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid action. Must be: approve, reject, or request_changes' })
      }
    }

    // Initialize database
    await cosmosDb.initCosmosDb()

    // Get entry from Cosmos DB
    const entriesContainer = cosmosDb.getEntriesContainer()
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

    let entry = resources[0]

    // Only allow approving pending entries
    if (action === 'approve' && entry.status !== 'pending') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Cannot approve entry with status: ${entry.status}` })
      }
    }

    // Apply action
    if (action === 'approve') {
      entry.status = 'approved'
      entry.approvedAt = new Date().toISOString()
      entry.approvedBy = req.user.email
    } else if (action === 'reject') {
      entry.status = 'rejected'
      entry.rejectedAt = new Date().toISOString()
      entry.rejectedBy = req.user.email
    } else if (action === 'request_changes') {
      entry.status = 'review_requested'
      entry.changesRequestedAt = new Date().toISOString()
      entry.changesRequestedBy = req.user.email
    }

    // Update entry in Cosmos DB
    const updatedEntry = await cosmosDb.updateEntry(entryId, entry.type, entry)

    // Create approval history record
    const approvalRecord = new ApprovalHistory({
      entryId,
      action,
      actor: req.user.email,
      notes: notes || null
    })

    await cosmosDb.createApprovalRecord(approvalRecord)

    context.log(`Entry ${action}: ${entryId} by ${req.user.email}`)

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: updatedEntry.id,
        status: updatedEntry.status,
        approvedBy: updatedEntry.approvedBy,
        approvedAt: updatedEntry.approvedAt,
        rejectedBy: updatedEntry.rejectedBy,
        rejectedAt: updatedEntry.rejectedAt,
        changesRequestedBy: updatedEntry.changesRequestedBy,
        changesRequestedAt: updatedEntry.changesRequestedAt
      })
    }
  } catch (error) {
    context.log.error(`Approve entry error: ${error.message}`, error)

    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to approve entry',
        message: error.message
      })
    }
  }
}

export default approveEntry
