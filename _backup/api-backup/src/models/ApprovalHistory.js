import { v4 as uuidv4 } from 'uuid'

export class ApprovalHistory {
  constructor(data) {
    this.id = data.id || uuidv4()
    this.entryId = data.entryId
    this.action = data.action // 'submitted', 'approved', 'rejected', 'requested_changes'
    this.actor = data.actor
    this.timestamp = data.timestamp || new Date().toISOString()
    this.notes = data.notes || null
    this.changes = data.changes || null // For 'requested_changes'
  }

  static createSubmission(entryId, author) {
    return new ApprovalHistory({
      entryId,
      action: 'submitted',
      actor: author
    })
  }

  static createApproval(entryId, approver) {
    return new ApprovalHistory({
      entryId,
      action: 'approved',
      actor: approver
    })
  }

  static createRejection(entryId, reviewer, notes) {
    return new ApprovalHistory({
      entryId,
      action: 'rejected',
      actor: reviewer,
      notes
    })
  }
}
