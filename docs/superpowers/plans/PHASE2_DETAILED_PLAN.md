# Phase 2: Backend APIs Implementation Plan

**Date:** 2026-03-24
**Status:** In Progress
**Current:** Task 4 (submitEntry) complete
**Remaining:** Tasks 5-9 (search, getEntry, approveEntry, sendEmailDigest, healthCheck)

---

## Scope

Complete all remaining backend API functions for the RHW Research Database:

| Task | Function | Endpoint | Method | Purpose |
|------|----------|----------|--------|---------|
| 4 | submitEntry | `/api/submitEntry` | POST | ✅ Create new research entries (DONE) |
| 5 | search | `/api/search` | GET | 🔲 Find entries by query + filters |
| 6 | getEntry | `/api/entry/{id}` | GET | 🔲 Retrieve single entry (staff or admin view) |
| 7 | approveEntry | `/api/approveEntry` | POST | 🔲 Approve/reject pending entries (admin only) |
| 8 | sendEmailDigest | `/api/sendEmailDigest` | POST | 🔲 Cron: daily email digest to admins |
| 9 | healthCheck | `/api/health` | GET | 🔲 API health status |

---

## Architecture Context

- **Frontend:** React 19 + Vite (liquid glass UI)
- **Backend:** Azure Functions (Node.js runtime)
- **Database:** Cosmos DB with full-text search indexing
- **Auth:** Entra SSO (req.user injected via middleware) + API keys for data ingestion
- **Testing:** Vitest (TDD approach)

---

## Task 5: Search API

### Requirements
- Query full-text search across memo, client, question, tags
- Filter by: status, type, author, tags, dateRange
- Return paginated results (limit, offset)
- Apply staff/admin visibility rules (hide conversation for non-admin)
- Measure search latency

### Implementation Steps

1. **Test First** (TDD)
   - Write failing tests for search with various filters
   - Test pagination logic
   - Test staff vs admin visibility

2. **Create Function**
   - File: `api/src/functions/search/index.js`
   - Use cosmosDb.searchEntries() utility
   - Support filters: status, type, author, tags, dateRange
   - Apply `.toStaffJSON()` or `.toAdminJSON()` based on user role
   - Return: { results, total, page, pageSize, hasMore }

3. **Unit Tests**
   - searchUtil.test.js — filter logic, pagination
   - search.test.js — endpoint auth, response format

4. **Integration Tests**
   - Call search with various filter combos
   - Verify staff user can't see conversation field
   - Verify admin user can see full entry

---

## Task 6: Get Entry API

### Requirements
- Retrieve single entry by ID
- Apply staff/admin visibility (conversation hidden for staff)
- Return full entry with approval history
- 404 if entry not found
- Auth: Anyone logged in can view (if they have permission)

### Implementation Steps

1. **Test First**
   - Test retrieving entry with staff user (conversation hidden)
   - Test retrieving entry with admin user (full data)
   - Test 404 on missing entry
   - Test approval history included

2. **Create Function**
   - File: `api/src/functions/getEntry/index.js`
   - Require Entra token (not API key)
   - Fetch entry from cosmosDb.getEntry()
   - Fetch approval history from cosmosDb.getApprovalHistory()
   - Return appropriate JSON based on user role
   - Return: { ...entry, approvalHistory: [...] }

3. **Tests**
   - getEntry.test.js — endpoint logic
   - Unit test: entry visibility rules

---

## Task 7: Approve Entry API

### Requirements
- POST body: { entryId, action, notes? }
- Actions: approve, reject, request_changes
- Admin only (requireAdmin middleware)
- Update entry.status and approvedAt/approvedBy
- Create approval history record
- Return updated entry

### Implementation Steps

1. **Test First**
   - Test approve action (status → approved, approvedAt set)
   - Test reject action (status → rejected)
   - Test request_changes action
   - Test non-admin rejection
   - Test approval history record creation

2. **Create Function**
   - File: `api/src/functions/approveEntry/index.js`
   - Require admin auth (requireAdmin middleware)
   - Validate action is in ['approve', 'reject', 'request_changes']
   - Call entry.approve() or entry.supersede()
   - Update entry in Cosmos DB
   - Create approval history record
   - Return updated entry with status

3. **Tests**
   - approveEntry.test.js — all actions, auth checks
   - Unit test: approval status transitions

---

## Task 8: Send Email Digest (Cron Function)

### Requirements
- Daily trigger (10 PM ET / 2 AM UTC)
- Collect all pending entries created in last 24h
- Email to ADMIN_EMAIL with summary
- Include entry count, top tags, client list
- Link to admin dashboard
- Handle errors gracefully (don't crash)

### Implementation Steps

1. **Test First**
   - Test digest generation for mock entries
   - Test email formatting (plain text + HTML)
   - Test empty digest (no pending entries)
   - Test error handling (DB failure, email failure)

2. **Create Function**
   - File: `api/src/functions/sendEmailDigest/index.js`
   - Query pending entries from last 24h
   - Generate email subject + body
   - Call emailService.sendDigest()
   - Log success/failure
   - Return { status: 'sent', count: N }

3. **Utility: emailService.js**
   - Create `api/src/utils/emailService.js`
   - Function: sendDigest(adminEmail, entries)
   - Use Nodemailer to send via configured SMTP
   - Support HTML + plain text alternatives
   - Log email sent with timestamp

4. **Tests**
   - sendEmailDigest.test.js — digest generation, email formatting
   - emailService.test.js — SMTP integration (mock)

---

## Task 9: Health Check API

### Requirements
- GET /api/health
- No auth required
- Return: { status: 'ok', timestamp, apiVersion }
- Used for monitoring + uptime checks

### Implementation Steps

1. **Test First**
   - Test 200 response with expected fields
   - Test no auth required

2. **Create Function**
   - File: `api/src/functions/healthCheck/index.js`
   - Simple response: { status: 'ok', timestamp: now(), apiVersion: '1.0.0' }

---

## Testing Strategy (TDD)

### Test Structure
```
api/tests/
├── unit/
│   ├── searchUtil.test.js
│   ├── emailService.test.js
│   └── validators.test.js
├── integration/
│   ├── search.integration.test.js
│   ├── getEntry.integration.test.js
│   ├── approveEntry.integration.test.js
│   └── sendEmailDigest.integration.test.js
└── setup.js (mocks, fixtures)
```

### Test Fixtures
- Mock entries: memo, sop, policy types
- Mock users: staff, admin
- Mock Cosmos DB responses

### Running Tests
```bash
npm test --workspace=api
npm test --workspace=api -- search.integration.test.js  # Single file
```

---

## Definition of Done for Phase 2

- [ ] All 5 new functions implemented
- [ ] Unit + integration tests for each function
- [ ] >90% code coverage
- [ ] All tests passing
- [ ] No console errors in dev mode
- [ ] Commits pushed to GitHub
- [ ] INTEGRATION_GUIDE.md updated with new endpoints
- [ ] Verified with curl or Postman
- [ ] Code review completed

---

## Estimated Time

- Task 5 (search): 2-3 hours
- Task 6 (getEntry): 1-2 hours
- Task 7 (approveEntry): 2-3 hours
- Task 8 (sendEmailDigest): 2-3 hours
- Task 9 (healthCheck): 30 mins
- **Total: 8-12 hours**

---

## Next After Phase 2

- Phase 3: Frontend Components (React UI)
- Phase 4: Integration & Approval Workflow
- Phase 5: Deployment & Go-Live

---

## Chea: Approve to proceed?

**Questions to clarify:**
- Should search support advanced filters (date range, category)?
- Should approval workflow include "request_changes" state or just approve/reject?
- Should email digests include pending entries count limit (e.g., latest 20)?

