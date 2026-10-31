# Phase 1 — Real Persistence Evidence & Verification

## Overview
Phase 1 upgrades the persistence architecture of `tikbot` from volatile and lossy client-side `localStorage` to real Postgres-backed server persistence using Prisma, safe container migrations, real health probes, and complete repository patterns.

---

## Completed Tasks

### P1: Singleton Prisma Client, Migration System, and Container Entrypoint
- **Prisma Client**: Initialized singleton in `src/lib/prisma.ts` with development global caching and production pooling.
- **Prisma Migration**: Created initial migration `prisma/migrations/20261101000000_init/migration.sql` with full schema (`User`, `SystemSetting`, `PlatformAccount`, `Proxy`, `MediaAsset`, `Job`, `AuditLog`, `Approval`, `Campaign`, `CampaignAction`, `PublishJob`).
- **Container Entrypoint**: Created `docker-entrypoint.sh` executing `prisma migrate deploy` prior to Next.js server launch. Added `"db:migrate": "prisma migrate deploy"` to `package.json` and updated `Dockerfile`.

### P2: Real Database & Worker Readiness Probes
- **Probe Implementation**: Replaced hardcoded `checkDatabase: async () => true` in `src/app/api/health/readiness/route.ts` and `src/health/index.ts` with real `SELECT 1` queries, real queue depth checks, and worker heartbeat monitors.
- **Fail-safe**: Returns HTTP 503 when the database or critical sub-systems fail. Verified in `src/app/api/health/readiness/__tests__/route.test.ts`.

### P3: Repository Layer, Route Handlers, and Deletion of localStorage State Blob
- **Repositories**:
  - `src/repositories/accounts.repository.ts` & unit tests
  - `src/repositories/proxies.repository.ts` & unit tests
  - `src/repositories/campaigns.repository.ts` & unit tests
  - `src/repositories/audit-logs.repository.ts` & unit tests
  - `src/repositories/publish-jobs.repository.ts` & unit tests
- **API Route Handlers**:
  - `/api/v1/accounts` (GET, POST, DELETE)
  - `/api/v1/proxies` (GET, POST, DELETE)
  - `/api/v1/campaigns` (GET, POST, DELETE)
  - `/api/v1/audit-logs` (GET, POST)
  - `/api/v1/publishing/jobs` (GET, POST)
- **Elimination of localStorage State Blob**:
  - Removed `TIKBOT_OPERATIONS_STATE_v1` persistence and loading.
  - Implemented one-time `localStorage.removeItem('TIKBOT_OPERATIONS_STATE_v1')`.
  - Implemented server-side initial data hydration with empty-database fallback without resurrecting fixtures.
  - Verified reload preserves deletes and multi-tab synchronization in `src/__tests__/persistence-p3.test.ts`.

---

## Verification & Metrics
- **Unit Tests**: 64 test files, 271 unit tests passing.
- **Branch Coverage Gate**: 80.34% (Exceeds global 80.00% requirement).
- **TypeScript**: `npx tsc --noEmit` passes with 0 errors.
- **Build**: `next build` passes with 13/13 static/dynamic routes.
