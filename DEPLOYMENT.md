# RHW Research Portal — IT Deployment Guide

This document covers installing and running the RHW Research Portal on the Azure VM.
The portal has two components that share one Azure Postgres database:

| Component | Description |
|-----------|-------------|
| **rhw-research-db** | The web app (this repo) — Next.js, port 3000 |
| **rhw-knowledge-search** | The file-server crawler — indexes P:\Data into the database |

---

## Prerequisites

- Windows Server 2019+ or Windows 10/11
- Node.js 20 LTS — https://nodejs.org/en/download
- PM2 (process manager): `npm install -g pm2`
- Access to the Azure Postgres instance (see IT ticket)
- Azure AD App Registration (see section below)

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
AUTH_SECRET=<generate with: openssl rand -base64 32>

AZURE_AD_CLIENT_ID=83159ec2-b03e-415f-bf65-5fa7376190fb
AZURE_AD_TENANT_ID=22913123-1e6a-4c00-b1fd-779c28d3a076
AZURE_AD_CLIENT_SECRET=<from Azure Portal → App Registration → Certificates & Secrets>

DATABASE_URL=postgresql://rhwadmin:<PASSWORD>@rhw-research.postgres.database.azure.com/rhw_research?sslmode=require

ANTHROPIC_API_KEY=<from console.anthropic.com>
OPENAI_API_KEY=<from platform.openai.com>

ADMIN_EMAILS=cromine@rhwcpas.com

NEXTAUTH_URL=https://<your-internal-hostname-or-IP>
```

> **Security:** `.env.local` is git-ignored. Never commit it. Set these as System Environment Variables on the VM if preferred — Next.js reads both.

---

## 3. Azure AD App Registration

This allows staff to sign in with their RHW Microsoft accounts.

1. Azure Portal → **Azure Active Directory** → **App registrations** → **New registration**
2. Name: `RHW Research Portal`
3. Supported account types: **Accounts in this organizational directory only**
4. Redirect URI (Web): `https://<your-hostname>/api/auth/callback/microsoft-entra-id`
5. Click **Register**
6. Copy the **Application (client) ID** → `AZURE_AD_CLIENT_ID`
7. Copy the **Directory (tenant) ID** → `AZURE_AD_TENANT_ID`
8. Go to **Certificates & secrets** → **New client secret** → Copy value → `AZURE_AD_CLIENT_SECRET`
9. Go to **API permissions** → verify **Microsoft Graph → User.Read** is present (it is by default)

---

## 4. Install & Build

```bash
cd C:\path\to\rhw-research-db
npm install
npm run build
```

Build output goes to `.next/`. This step only needs to be re-run when the app code changes.

---

## 5. Start with PM2

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

## 6. Reverse Proxy (IIS or nginx)

The app runs on port 3000. Expose it on port 80/443 via a reverse proxy.

### IIS (with URL Rewrite + ARR)

Install **Application Request Routing** and **URL Rewrite** modules, then add to `web.config`:

```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="RHW Research" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### nginx (if installed)

```nginx
server {
    listen 80;
    server_name rhw-research.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. File Server Crawler

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

## 8. Updating the App

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

## 9. Admin Features

- **Audit log:** `GET https://<hostname>/api/research?audit=1` (admin accounts only)
- **Admin accounts:** Set `ADMIN_EMAILS=email1@rhwcpas.com,email2@rhwcpas.com` in `.env.local`
- **Daily AI query limit:** 20 queries/user/day — change `DAILY_LIMIT` in `app/api/research/route.ts` and rebuild

---

## 10. Troubleshooting

| Symptom | Check |
|---------|-------|
| Sign-in fails with "Configuration" error | `AZURE_AD_CLIENT_SECRET` expired or wrong. Regenerate in Azure Portal. |
| Sign-in fails with "AccessDenied" | User's Microsoft account is not in the RHW Azure AD tenant. |
| "Database connection failed" in logs | `DATABASE_URL` wrong, or Azure Postgres firewall blocking the VM's IP. Add VM IP under Azure Postgres → Networking → Firewall rules. |
| Document search shows no results | Crawler hasn't run yet, or `DATABASE_URL` in crawler doesn't match the web app. |
| AI Research returns errors | `ANTHROPIC_API_KEY` missing or expired. |
| Embeddings fail during search | `OPENAI_API_KEY` missing or rate-limited. |

---

## Support

For application issues, contact the developer.
For Azure / infrastructure issues, contact IT.
