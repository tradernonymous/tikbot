# Phase 1 Navigation + Notification Spine Evidence Document

## Baseline & Verification
- **Baseline Commit**: `6deffa5a`
- **TypeScript Check**: `npx tsc --noEmit` passed cleanly (0 errors).
- **Test Suite**: 99 test files passed (423 tests passed).
- **Branch Coverage**: `81.87%` (exceeds global `80%` gate).
- **Build Verification**: `next build` (Next.js 16.4.3 Turbopack standalone) passed cleanly with 0 errors.

---

## Tasks & Commits

### F1.1 — Notification Model & Database Migration
- **Commit**: `2da58503` (`feat(notifications): add Notification Prisma model and migration (F1.1)`)
- **TDD Test**: `src/repositories/__tests__/notification-model.test.ts`
- **Changes**:
  - Added `Notification` model to `prisma/schema.prisma` with `id, type, severity, title, body, href, entityType, entityId, dedupeKey, readAt, createdAt`.
  - Added indexes on `(readAt, createdAt)` and `dedupeKey`.
  - Generated migration `prisma/migrations/20261101000200_notification/migration.sql`.

### F1.2 — NotificationService with Collapsing Dedupe Window
- **Commit**: `132d82c2` (`feat(notifications): implement NotificationService with deduplication and event wiring (F1.2)`)
- **TDD Test**: `src/notifications/__tests__/service.test.ts` (12 tests)
- **Changes**:
  - Implemented `NotificationService` with a 5-minute dedupe sliding window on duplicate `dedupeKey`.
  - Wired into campaign approve/reject (`/api/v1/campaigns`), emergency kill switch (`/api/v1/system/kill-switch`), worker task failure (`src/worker.ts`), and publish job completions.

### F1.3 — Notification REST Endpoints, Counts, & Pagination
- **Commit**: `1e72ef75` (`feat(notifications): implement notification REST endpoints, counts, and pagination (F1.3)`)
- **TDD Test**: `src/app/api/v1/notifications/__tests__/routes.test.ts` (9 tests)
- **Changes**:
  - Implemented `GET /api/v1/notifications?filter&cursor&limit` with cursor pagination.
  - Implemented `GET /api/v1/notifications/counts` returning unread counts by area (`total`, `approvals`, `incidents`, `research`, `system`).
  - Implemented `POST /api/v1/notifications/[id]/read` and `POST /api/v1/notifications/read-all`.
  - Protected with session verification via `requireSession()`.

### F1.4 — Notification Center Panel with Area Tabs & Deep-Linking
- **Commit**: `326ac729` (`feat(notifications): implement NotificationCenter with area tabs and deep linking (F1.4)`)
- **TDD Test**: `src/components/__tests__/NotificationCenter.test.tsx` (2 tests)
- **Changes**:
  - Built `NotificationCenter` right panel with tabs (All / Approvals / Incidents / Research / System).
  - Unread badge with `aria-live="polite"`.
  - Each item supports deep link `notif.href` (e.g. `/dashboard/campaigns?focus=...`).
  - Integrated into `src/components/TopNavbar.tsx`.

### F1.5 — Toast Layer with Deduplication & Unmount Teardown
- **Commit**: `9345a216` (`feat(ui): implement Toast layer with deduplication and unmount timer cleanup (F1.5)`)
- **TDD Test**: `src/components/__tests__/Toast.test.tsx` (3 tests)
- **Changes**:
  - Implemented `ToastProvider`, `useToast`, and `ToastContainer` with 5s auto-dismiss.
  - Deduplication by key collapses rapid duplicate alerts.
  - Clean timer teardown on component unmount prevents leaking active timers.
  - Wrapped `DashboardLayout` in `src/app/dashboard/layout.tsx`.

### F1.6 & F1.7 — Shared EntityDrawer & `?focus=` Deep-Linking Contract
- **Commit**: `750a7c6d` (`feat(ui): add EntityDrawer and wire ?focus deep-linking contract (F1.6, F1.7)`)
- **TDD Tests**:
  - `src/components/__tests__/EntityDrawer.test.tsx` (6 tests for account, campaign, publish_job, audit_log, task, research_post)
  - `src/__tests__/deep-link-contract.test.tsx` (3 tests)
- **Changes**:
  - Built `EntityDrawer` sliding sheet supporting all 6 entity types, rendering relations and quick actions.
  - Wired `?focus=<id>` contract on `src/app/dashboard/accounts/page.tsx`, `campaigns/page.tsx`, and `publishing/page.tsx`.
  - Row click highlights the row and opens the drawer. Drawer close invokes `router.replace` without `focus` to preserve history.

### F1.8 — Entity-Aware Breadcrumbs & Server-Backed Sidebar Badges
- **Commit**: `33f3af68` (`feat(ui): entity-aware breadcrumbs and server-backed sidebar badges (F1.8)`)
- **TDD Tests**:
  - `src/components/__tests__/Breadcrumbs.test.tsx` (4 tests)
  - `src/components/__tests__/Sidebar.test.tsx` (2 tests)
- **Changes**:
  - Built `src/components/Breadcrumbs.tsx` resolving path segments, `?focus=`, `?account=`, and sub-tabs (`?tab=`).
  - Refactored `src/components/Sidebar.tsx` to read unread badges from server `/api/v1/notifications/counts` instead of client arrays.
  - Replaced legacy static text breadcrumb in `src/components/TopNavbar.tsx`.

### F1.9 — Command Palette v2 with Full Keyboard Control & Listbox Semantics
- **Commit**: `1b496fa6` (`feat(ui): upgrade command palette to v2 with entity search (F1.9)`)
- **TDD Test**: `src/components/__tests__/CommandPalette.test.tsx` (3 tests)
- **Changes**:
  - Created `src/components/CommandPalette.tsx` supporting navigation, actions (approvals, pause, kill switch), and entities (accounts, campaigns, publish jobs).
  - Prefix and fuzzy search (`typing "appr" surfaces approvals`).
  - Full keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter` navigates, `Escape` closes).
  - Proper accessibility markup with `role="combobox"`, `role="listbox"`, and `role="option"`.

### F1.10 & F1.11 — Cross-Entity Action Wiring & URL State Synchronization
- **Commit**: `d3e68feb` (`feat(ui): cross-entity action wiring and URL-persisted tab states (F1.10, F1.11)`)
- **TDD Test**: `src/__tests__/research-cross-entity-url.test.tsx` (2 tests)
- **Changes**:
  - Synced sub-tabs (`?tab=voc`, `?tab=osint`, `?tab=analyze`) and multiplier filter (`?multiplier=`) with URL search params in `src/app/dashboard/research/page.tsx`.
  - Outlier post cards now feature direct "Run Campaign" cross-entity links pre-filling target URL into `/dashboard/campaigns?targetUrl=...&actionType=LIKE`.
  - Client component directives updated for Next.js App Router Turbopack build compatibility (`d536029c`).

---

## Quality Gate Summary
- **Unit & Integration Tests**: 99 / 99 test files passing (423 / 423 total tests).
- **Line Coverage**: `92.75%`
- **Branch Coverage**: `81.87%` (Threshold: $\ge 80\%$)
- **Function Coverage**: `94.33%`
- **Statement Coverage**: `94.68%`
- **Next.js Production Build**: `Passed` (Turbopack standalone build, static & dynamic routes compiled cleanly).
