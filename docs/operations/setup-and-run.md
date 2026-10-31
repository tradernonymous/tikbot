# tikbot Operations & Deployment Manual

**Version**: 1.0.0-production  
**Target Environment**: Railway (PostgreSQL, Redis, Worker Sidecar, App Router)

---

## 1. Quick Start & Local Setup

### Prerequisites
- Node.js >= 20 (Node 22 LTS recommended)
- PostgreSQL >= 16
- Redis >= 7 (optional for single-instance, required for distributed sidecar caching)

### Installation
```bash
# Clone and install dependencies
git clone https://github.com/tradernonymous/tikbot.git
cd tikbot
npm install

# Configure environment variables
cp .env.example .env.local

# Run Prisma migrations & seed database with fixtures
npx prisma db push
npm run db:seed

# Run complete test suite with coverage enforcement
npm test
npm run test:coverage

# Build and start Next.js application
npm run build
npm run start
```

---

## 2. Environment Variables Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | - | PostgreSQL connection URL with connection pooling |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis instance for cache and distributed locking |
| `SESSION_SECRET` | Yes | - | Secret string for session HMAC signing (>= 32 chars) |
| `APP_SECRET_KEY` | Yes | - | 32-character AES-256-GCM encryption key for credentials |
| `KILL_SWITCH_ACTIVE` | No | `false` | Set to `true` or `1` for emergency zero-automation mode |
| `TIKTOK_DOWNLOAD_API_URL` | No | `http://localhost:8000` | Self-hosted TikTok/Douyin downloader endpoint |
| `TIKTOK_SIDECAR_URL` | No | `http://localhost:8080` | Python TikTok sidecar bridge URL |
| `RATE_LIMIT_STRICT` | No | `true` | Enforces hard hourly/daily compliance caps |

---

## 3. Railway Production Deployment

### Architecture on Railway
1. **App Service**: Next.js 16 standalone server running on Alpine Node.
2. **Postgres Plugin**: Managed Railway PostgreSQL 16 database.
3. **Redis Plugin**: Managed Railway Redis instance.
4. **Python Sidecar**: Containerized Python service running `sidecars/tiktok-py/app.py`.

### Deploy Steps
1. Connect GitHub repository `tradernonymous/tikbot` in Railway dashboard.
2. Railway detects `railway.json` and multi-stage `Dockerfile`.
3. Link Railway PostgreSQL service to provide `DATABASE_URL`.
4. Configure `APP_SECRET_KEY` and `SESSION_SECRET` in service environment variables.
5. Deploy triggers automatic Prisma client generation, typechecking, and build.

---

## 4. Operational Runbook & Emergency Procedures

### Engaging Emergency Kill Switch
To immediately freeze all background jobs, browser automation, and engagement campaigns:

**Via UI**:
Click the **Kill Switch** toggle in the top navigation bar of the dashboard.

**Via API**:
```bash
curl -X POST https://your-railway-app.up.railway.app/api/v1/system/kill-switch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <OPERATOR_SESSION_TOKEN>" \
  -d '{"active": true, "reason": "Immediate security audit requested"}'
```

**Via Environment Override**:
Set `KILL_SWITCH_ACTIVE=true` in Railway and redeploy.

---

## 5. Security & Compliance Checklist
- [x] Zero plain-text credentials stored: all cookies, tokens, and proxy URLs encrypted with AES-256-GCM.
- [x] Single-operator scrypt password authentication with timing-safe comparisons.
- [x] Hard rate limiting preventing farm node detection and bans.
- [x] Mandatory manual approval gate for 100% of engagement campaigns and publishing runs.
- [x] Automatic log redaction masking sensitive fields in all application traces.
