# Railway Environment Matrix & Deployment Topology

This document specifies the exact configuration, environment variables, and compute allocations across all services deployed within the Railway project VPC.

---

## 1. Services Topology & Sizing

| Service Name | Runtime | Compute Target | Memory Target | Network | Purpose |
|---|---|---|---|---|---|
| `tikbot-web` | Node.js 22 (Next.js 15) | 1 vCPU | 1024 MB | Public HTTPS (Port 3000) | Dashboard UI, Server Actions, REST API |
| `tikbot-worker` | Node.js 22 + Playwright | 2 vCPU | 2048 – 4096 MB | Private Network Only | Queue worker, browser automation, downloader |
| `tikbot-sidecar-py` | Python 3.12 (FastAPI) | 1 vCPU | 1024 MB | Private Network (`:8000`) | Unofficial TikTok API & audio signing |
| `postgres` | PostgreSQL 16 | Managed | 1024 MB | Private Network (`:5432`) | Primary relational database |
| `redis` | Redis 7 | Managed | 512 MB | Private Network (`:6379`) | Fast caching, pubsub queue wakeups |

---

## 2. Environment Variable Matrix

### 2.1 Core Application (`tikbot-web` & `tikbot-worker`)
| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | Yes | Node environment | `production` |
| `DATABASE_URL` | Yes | Postgres connection string with connection pool params | `postgresql://postgres:pass@postgres.railway.internal:5432/railway?pgbouncer=true` |
| `REDIS_URL` | Yes | Redis connection string | `redis://default:pass@redis.railway.internal:6379` |
| `MASTER_ENCRYPTION_KEY` | Yes | 32-byte hex string (64 characters) for AES-256-GCM | `a1b2c3d4...64chars` |
| `OPERATOR_PASSWORD_HASH` | Yes | Argon2id / bcrypt hash of single-operator password | `$2a$12$...` |
| `SESSION_SECRET` | Yes | 32+ character secret for signing session cookies | `super-secure-random-jwt-secret-string-here` |
| `STORAGE_DRIVER` | Yes | Storage adapter (`local` or `s3`) | `s3` |
| `S3_ENDPOINT` | Conditional | S3/Cloudflare R2 endpoint URL | `https://<accountid>.r2.cloudflarestorage.com` |
| `S3_REGION` | Conditional | AWS / R2 region | `auto` |
| `S3_BUCKET` | Conditional | Storage bucket name | `tikbot-media` |
| `S3_ACCESS_KEY_ID` | Conditional | S3 access key | `AKIA...` |
| `S3_SECRET_ACCESS_KEY` | Conditional | S3 secret key | `wJalr...` |
| `INTERNAL_API_SECRET` | Yes | Shared secret for sidecar and worker auth | `internal-secret-token` |
| `PYTHON_SIDECAR_URL` | Yes | Internal URL of Python sidecar | `http://tikbot-sidecar-py.railway.internal:8000` |
| `KILL_SWITCH_ACTIVE` | No | Hardware emergency stop toggle (`true`/`false`) | `false` |
| `WORKER_CONCURRENCY` | No | Concurrent queue slots per worker | `3` |

### 2.2 Python Sidecar (`tikbot-sidecar-py`)
| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Internal HTTP listening port (defaults to `8000`) |
| `INTERNAL_API_SECRET` | Yes | Must match `INTERNAL_API_SECRET` of core application |
| `PLAYWRIGHT_HEADLESS` | No | Force headless mode (`true`/`false`, default `true`) |

---

## 3. Healthcheck & Liveness Configurations

- **`tikbot-web`**:
  - Healthcheck Path: `/api/health`
  - Success Code: `200`
  - Timeout: 5s
- **`tikbot-worker`**:
  - Heartbeat timestamp written to Redis key `worker:heartbeat:<hostname>` every 15s.
  - Monitored by web healthcheck endpoint `/api/health/readiness`.
- **`tikbot-sidecar-py`**:
  - Healthcheck Path: `/healthz`
  - Success Code: `200`
