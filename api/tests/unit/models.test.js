import { describe, it, expect, beforeEach } from 'vitest'
import { Entry } from '../../src/models/Entry.js'

describe('Entry Model', () => {
  it('should validate a valid research memo entry', () => {
    const entry = new Entry({
      type: 'memo',
      client: 'ABC Corp',
      question: 'Can we form an LLC?',
      conversation: 'Q: Can we form an LLC?\nA: Yes, with restrictions...',
      memo: 'Research summary...',
      tags: ['LLC', 'Formation'],
      author: 'user@rhwcpas.com',
      status: 'pending'
    })

    expect(entry.validate()).toBe(true)
    expect(entry.id).toBeDefined()
    expect(entry.createdAt).toBeDefined()
  })

  it('should reject entry without required fields', () => {
    const entry = new Entry({ type: 'memo' })
    expect(() => entry.validate()).toThrow('Missing required field: client')
  })

  it('should handle SOP entries with RHW client', () => {
    const entry = new Entry({
      type: 'sop',
      client: 'RHW',
      title: 'Invoice Processing',
      content: 'Step 1...',
      author: 'user@rhwcpas.com',
      status: 'pending'
    })

    expect(entry.validate()).toBe(true)
    expect(entry.client).toBe('RHW')
  })

  it('should track edits with original and edited versions', () => {
    const entry = new Entry({
      type: 'memo',
      client: 'ABC Corp',
      question: 'Entity formation?',
      conversation: 'Original conversation...',
      memo: 'Original memo',
      author: 'user@rhwcpas.com',
      status: 'pending'
    })

    entry.edit('Edited memo', 'admin@rhwcpas.com')
    expect(entry.memo).toBe('Edited memo')
    expect(entry.editHistory.length).toBe(1)
    expect(entry.editHistory[0].editor).toBe('admin@rhwcpas.com')
  })

  it('should approve pending entries', () => {
    const entry = new Entry({
      type: 'memo',
      client: 'ABC Corp',
      question: 'Question?',
      memo: 'Answer',
      author: 'user@rhwcpas.com',
      status: 'pending'
    })

    entry.approve('admin@rhwcpas.com')
    expect(entry.status).toBe('approved')
    expect(entry.approvedBy).toBe('admin@rhwcpas.com')
    expect(entry.approvedAt).toBeDefined()
  })

  it('should prevent approving non-pending entries', () => {
    const entry = new Entry({
      type: 'memo',
      client: 'ABC Corp',
      question: 'Question?',
      memo: 'Answer',
      author: 'user@rhwcpas.com',
      status: 'approved'
    })

    expect(() => entry.approve('admin@rhwcpas.com')).toThrow('Only pending entries can be approved')
  })

  it('should hide conversation from staff view', () => {
    const entry = new Entry({
      type: 'memo',
      client: 'ABC Corp',
      question: 'Question?',
      conversation: 'Secret conversation',
      memo: 'Public memo',
      author: 'user@rhwcpas.com',
      status: 'approved'
    })

    const staffView = entry.toStaffJSON()
    expect(staffView.conversation).toBeUndefined()
    expect(staffView.memo).toBe('Public memo')
  })

  it('should include conversation in admin view', () => {
    const entry = new Entry({
      type: 'memo',
      client: 'ABC Corp',
      question: 'Question?',
      conversation: 'Secret conversation',
      memo: 'Public memo',
      author: 'user@rhwcpas.com',
      status: 'approved'
    })

    const adminView = entry.toAdminJSON()
    expect(adminView.conversation).toBe('Secret conversation')
  })
})

import { ApprovalHistory } from '../../src/models/ApprovalHistory.js'

describe('ApprovalHistory Model', () => {
  it('should create a submission record', () => {
    const record = ApprovalHistory.createSubmission('entry-123', 'user@rhwcpas.com')
    
    expect(record.entryId).toBe('entry-123')
    expect(record.action).toBe('submitted')
    expect(record.actor).toBe('user@rhwcpas.com')
    expect(record.timestamp).toBeDefined()
    expect(record.id).toBeDefined()
  })

  it('should create an approval record', () => {
    const record = ApprovalHistory.createApproval('entry-123', 'admin@rhwcpas.com')
    
    expect(record.entryId).toBe('entry-123')
    expect(record.action).toBe('approved')
    expect(record.actor).toBe('admin@rhwcpas.com')
  })

  it('should create a rejection record with notes', () => {
    const record = ApprovalHistory.createRejection('entry-123', 'admin@rhwcpas.com', 'Needs more detail')
    
    expect(record.action).toBe('rejected')
    expect(record.notes).toBe('Needs more detail')
  })

  it('should create a request changes record', () => {
    const record = new ApprovalHistory({
      entryId: 'entry-123',
      action: 'requested_changes',
      actor: 'admin@rhwcpas.com',
      changes: { memo: 'Review and resubmit' }
    })

    expect(record.action).toBe('requested_changes')
    expect(record.changes.memo).toBe('Review and resubmit')
  })
})
