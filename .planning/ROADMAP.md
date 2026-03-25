# RHW Research Database — Project Roadmap

**Project:** RHW Research & Knowledge Base
**Goal:** Firm-wide searchable research database with approval workflow, privacy controls, and M365 SSO
**Stack:** React 19 + Vite, Azure Functions, Cosmos DB, Microsoft Entra
**Design:** Liquid glass dark theme (CSS-only)

---

## Progress

| Phase | Status | Plans | Completion |
|-------|--------|-------|------------|
| 1 | ✓ Complete | 2 | 2026-03-24 |
| 2 | ✓ Complete | 2 | 2026-03-24 |
| 3 | ✓ Complete | 4 | 2026-03-24 |
| 4 | ○ Pending | 2 | — |
| 5 | ○ Pending | 1 | — |

---

## Phase 1: Foundation & Setup ✓

**Completed 2026-03-24**

### Plans
- **1-01:** Project structure & dependencies
- **1-02:** Cosmos DB schema & models

**What it delivered:**
- Monorepo initialized (frontend, api workspaces)
- Entry and ApprovalHistory Cosmos DB models
- Entra SSO auth middleware
- Liquid glass CSS system
- 40+ tests passing

---

## Phase 2: Backend APIs ✓

**Completed 2026-03-24**

### Plans
- **2-01:** API endpoints (search, getEntry, submitEntry, approveEntry, health)
- **2-02:** Email digest service & testing

**What it delivered:**
- 5 core backend API functions fully implemented
- Parameterized search with visibility rules
- Email digest service (Nodemailer)
- Approval workflow (approve/reject/request_changes)
- 40+ tests, production-ready code

---

## Phase 3: Frontend Components

**Status: Ready to execute**

### Plans
- **3-01:** SearchInterface component + liquid glass design
- **3-02:** SubmissionForm component for data entry
- **3-03:** ApprovalDashboard for admin workflows
- **3-04:** EntryViewer + RedlineEditor for viewing & editing

**Must-haves:**
- Search UI with filters and pagination
- Submit form with validation
- Approval dashboard with entry list
- Entry viewer with diff/redline tracking
- Integration with backend APIs
- E2E tests for all workflows

---

## Phase 4: Integration & Approval Workflow

**Status: Pending**

### Plans
- **4-01:** Integrate frontend components with backend
- **4-02:** Complete approval workflow E2E

---

## Phase 5: Deployment & Go-Live

**Status: Pending**

### Plans
- **5-01:** Azure Static Web Apps + GitHub Actions deployment

---

## Key Dates

- **Phase 1-2 Complete:** 2026-03-24
- **Phase 3 Target:** 2026-03-25 to 2026-03-27
- **Phase 4-5 Target:** 2026-03-28 onward
