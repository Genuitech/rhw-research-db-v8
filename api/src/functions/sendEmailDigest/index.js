/**
 * Azure Function: sendEmailDigest
 * POST /api/sendEmailDigest (triggered by cron: 0 0 2 * * *)
 *
 * Daily digest: send email to admin with pending entries from last 24 hours
 * Cron schedule: 2 AM UTC = 10 PM ET
 */

import * as cosmosDb from '../../utils/cosmosDb.js'
import { sendDigest } from '../../utils/emailService.js'

export async function sendEmailDigest(req, context) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'cromine@rhwcpas.com'

    // Initialize database
    await cosmosDb.initCosmosDb()

    // Get entries created in last 24 hours
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const { resources: entries } = await cosmosDb.getEntriesContainer().items
      .query({
        query: `
          SELECT * FROM c
          WHERE c.createdAt >= @yesterday
          AND c.status = 'pending'
          ORDER BY c.createdAt DESC
        `,
        parameters: [
          { name: '@yesterday', value: yesterday.toISOString() }
        ]
      })
      .fetchAll()

    // Send digest
    const result = await sendDigest(adminEmail, entries)

    context.log(`Email digest sent to ${adminEmail}. Entries: ${result.entriesCount}`)

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'sent',
        recipient: adminEmail,
        entriesCount: result.entriesCount,
        messageId: result.messageId
      })
    }
  } catch (error) {
    context.log.error(`Send email digest error: ${error.message}`, error)

    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to send email digest',
        message: error.message
      })
    }
  }
}

export default sendEmailDigest
