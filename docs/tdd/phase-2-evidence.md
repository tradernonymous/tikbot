# Phase 2 — Real Execution Engine Evidence & Verification

## Overview
Phase 2 upgrades the execution architecture of `tikbot` from instant no-op simulated completions to a real, safe, and testable execution engine. This includes a Postgres-backed queue adapter with `SKIP LOCKED`, atomic distributed locks, persistent kill switch polling, multi-process account safety locks, resilient SMM status polling with exponential backoff and idempotency deduplication, and a complete handler registry.

---

## Completed Tasks

### P4: Worker Handler Registry and Real Work Execution
- **Handler Registry**: Created in `src/worker.ts` with registration mechanism (`registerJobHandler`, `executeJobHandler`).
- **Core Handlers**: Registered default handlers for:
  - `farm.view` (executes `runStealthViewSession`)
  - `farm.like` (executes like action with stealth and cap validation)
  - `farm.comment` (dispatches comment text)
  - `farm.live` (dispatches live stream viewer boost)
  - `publish.upload` (invokes `ContentPublisher.publishVideo`)
  - `research.scrape` (scrapes targeted queries/hashtags)
- **Execution Lifecycle**: Manages status transitions from `PENDING` to `RUNNING`, marks `COMPLETED` on success, and increments attempts with backoff on failure.

### P5: Postgres Queue Storage Adapter & Persisted Kill Switch
- **PostgresQueueStorage**: Created in `src/queue/postgres-queue-storage.ts` using raw `WITH ... FOR UPDATE SKIP LOCKED` atomic lock acquisition to avoid race conditions across multiple worker instances.
- **Visibility Timeout & Stale Reclaim**: Automatically reclaims jobs stranded in `RUNNING` status beyond the visibility timeout (default 5 minutes), marking them `FAILED` once `maxAttempts` is reached.
- **Persisted Kill Switch**: Persisted operational kill switch state in PostgreSQL `SystemSetting` table. The worker actively checks database state before claiming and during execution, halting immediately when the kill switch is engaged via the API.

### P6: Database Action Ledger Rate Limiting & Safe Unknown Action Handling
- **Action Ledger**: Created `AccountActionLedger` Prisma model and migration `prisma/migrations/20261101000100_action_ledger/migration.sql`.
- **Restart Survival**: Hourly and daily action counts are queried directly from Postgres, surviving server restarts and worker redeployments.
- **Safe Unknown Action Handling**: Passing an invalid or unknown `ActionType` returns `{ allowed: false, reason: 'unknown action' }` instead of throwing an unhandled exception.

### P9: Idempotency Keys and Deduplication for Paid SMM Orders
- **SMMIdempotencyManager**: Created in `src/panel/smm-idempotency.ts` with SHA-256 deduplication on `(campaignId, service, link, quantity)`.
- **Double-Charge Prevention**: Subsequent order requests within the time window return the cached order result with `{ deduplicated: true }` without making duplicate external provider calls. In-flight requests return HTTP 409 conflict.

### P10: SMM Poller Refactor with In-Flight Locks & Exponential Backoff
- **Poller Architecture**: Refactored in `src/panel/smm-poller.ts` and `src/context/OperationsContext.tsx`.
- **Ref-Based In-Flight Lock**: `isPollingRef` prevents overlapping ticks.
- **Stable Dependencies**: Poller effect depends only on `killSwitchActive`, preventing interval recreation on every mutation.
- **Batching & Backoff**: Uses `Promise.allSettled` to avoid blocking on single order failures, applies exponential backoff on consecutive network errors, and emits real error telemetry to terminal logs.

### P11: Stealth Runner Proxy Routing & Chrome Path Fallbacks
- **Proxy Routing**: Accepts `proxyUrl` string or structured `proxy` object (`host`, `port`, `username`, `password`), forwarding `--proxy-server` to Puppeteer and calling `page.authenticate` for credentials.
- **Binary Fallbacks**: Resolves Chrome executable from `CHROME_BIN` or `PUPPETEER_EXECUTABLE_PATH` before defaulting to `/usr/bin/google-chrome`.
- **Debugging & Tuning**: Exposes `devtools` and `slowMo` options.

### B3 & B4: Worker Process Deployment & Queue Safety Locks
- **B3 (Procfile & Scripts)**: Updated `Procfile` (`web: npm run start`, `worker: npm run worker`) and `package.json`.
- **B4 (Queue Safety Locks)**: Implemented `QueueSafetyLockManager` in `src/queue/safety-lock.ts` ensuring single-worker execution per account and enforcing account action velocity limits before dispatch.

---

## Verification & Metrics
- **Unit Tests**: 71 test files, 326 unit tests passing.
- **Branch Coverage Gate**: **80.81%** (Meets >= 80.00% threshold).
- **TypeScript**: `npx tsc --noEmit` passes with 0 errors.
- **Build**: `next build` passes with all static and dynamic routes compiled.
