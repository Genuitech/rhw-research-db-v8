/**
 * Azure Function: submitEntry
 * POST /api/submitEntry
 *
 * Accepts new research entries from:
 * - Web UI (submission form)
 * - Data-ingestion scripts (meeting extractor, web scraper)
 *
 * Authentication: API key for data-ingestion, Entra SSO for web UI
 */

import { Entry } from '../../models/Entry.js';
import { ApprovalHistory } from '../../models/ApprovalHistory.js';
import * as cosmosDb from '../../utils/cosmosDb.js';
import { validateApiKey } from '../../middleware/apiKeyAuth.js';

export async function submitEntry(req, context) {
  try {
    // Authenticate using API key middleware
    // In Azure Functions, we handle this manually
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        status: 401,
        body: JSON.stringify({
          error: 'Missing or invalid authorization header'
        })
      };
    }

    const apiKey = authHeader.substring(7);
    const validKey = process.env.INGEST_API_KEY;

    if (apiKey !== validKey) {
      return {
        status: 403,
        body: JSON.stringify({
          error: 'Invalid API key'
        })
      };
    }

    // Parse request body
    const data = req.body;

    // Create Entry instance
    const entry = new Entry({
      type: data.type,
      client: data.client,
      title: data.title,
      question: data.question,
      memo: data.memo,
      conversation: data.conversation,
      tags: data.tags || [],
      author: data.author || 'system@rhwcpas.com',
      status: data.status || 'pending',
      department: data.department,
      effectiveDate: data.effectiveDate,
      policyType: data.policyType
    });

    // Validate entry
    try {
      entry.validate();
    } catch (error) {
      return {
        status: 400,
        body: JSON.stringify({
          error: 'Validation failed',
          message: error.message
        })
      };
    }

    // Initialize database
    await cosmosDb.initCosmosDb();

    // Create entry in Cosmos DB
    const created = await cosmosDb.createEntry(entry);

    // Create approval history record
    const approvalRecord = ApprovalHistory.createSubmission(entry.id, entry.author);
    await cosmosDb.createApprovalRecord(approvalRecord);

    // Log success
    context.log(`Entry created: ${entry.id} (type: ${entry.type}, status: ${entry.status})`);

    return {
      status: 201,
      body: JSON.stringify({
        id: entry.id,
        type: entry.type,
        status: entry.status,
        createdAt: entry.createdAt,
        client: entry.client,
        title: entry.title || entry.question
      })
    };
  } catch (error) {
    context.log.error(`submitEntry error: ${error.message}`);

    return {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to create entry',
        message: error.message
      })
    };
  }
}

export default submitEntry;
