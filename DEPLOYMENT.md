# RHW Research Portal — IT Deployment Guide

This document covers installing and running the RHW Research Portal on the Azure VM.
The portal has two components that share one Azure Postgres database:

| Component | Description |
|-----------|-------------|
| **rhw-research-db** | The web app (this repo) — Next.js, port 3000 |
| **rhw-knowledge-search** | The file-server crawler — indexes P:\Data into the database |

---

## Security Model

**No login is required.** The portal is designed for internal use only and relies on network-level security:

- The app runs on the internal server and is only accessible from inside the office network (or VPN).
- The Azure VM's network security group (firewall) blocks all external traffic on port 3000/80/443.
- No Azure AD / SSO integration is needed.

AI Research queries are rate-limited by IP address — 20 queries per IP per day.

---

## Prerequisites

- Windows Server 2019+ or Windows 10/11
- Node.js 20 LTS — https://nodejs.org/en/download
- PM2 (process manager): `npm install -g pm2`
- Access to the Azure Postgres instance (see IT ticket)

---

## 1. Database Setup

Run this **once** against the Azure Postgres instance to create all tables:

```bash
psql "host=rhw-research.postgres.database.azure.com dbname=rhw_research user=rhwadmin password=<PASSWORD> sslmode=require" -f scripts/setup-db.sql
```

This creates: `rate_limits`, `audit_log`, `files` (+ pgvector extension).

> **Note:** Azure Database for PostgreSQL Flexible Server includes the `vector` extension by default. If you get an error about the extension, enable it in the Azure Portal under the server's Extensions blade.

---

## 2. Environment Variables

Create a file named `.env.local` in the project root (copy from `.env.example`):

```
DATABASE_URL=postgresql://rhwadmin:<PASSWORD>@rhw-research.postgres.database.azure.com/rhw_research?sslmode=require

ANTHROPIC_API_KEY=<from console.anthropic.com>
OPENAI_API_KEY=<from platform.openai.com>
```

> **Security:** `.env.local` is git-ignored. Never commit it. Set these as System Environment Variables on the VM if preferred — Next.js reads both.

---

## 3. Install & Build

```bash
cd C:\path\to\rhw-research-db
npm install
npm run build
```

Build output goes to `.next/`. This step only needs to be re-run when the app code changes.

---

## 4. Start with PM2

```bash
# Start the app
pm2 start npm --name "rhw-research" -- start

# Save the process list so it restarts on VM reboot
pm2 save
pm2 startup
```

The app runs on **port 3000** by default.

To use a different port:
```bash
pm2 start npm --name "rhw-research" -- start -- --port 8080
```

### Useful PM2 commands

```bash
pm2 status              # View running processes
pm2 logs rhw-research   # Live logs
pm2 restart rhw-research
pm2 stop rhw-research
```

---

## 5. Reverse Proxy (IIS or nginx)

The app runs on port 3000. Expose it on port 80/443 via a reverse proxy.

### IIS (with URL Rewrite + ARR + Windows Authentication)

Install **Application Request Routing** and **URL Rewrite** modules, then configure in IIS Manager:

1. **Authentication**: Disable Anonymous, enable **Windows Authentication**
2. Add to `web.config`:

```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="RHW Research" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
          <serverVariables>
            <set name="HTTP_REMOTE_USER" value="{REMOTE_USER}" />
          </serverVariables>
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

This passes the Windows domain username (e.g., `RHWCPAS\jsmith`) to the backend app, which uses it for rate limiting and audit logs instead of IP address. The app seamlessly falls back to IP address if the header is missing (e.g., for API-only calls or when IIS auth is disabled).

### nginx (if installed)

```nginx
server {
    listen 80;
    server_name rhw-research.yourdomain.com;

    # If using Windows auth at the nginx level (via SSPI/GSSAPI module),
    # forward the authenticated user to the backend:
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header Remote-User $remote_user;  # Pass auth username if available
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. File Server Crawler

The crawler indexes P:\Data into the shared Postgres database. Run it on the **same VM** that has access to the P: drive.

```bash
cd C:\path\to\rhw-knowledge-search

# Set the same DATABASE_URL as the web app:
# (Edit .env.local in the crawler project)
DATABASE_URL=postgresql://rhwadmin:<PASSWORD>@rhw-research.postgres.database.azure.com/rhw_research?sslmode=require
OPENAI_API_KEY=<same key as web app>

# First run: initialize the files table (safe to run again — uses IF NOT EXISTS)
npm run setup-db

# Index P:\Data (takes time on first run — ~1.5 TB)
npm run crawl:full
```

After the first full crawl, document search in the portal is live automatically.

### Schedule recurring crawls

To keep the index fresh, schedule the crawler via Windows Task Scheduler:

1. **Task Scheduler** → **Create Basic Task**
2. Name: `RHW Knowledge Crawl`
3. Trigger: Daily at 2:00 AM (or weekly — crawls are incremental)
4. Action: Start a program
   - Program: `node`
   - Arguments: `crawler/index.js --path "P:\Data"`
   - Start in: `C:\path\to\rhw-knowledge-search`

The crawler uses SHA-256 change detection — only new/modified files are re-indexed.

---

## 7. Updating the App

When a new version is deployed:

```bash
cd C:\path\to\rhw-research-db
git pull
npm install
npm run build
pm2 restart rhw-research
```

Database migrations (if any) will be noted in the release notes with SQL to run.

---

## 8. Admin Features

- **Audit log:** The `audit_log` table in Postgres records either the Windows domain username (if IIS auth is enabled) or client IP address, along with the question, model, and timestamp for every AI Research query.
  - **Without IIS Windows Auth:** Queries are traceable to workstation IP only (e.g., `192.168.1.45`).
  - **With IIS Windows Auth:** Queries show the domain user (e.g., `RHWCPAS\jsmith`), answering "who searched for what" directly.
- **Daily AI query limit:** 20 queries per user (or IP) per day — change `DAILY_LIMIT` in `app/api/research/route.ts` and rebuild. The limit is enforced per domain user if IIS auth is on, per IP if off.

### Optional: Per-User Audit Trail via IIS Windows Authentication

If you need logs showing *which employee* ran each query (e.g., for compliance), enable Windows Authentication in IIS — **no app code changes, no login page, no password prompt**. Each employee's existing Windows domain login is passed automatically by the browser.

To enable:
1. In IIS Manager → site → **Authentication** → disable Anonymous, enable **Windows Authentication**.
2. Update `web.config` with the `<serverVariables>` block shown in § Reverse Proxy above.
3. Immediately, the app will:
   - Show domain usernames in `audit_log` instead of IPs
   - Enforce rate limits per user instead of per IP
   - Use domain user for all audit trails and activity tracking
4. No rebuild required — the app detects the `REMOTE_USER` header automatically.

This is the recommended approach if your compliance requirements call for named audit records.

---

## 9. Troubleshooting

| Symptom | Check |
|---------|-------|
| Page won't load | Check `pm2 status` and `pm2 logs rhw-research`. Ensure port 3000 is reachable from the client machine. |
| "Database connection failed" in logs | `DATABASE_URL` wrong, or Azure Postgres firewall blocking the VM's IP. Add VM IP under Azure Postgres → Networking → Firewall rules. |
| Document search shows no results | Crawler hasn't run yet, or `DATABASE_URL` in crawler doesn't match the web app. |
| AI Research returns errors | `ANTHROPIC_API_KEY` missing or expired. |
| Embeddings fail during search | `OPENAI_API_KEY` missing or rate-limited. |
| "Daily limit reached" error | IP has hit 20 AI Research queries today. Resets at midnight UTC. Increase `DAILY_LIMIT` if needed. |

---

## Support

For application issues, contact the developer.
For Azure / infrastructure issues, contact IT.
