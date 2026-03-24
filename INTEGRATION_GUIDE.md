# Data Ingestion Integration Guide

This guide walks you through testing the data-ingestion pipeline with the main RHW Research Database app.

---

## Overview

**Two repos working together:**

1. **Main app** (`/Users/dexter/Desktop/rhw-research-db/`)
   - Frontend: React search + submission UI
   - Backend: Azure Functions API
   - Database: Cosmos DB
   - Endpoint: `POST http://localhost:7071/api/submitEntry`

2. **Data ingestion** (`/Users/dexter/Desktop/rhw-research-data-ingestion/`)
   - Meeting extractor: transcribe Zoom → extract SOP
   - Web scraper: scrape web → extract Q&A
   - Both POST to the main API

---

## Setup

### Step 1: Configure Main API

```bash
cd /Users/dexter/Desktop/rhw-research-db

# Copy env template if needed
cp api/local.settings.json.example api/local.settings.json

# Edit api/local.settings.json and add your credentials:
# - COSMOS_ENDPOINT, COSMOS_KEY (from Azure)
# - ANTHROPIC_API_KEY (from Claude console)
# - INGEST_API_KEY: generate a unique key, e.g. "rhw_ingest_key_abc123xyz"
```

### Step 2: Start Main API

```bash
cd /Users/dexter/Desktop/rhw-research-db

# Install dependencies (if not already done)
npm install

# Start API in development mode
npm run dev --workspace=api

# Should see: "Listening on port 7071"
```

### Step 3: Configure Data Ingestion

```bash
cd /Users/dexter/Desktop/rhw-research-data-ingestion

# Copy env template
cp .env.example .env.local

# Edit .env.local with:
API_KEY=rhw_ingest_key_abc123xyz  # Must match INGEST_API_KEY in main API
API_BASE_URL=http://localhost:7071/api
ANTHROPIC_API_KEY=sk-ant-...      # Your Claude API key
OPENAI_API_KEY=sk-...              # (Optional, for cloud Whisper)
```

---

## Integration Tests

### Test 1: API Health Check

```bash
# Verify main API is running
curl http://localhost:7071/api/health

# Expected: HTTP 200 with { status: "ok" }
```

### Test 2: Manual Entry Submission

```bash
curl -X POST http://localhost:7071/api/submitEntry \
  -H "Authorization: Bearer rhw_ingest_key_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "memo",
    "client": "Test Company",
    "question": "How to reduce business taxes?",
    "memo": "Consider forming an S-corp, tracking deductions, quarterly payments...",
    "tags": ["tax-strategy", "test"],
    "author": "system@rhwcpas.com",
    "status": "pending"
  }'

# Expected: HTTP 201 with { id: "...", status: "pending" }
```

### Test 3: Web Scraper (Limited)

```bash
cd /Users/dexter/Desktop/rhw-research-data-ingestion

# Test with just 1 query (takes ~30 seconds)
node web-scraper.js --limit 1

# Watch output for:
# ✓ Created Q&A entries
# ⊘ Skipped duplicates
# ✗ Any errors
```

### Test 4: Meeting Extractor (Optional)

Requires a Zoom recording. If you have one:

```bash
cd /Users/dexter/Desktop/rhw-research-data-ingestion

# First run downloads Whisper model (~1.5GB, takes 5-10 minutes)
node meeting-extractor.js --file ./sample-meeting.mp4 --tags "training"

# Subsequent runs are faster (model cached locally)
```

---

## Verification Checklist

After running the scripts:

- [ ] **Main API** shows no errors in logs
- [ ] **Submitted entries** appear in Cosmos DB (check via Azure Portal or API call)
- [ ] **Web scraper** created at least 1 Q&A entry
- [ ] **Duplicate detection** skipped at least 1 duplicate (or shows "0 duplicates" if all unique)
- [ ] **Entry structure** includes:
  - [ ] `type`: "memo" or "sop"
  - [ ] `client`: source identifier
  - [ ] `memo`: visible content
  - [ ] `conversation`: hidden from staff
  - [ ] `tags`: relevant keywords
  - [ ] `status`: "pending"

---

## Common Issues

### "INGEST_API_KEY not configured"

**Fix:** Add `"INGEST_API_KEY": "..."` to `api/local.settings.json` Values

### "Invalid API key"

**Fix:** Ensure both repos use the SAME key:
- Main API: `api/local.settings.json` → `"INGEST_API_KEY"`
- Data ingestion: `.env.local` → `API_KEY=...`

### "Cannot connect to API"

**Fix:** Verify main API is running:
```bash
curl http://localhost:7071/api/health
```

If it fails, restart the API:
```bash
npm run dev --workspace=api
```

### "Cosmos DB connection failed"

**Fix:** Check credentials in `api/local.settings.json`:
- `COSMOS_ENDPOINT`: format `https://<account>.documents.azure.com:443/`
- `COSMOS_KEY`: primary key from Azure Portal

### "Whisper model not found"

**Fix:** First run downloads ~1.5GB. Be patient (5-10 minutes).

If it fails, ensure you have:
- 2GB free disk space
- Working internet connection
- `OPENAI_API_KEY` set in `.env.local` (for cloud fallback)

---

## Next Steps

### Phase 6: Frontend Integration

Build the React components that display and manage entries:
- SearchInterface.jsx
- SubmissionForm.jsx
- ApprovalDashboard.jsx
- EntryViewer.jsx

### Phase 7: Production Deployment

Deploy to:
- Frontend: Vercel (or Azure Static Web Apps)
- API: Azure Functions
- Database: Cosmos DB (already in Azure)

### Phase 8: Advanced Features

- [ ] Scheduled web scraper (cron job)
- [ ] Real-time approval notifications
- [ ] PDF document import
- [ ] CRM integration for client questions
- [ ] Batch meeting processing

---

## Support

**Troubleshooting:**
1. Check API logs: `npm run dev --workspace=api` (watch console output)
2. Check data-ingestion logs: watch script console output
3. Verify credentials in both repos
4. Check Cosmos DB via Azure Portal

**Questions?** Reach out to Chea Romine (cromine@rhwcpas.com)
