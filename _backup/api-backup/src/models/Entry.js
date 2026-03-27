import { v4 as uuidv4 } from 'uuid'

export class Entry {
  constructor(data) {
    this.id = data.id || uuidv4()
    this.type = data.type // 'memo', 'sop', 'policy'
    this.client = data.client
    this.title = data.title || data.question
    this.question = data.question

    // Visible to all staff
    this.memo = data.memo || data.content
    this.tags = data.tags || []

    // Visible to admin only
    this.conversation = data.conversation || null
    this.draftEmail = data.draftEmail || null

    // SOP/Policy specific
    this.department = data.department || null
    this.effectiveDate = data.effectiveDate || null
    this.policyType = data.policyType || null

    // Metadata
    this.author = data.author
    this.status = data.status || 'pending'
    this.createdAt = data.createdAt || new Date().toISOString()
    this.approvedAt = data.approvedAt || null
    this.approvedBy = data.approvedBy || null
    this.supersededBy = data.supersededBy || null

    // Edit tracking
    this.editHistory = data.editHistory || []
  }

  validate() {
    if (!this.type || !['memo', 'sop', 'policy'].includes(this.type)) {
      throw new Error('Invalid type. Must be memo, sop, or policy')
    }

    if (!this.client) throw new Error('Missing required field: client')
    if (!this.author) throw new Error('Missing required field: author')
    if (!this.memo && !this.memo !== undefined) {
      throw new Error('Missing required field: memo or content')
    }

    if (this.type === 'memo') {
      if (!this.question) throw new Error('Memos require a question field')
    }

    return true
  }

  edit(newContent, editor) {
    this.editHistory.push({
      timestamp: new Date().toISOString(),
      editor,
      originalMemo: this.memo,
      newMemo: newContent
    })
    this.memo = newContent
  }

  approve(approverEmail) {
    if (this.status !== 'pending') {
      throw new Error('Only pending entries can be approved')
    }
    this.status = 'approved'
    this.approvedAt = new Date().toISOString()
    this.approvedBy = approverEmail
  }

  supersede(newEntryId) {
    this.status = 'superseded'
    this.supersededBy = newEntryId
  }

  toAdminJSON() {
    return { ...this }
  }

  toStaffJSON() {
    const obj = { ...this }
    if (this.type === 'memo') {
      delete obj.conversation
      delete obj.draftEmail
    }
    delete obj.editHistory
    return obj
  }
}
