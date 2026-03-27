/**
 * Email service for sending notifications and digests
 */

import nodemailer from 'nodemailer'

let transporter = null

/**
 * Initialize email transporter
 */
function initTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  })

  return transporter
}

/**
 * Send daily digest email to admins
 * @param {string} adminEmail - Recipient email
 * @param {array} entries - Pending entries created in last 24h
 */
export async function sendDigest(adminEmail, entries = []) {
  const transporter = initTransporter()

  if (!adminEmail) {
    throw new Error('Missing adminEmail')
  }

  // Calculate stats
  const totalCount = entries.length
  const typeBreakdown = {
    memo: entries.filter(e => e.type === 'memo').length,
    sop: entries.filter(e => e.type === 'sop').length,
    policy: entries.filter(e => e.type === 'policy').length
  }

  const allTags = new Set()
  entries.forEach(e => {
    if (e.tags && Array.isArray(e.tags)) {
      e.tags.forEach(tag => allTags.add(tag))
    }
  })

  const clients = new Set(entries.map(e => e.client).filter(Boolean))

  // Build HTML email
  const htmlBody = `
<html>
  <head>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; }
      .header { background: #1e3a8f; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 24px; }
      .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
      .content { padding: 20px; background: #f9fafb; }
      .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
      .stat-box { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #1e3a8f; }
      .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
      .stat-value { font-size: 28px; font-weight: bold; color: #1e3a8f; margin: 5px 0 0 0; }
      .entries-list { margin: 20px 0; }
      .entry { background: white; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #ddd; }
      .entry.memo { border-left-color: #3b82f6; }
      .entry.sop { border-left-color: #10b981; }
      .entry.policy { border-left-color: #f59e0b; }
      .entry-title { font-weight: 600; }
      .entry-meta { font-size: 12px; color: #666; margin: 5px 0 0 0; }
      .tags { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0 0 0; }
      .tag { background: #e5e7eb; color: #374151; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
      .cta { margin: 20px 0; }
      .button { display: inline-block; background: #1e3a8f; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; }
      .footer { padding: 15px 20px; background: #f3f4f6; font-size: 12px; color: #666; text-align: center; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>📚 Research Database Daily Digest</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="content">
      <p>Hello ${adminEmail},</p>
      <p>Here's your daily digest of new research entries awaiting review.</p>

      <div class="stats">
        <div class="stat-box">
          <div class="stat-label">Total Entries</div>
          <div class="stat-value">${totalCount}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Unique Clients</div>
          <div class="stat-value">${clients.size}</div>
        </div>
      </div>

      ${totalCount > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px;">Type Breakdown</h3>
          <p style="margin: 0; font-size: 14px;">
            📝 Memos: ${typeBreakdown.memo} |
            📖 SOPs: ${typeBreakdown.sop} |
            📋 Policies: ${typeBreakdown.policy}
          </p>
        </div>

        ${allTags.size > 0 ? `
          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">Top Tags</h3>
            <div class="tags">
              ${Array.from(allTags).slice(0, 10).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="entries-list">
          <h3 style="margin: 0 0 10px 0; font-size: 16px;">Recent Entries</h3>
          ${entries.slice(0, 5).map(entry => `
            <div class="entry ${entry.type}">
              <div class="entry-title">${entry.title || entry.question || entry.id}</div>
              <div class="entry-meta">
                ${entry.type.toUpperCase()} • ${entry.client} • ${entry.author}
              </div>
              ${entry.tags && entry.tags.length > 0 ? `
                <div class="tags">
                  ${entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
          ${entries.length > 5 ? `<p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">... and ${entries.length - 5} more</p>` : ''}
        </div>
      ` : `
        <p style="color: #999; font-style: italic;">No new entries submitted in the last 24 hours. Great job keeping up!</p>
      `}

      <div class="cta">
        <a href="http://localhost:3000/admin" class="button">Review Entries in Dashboard</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0;">RHW CPA Research Database | Sent at ${new Date().toLocaleTimeString('en-US')}</p>
    </div>
  </body>
</html>
  `.trim()

  // Plain text fallback
  const textBody = `
RHW CPA Research Database Daily Digest

${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}

Hello ${adminEmail},

Here's your daily digest of new research entries awaiting review.

SUMMARY
-------
Total Entries: ${totalCount}
Unique Clients: ${clients.size}
Memos: ${typeBreakdown.memo} | SOPs: ${typeBreakdown.sop} | Policies: ${typeBreakdown.policy}

${allTags.size > 0 ? `TAGS\n----\n${Array.from(allTags).slice(0, 10).join(', ')}\n\n` : ''}

RECENT ENTRIES
--------------
${entries.slice(0, 5).map(e => `- [${e.type.toUpperCase()}] ${e.title || e.question || e.id}\n  Client: ${e.client} | Author: ${e.author}`).join('\n')}

${entries.length > 5 ? `... and ${entries.length - 5} more\n\n` : ''}

Review entries at: http://localhost:3000/admin

---
RHW CPA Research Database
Sent at ${new Date().toLocaleTimeString('en-US')}
  `.trim()

  // Send email
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: adminEmail,
    subject: `[RHW] Research Database Digest - ${totalCount} new entries`,
    text: textBody,
    html: htmlBody
  })

  return {
    messageId: info.messageId,
    response: info.response,
    entriesCount: totalCount
  }
}

/**
 * Send approval notification email
 */
export async function sendApprovalNotification(entryAuthor, entryId, action) {
  const transporter = initTransporter()

  const subject = `Entry ${action}: ${entryId}`
  const text = `Your research entry ${entryId} has been ${action}.`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: entryAuthor,
    subject,
    text
  })
}
