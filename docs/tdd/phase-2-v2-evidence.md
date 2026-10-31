# Phase 2 Persistence for Research & Metrics Evidence Document

## Baseline & Verification
- **Baseline Commit**: `ec9d8ad4`
- **TypeScript Check**: `npx tsc --noEmit` passed cleanly (0 errors).
- **Test Suite**: 105 test files passed (451 tests passed).
- **Branch Coverage**: `81.67%` (exceeds global `80%` gate).
- **Build Verification**: `next build` (Next.js 16.4.3 Turbopack standalone) passed cleanly.

---

## Tasks & Commits

### R2.1 — Research, Metric, and Intelligence Prisma Models & Migration
- **Commit**: `8936fcd3` (`feat(research): add Research, Metric, and Intelligence Prisma models and migration (R2.1)`)
- **TDD Test**: `src/repositories/__tests__/research-models.test.ts` (6 tests)
- **Changes**:
  - Added Prisma models: `ResearchPost`, `PostSnapshot`, `Creator`, `Watchlist`, `WatchlistTarget`, `TrendSignal`, `Sound`, `Hook`, `ContentPlan`, `MetricSample`.
  - Enforced unique constraints: `@@unique([platform, platformPostId])`, `@@unique([platform, handle])`, `@@unique([type, signalKey, region])`, `@@unique([platform, platformSoundId])`.
  - Enforced indexes on `(targetType, targetId, timestamp)`, `(postId, capturedAt)`, `(outlierScore)`.
  - Generated database migration `prisma/migrations/20261101000300_research_and_metrics/migration.sql`.

### R2.2 — Repositories, Zod Schemas, & REST Endpoints with Cursor Pagination
- **Commit**: `672ea89f` (`feat(research): implement repositories, zod schemas, and REST endpoints with cursor pagination (R2.2)`)
- **TDD Tests**:
  - `src/app/api/v1/research/posts/__tests__/route.test.ts` (5 tests)
  - `src/app/api/v1/metrics/series/__tests__/route.test.ts` (3 tests)
- **Changes**:
  - Built `src/repositories/research.schemas.ts` with Zod validation for query and mutation inputs.
  - Built `src/repositories/research-posts.repository.ts`, `creators.repository.ts`, and `metric-samples.repository.ts`.
  - Implemented `GET /api/v1/research/posts` with cursor-based pagination and filtering by `minOutlierScore`, `authorHandle`, and sorting (`outlier`, `recent`, `views`).
  - Implemented `POST /api/v1/research/posts` for post upsert.
  - Implemented `GET /api/v1/metrics/series` for historical metric series queries.
  - Guarded all routes with `requireSession()`.

### R2.3 — Server Persistence for Video Analysis
- **Commit**: `d64b6738` (`feat(research): persist video analysis to ResearchPost and query server posts on reload (R2.3)`)
- **TDD Test**: `src/app/api/v1/research/analyze/__tests__/route.test.ts`
- **Changes**:
  - Wired `POST /api/v1/research/analyze` to call `upsertResearchPost()`, automatically storing the post and creating its initial `PostSnapshot` in PostgreSQL.
  - Updated `src/app/dashboard/research/page.tsx` to fetch posts from `/api/v1/research/posts` on mount and after analysis, ensuring analysis results persist across reloads and device changes.

### R2.4 & R2.5 — `research.watch` & `metrics.collect` Worker Handlers
- **Commit**: `b0a1f044` (`feat(worker): implement research.watch and metrics.collect job handlers (R2.4, R2.5)`)
- **TDD Test**: `src/__tests__/research-watch-and-metrics-jobs.test.ts` (3 tests)
- **Changes**:
  - Registered `research.watch` handler in `src/worker.ts` to ingest creator posts, upsert `Creator` and `ResearchPost`, and capture `PostSnapshot` idempotently.
  - Registered `metrics.collect` handler in `src/worker.ts` to record timestamped `MetricSample` rows for both research posts and publish jobs.

### R2.6 — Outlier Scoring with Median, MAD, and Baseline Confidence
- **Commit**: `5607b4f8` (`feat(intelligence): implement outlier scoring with median, MAD, and confidence (R2.6)`)
- **TDD Test**: `src/intelligence/__tests__/outliers.test.ts`
- **Changes**:
  - Implemented `calculateMAD()` (Median Absolute Deviation) in `src/intelligence/outliers.ts`.
  - Implemented `scoreOutlierAgainstBaseline()` requiring $\ge N$ sample size (default 5) before marking an outlier, computing reproducible scores and confidence fields.

### R2.7 — Legacy Research Import & Client Mock Post Removal
- **Commit**: `e3c26ad9` (`feat(repositories): implement legacy research import to database and remove client mock post initialization (R2.7)`)
- **TDD Tests**:
  - `src/repositories/__tests__/legacy-import.test.ts` (2 tests)
  - `src/repositories/__tests__/research-repositories.test.ts` (11 tests)
- **Changes**:
  - Implemented `importLegacyPostsToDatabase()` and `isLegacyDataImported()` using `SystemSetting` key `LEGACY_RESEARCH_POSTS_IMPORTED`.
  - Cleaned up `OperationsContext.tsx` by setting initial `researchedPosts` state to empty `[]`, deleting the hardcoded fixture mock array.

---

## Quality Gate Summary
- **Test Suites**: 105 / 105 passed (451 / 451 total tests).
- **Line Coverage**: `92.92%`
- **Branch Coverage**: `81.67%` (Threshold $\ge 80\%$)
- **Function Coverage**: `94.56%`
- **Statement Coverage**: `94.79%`
- **Next.js Production Build**: `Passed` (Turbopack standalone build, all routes compiled).
