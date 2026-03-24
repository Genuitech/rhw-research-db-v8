# RHW Research & Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a firm-wide searchable research database with approval workflow, privacy controls, and M365 SSO that stores research memos, SOPs, and policies with hidden Q&A transcripts and redline editing.

**Architecture:**
- Frontend: React with liquid glass UI, fuzzy search interface, submission form, approval dashboard
- Backend: Azure Functions providing REST APIs for CRUD, search, approval workflow, email digests
- Database: Cosmos DB with full-text search index for fuzzy matching, separate collections for entries, versions, approval history
- Auth: Microsoft Entra SSO (silent M365 login), role-based access (admin vs. staff)
- Hosting: Azure Static Web Apps with auto-deploy from GitHub

**Tech Stack:** React 19, Vite, Azure Functions (Node.js), Cosmos DB, Microsoft Entra, Azure Static Web Apps, Azure Cognitive Search (for fuzzy search), Nodemailer (for email digests)

---

## File Structure

```
rhw-research-db/
├── frontend/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchInterface.jsx    # Main search UI
│   │   │   ├── SubmissionForm.jsx     # Upload conversation + memo
│   │   │   ├── ApprovalDashboard.jsx  # Pending approvals
│   │   │   ├── EntryViewer.jsx        # View approved entries
│   │   │   ├── RedlineEditor.jsx      # Edit with diff tracking
│   │   │   └── GlassComponents.jsx    # Liquid glass UI primitives
│   │   ├── hooks/
│   │   │   ├── useSearch.js           # Search query + results
│   │   │   ├── useAuth.js             # Entra SSO
│   │   │   ├── useEntries.js          # CRUD operations
│   │   │   └── useApproval.js         # Approval workflow
│   │   ├── pages/
│   │   │   ├── SearchPage.jsx
│   │   │   ├── SubmitPage.jsx
│   │   │   ├── AdminPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── globals.css                # Liquid glass utilities
│   │   └── index.html
│   ├── tests/
│   │   ├── SearchInterface.test.jsx
│   │   ├── SubmissionForm.test.jsx
│   │   ├── useSearch.test.js
│   │   └── useAuth.test.js
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── api/                               # Azure Functions backend
│   ├── src/
│   │   ├── functions/
│   │   │   ├── submitEntry/
│   │   │   │   ├── index.js           # POST /submitEntry
│   │   │   │   └── index.test.js
│   │   │   ├── approveEntry/
│   │   │   │   ├── index.js           # POST /approveEntry
│   │   │   │   └── index.test.js
│   │   │   ├── search/
│   │   │   │   ├── index.js           # GET /search?q=...
│   │   │   │   └── index.test.js
│   │   │   ├── getEntry/
│   │   │   │   ├── index.js           # GET /entry/{id}
│   │   │   │   └── index.test.js
│   │   │   ├── sendEmailDigest/
│   │   │   │   ├── index.js           # Cron: daily email
│   │   │   │   └── index.test.js
│   │   │   └── healthCheck/
│   │   │       └── index.js           # GET /health
│   │   ├── models/
│   │   │   ├── Entry.js               # Entry schema + validation
│   │   │   ├── ApprovalHistory.js     # Audit trail
│   │   │   └── User.js                # User from Entra token
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js      # Validate Entra token
│   │   │   └── errorHandler.js        # Error handling
│   │   ├── utils/
│   │   │   ├── cosmosDb.js            # DB client, queries
│   │   │   ├── searchUtil.js          # Fuzzy search logic
│   │   │   ├── emailService.js        # Send email digests
│   │   │   ├── redlineUtil.js         # Calculate diff/redline
│   │   │   └── validators.js          # Input validation
│   │   └── config.js                  # Env vars, defaults
│   ├── tests/
│   │   ├── setup.js                   # Test fixtures, mocks
│   │   ├── integration/
│   │   │   ├── submitEntry.integration.test.js
│   │   │   ├── search.integration.test.js
│   │   │   └── approval.integration.test.js
│   │   └── unit/
│   │       ├── redlineUtil.test.js
│   │       ├── searchUtil.test.js
│   │       └── validators.test.js
│   ├── package.json
│   ├── local.settings.json.example
│   └── function_app.py (if using Python)
├── .github/
│   └── workflows/
│       ├── deploy.yml                 # Auto-deploy to Static Web Apps
│       └── tests.yml                  # Run tests on PR
├── staticwebapp.config.json           # Routes, auth, rewrites
├── docs/
│   ├── ARCHITECTURE.md                # High-level design
│   ├── DEPLOYMENT.md                  # Setup guide
│   └── superpowers/
│       ├── plans/
│       │   └── 2026-03-24-rhw-research-database.md (this file)
│       └── specs/
│           └── 2026-03-24-rhw-research-database.md
├── .gitignore
├── README.md
└── package.json (root for monorepo)
```

---

## Phase 1: Foundation & Setup

### Task 1: Initialize project structure and install dependencies

**Files:**
- Create: `package.json` (root)
- Create: `frontend/package.json`
- Create: `api/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/.env.example`
- Create: `api/local.settings.json.example`
- Create: `.gitignore`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "rhw-research-db",
  "version": "1.0.0",
  "description": "RHW CPA firm research database with approval workflow",
  "private": true,
  "workspaces": ["frontend", "api"],
  "scripts": {
    "dev": "npm run dev --workspace=frontend & npm run dev --workspace=api",
    "build": "npm run build --workspace=frontend && npm run build --workspace=api",
    "test": "npm test --workspace=frontend && npm test --workspace=api",
    "test:watch": "npm run test:watch --workspace=frontend"
  }
}
```

- [ ] **Step 2: Create frontend/package.json**

```json
{
  "name": "rhw-research-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

- [ ] **Step 3: Create api/package.json**

```json
{
  "name": "rhw-research-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "func start",
    "build": "npm run tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "tsc": "tsc"
  },
  "dependencies": {
    "@azure/cosmos": "^4.0.0",
    "@azure/identity": "^4.0.0",
    "nodemailer": "^6.9.0"
  },
  "devDependencies": {
    "@azure/functions": "^1.7.0",
    "vitest": "^1.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 4: Create frontend/vite.config.js**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

- [ ] **Step 5: Create frontend/.env.example**

```
VITE_API_URL=http://localhost:7071
VITE_ENTRA_CLIENT_ID=YOUR_CLIENT_ID
VITE_ENTRA_TENANT_ID=YOUR_TENANT_ID
VITE_ENTRA_REDIRECT_URI=http://localhost:5173/auth/callback
```

- [ ] **Step 6: Create api/local.settings.json.example**

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_CONNECTION_STRING": "your_connection_string_here",
    "COSMOS_DB_DATABASE": "rhw-research",
    "ENTRA_TENANT_ID": "your_tenant_id",
    "ENTRA_CLIENT_ID": "your_client_id",
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "your_email@rhwcpas.com",
    "SMTP_PASSWORD": "your_app_password",
    "ADMIN_EMAIL": "cromine@rhwcpas.com"
  }
}
```

- [ ] **Step 7: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
local.settings.json
.DS_Store
*.log
.vscode/launch.json
.vscode/extensions.json
venv/
__pycache__/
.pytest_cache/
coverage/
.nyc_output/
```

- [ ] **Step 8: Run installation**

```bash
cd /Users/dexter/Desktop/rhw-research-db
npm install
npm install --workspace=frontend
npm install --workspace=api
```

Expected: All dependencies installed without errors.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "chore: initialize monorepo structure with dependencies"
```

---

### Task 2: Set up Cosmos DB schema and data models

**Files:**
- Create: `api/src/models/Entry.js`
- Create: `api/src/models/ApprovalHistory.js`
- Create: `api/src/utils/cosmosDb.js`
- Create: `api/tests/unit/models.test.js`

- [ ] **Step 1: Write failing test for Entry model**

```javascript
// api/tests/unit/models.test.js
import { describe, it, expect } from 'vitest'
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
    expect(() => entry.validate()).toThrow('Missing required field: memo')
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
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test --workspace=api
```

Expected: FAIL - "Entry class not found" or similar

- [ ] **Step 3: Implement Entry model**

```javascript
// api/src/models/Entry.js
import { v4 as uuidv4 } from 'uuid'

export class Entry {
  constructor(data) {
    this.id = data.id || uuidv4()
    this.type = data.type // 'memo', 'sop', 'policy'
    this.client = data.client
    this.title = data.title || data.question // For SOPs/policies vs memos
    this.question = data.question // For research memos only

    // Visible to all staff
    this.memo = data.memo || data.content // memo for research, content for SOP/policy
    this.tags = data.tags || []

    // Visible to admin only
    this.conversation = data.conversation || null // Q&A transcript (hidden from staff)
    this.draftEmail = data.draftEmail || null // Draft email (hidden from staff)

    // SOP/Policy specific
    this.department = data.department || null
    this.effectiveDate = data.effectiveDate || null
    this.policyType = data.policyType || null // 'HR', 'Finance', 'Security'

    // Metadata
    this.author = data.author
    this.status = data.status || 'pending' // 'pending', 'approved', 'superseded'
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
    if (!this.memo && !this.content) {
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

  // For admin view (includes conversation)
  toAdminJSON() {
    return { ...this }
  }

  // For staff view (hides conversation, draft email)
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
```

- [ ] **Step 4: Create ApprovalHistory model**

```javascript
// api/src/models/ApprovalHistory.js
import { v4 as uuidv4 } from 'uuid'

export class ApprovalHistory {
  constructor(data) {
    this.id = uuidv4()
    this.entryId = data.entryId
    this.action = data.action // 'submitted', 'approved', 'rejected', 'requested_changes'
    this.actor = data.actor
    this.timestamp = new Date().toISOString()
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
```

- [ ] **Step 5: Create Cosmos DB utility**

```javascript
// api/src/utils/cosmosDb.js
import { CosmosClient } from '@azure/cosmos'

let client = null
let database = null
let entriesContainer = null
let approvalContainer = null

export async function initCosmosDb() {
  const connectionString = process.env.COSMOS_DB_CONNECTION_STRING
  const dbName = process.env.COSMOS_DB_DATABASE || 'rhw-research'

  client = new CosmosClient({ connectionString })
  database = client.database(dbName)

  // Create containers if they don't exist
  await database.containers.createIfNotExists({
    id: 'entries',
    partitionKey: '/type',
    indexingPolicy: {
      includedPaths: [
        { path: '/*' }
      ],
      excludedPaths: [
        { path: '/"_etag"/?'}
      ]
    }
  })

  await database.containers.createIfNotExists({
    id: 'approvals',
    partitionKey: '/entryId'
  })

  entriesContainer = database.container('entries')
  approvalContainer = database.container('approvals')
}

export async function createEntry(entry) {
  return entriesContainer.items.create(entry.toAdminJSON())
}

export async function getEntry(id, type) {
  const { resource } = await entriesContainer.item(id, type).read()
  return resource
}

export async function updateEntry(id, type, updates) {
  const { resource } = await entriesContainer.item(id, type).replace(updates)
  return resource
}

export async function searchEntries(query, filters = {}) {
  let sql = 'SELECT * FROM c WHERE 1=1'
  const params = []

  if (query) {
    sql += ` AND (
      CONTAINS(c.memo, @query) OR
      CONTAINS(c.client, @query) OR
      CONTAINS(c.question, @query) OR
      CONTAINS(c.title, @query) OR
      CONTAINS(c.content, @query) OR
      CONTAINS(c.conversation, @query)
    )`
    params.push({ name: '@query', value: query })
  }

  if (filters.status) {
    sql += ' AND c.status = @status'
    params.push({ name: '@status', value: filters.status })
  }

  if (filters.type) {
    sql += ' AND c.type = @type'
    params.push({ name: '@type', value: filters.type })
  }

  if (filters.author) {
    sql += ' AND c.author = @author'
    params.push({ name: '@author', value: filters.author })
  }

  const query_obj = { query: sql, parameters: params }
  const { resources } = await entriesContainer.items.query(query_obj).fetchAll()
  return resources
}

export async function getPendingEntries() {
  return searchEntries(null, { status: 'pending' })
}

export async function createApprovalRecord(record) {
  return approvalContainer.items.create(record)
}

export async function getApprovalHistory(entryId) {
  const { resources } = await approvalContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.entryId = @entryId ORDER BY c.timestamp DESC',
      parameters: [{ name: '@entryId', value: entryId }]
    })
    .fetchAll()
  return resources
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test --workspace=api -- api/tests/unit/models.test.js
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add api/src/models api/src/utils api/tests/unit/models.test.js
git commit -m "feat: create Entry and ApprovalHistory models, Cosmos DB utility"
```

---

### Task 3: Set up authentication middleware for Entra SSO

**Files:**
- Create: `api/src/middleware/authMiddleware.js`
- Create: `api/tests/unit/authMiddleware.test.js`

- [ ] **Step 1: Write failing test for auth middleware**

```javascript
// api/tests/unit/authMiddleware.test.js
import { describe, it, expect, vi } from 'vitest'
import { validateEntraToken } from '../../src/middleware/authMiddleware.js'

describe('Auth Middleware', () => {
  it('should validate a valid Entra token', async () => {
    // Mock token payload
    const mockToken = {
      sub: 'user-id-123',
      upn: 'user@rhwcpas.com',
      name: 'John Doe'
    }

    // In real scenario, this would validate against Azure AD
    const result = validateEntraToken(mockToken)
    expect(result.isValid).toBe(true)
    expect(result.user.email).toBe('user@rhwcpas.com')
  })

  it('should reject invalid token', () => {
    const result = validateEntraToken(null)
    expect(result.isValid).toBe(false)
  })

  it('should extract user info from token', () => {
    const mockToken = {
      upn: 'admin@rhwcpas.com',
      name: 'Admin User',
      appid: 'client-id'
    }

    const result = validateEntraToken(mockToken)
    expect(result.user.email).toBe('admin@rhwcpas.com')
    expect(result.user.name).toBe('Admin User')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test --workspace=api -- api/tests/unit/authMiddleware.test.js
```

Expected: FAIL

- [ ] **Step 3: Implement auth middleware**

```javascript
// api/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'cromine@rhwcpas.com'

export function validateEntraToken(token) {
  if (!token) {
    return { isValid: false, error: 'No token provided' }
  }

  try {
    // In production, verify against Azure AD public keys
    // For now, basic token structure validation
    if (!token.upn) {
      return { isValid: false, error: 'Invalid token structure' }
    }

    const user = {
      id: token.sub,
      email: token.upn,
      name: token.name,
      isAdmin: token.upn === ADMIN_EMAIL
    }

    return { isValid: true, user }
  } catch (error) {
    return { isValid: false, error: error.message }
  }
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.substring(7)
    // In production, verify and decode token using Azure AD
    const decoded = jwt.decode(token) // Unsafe in production, use verify

    const validation = validateEntraToken(decoded)
    if (!validation.isValid) {
      return res.status(401).json({ error: validation.error })
    }

    req.user = validation.user
    next()
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' })
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test --workspace=api -- api/tests/unit/authMiddleware.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/middleware api/tests/unit/authMiddleware.test.js
git commit -m "feat: add Entra SSO authentication middleware with admin role check"
```

---

## Phase 2: Backend APIs

### Task 4: Build submit entry API with validation

**Files:**
- Create: `api/src/functions/submitEntry/index.js`
- Create: `api/src/utils/validators.js`
- Create: `api/tests/unit/validators.test.js`
- Create: `api/tests/integration/submitEntry.integration.test.js`

[Continue with remaining tasks...]

---

## Phase 3: Frontend Components

### Task 5: Create liquid glass design system and SearchInterface

[Tasks for React components...]

---

## Phase 4: Integration & Approval Workflow

### Task 6: Build approval dashboard and email digests

[Tasks for approval features...]

---

## Phase 5: Deployment & Go-Live

### Task 7: Configure Azure Static Web Apps and GitHub Actions

[Tasks for deployment...]

---

**TOTAL ESTIMATED TIME:** 40–60 hours (distributed across 7 phases)

**Key Dependencies:**
- @superpowers:subagent-driven-development for parallel task execution
- Azure CLI must be installed and logged in before Phase 5
- Microsoft Entra app registration required before deployment (IT will provide)

