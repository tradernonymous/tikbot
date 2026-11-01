# Phase F5 Evidence — Farm Services & Launch Console

## Overview
Phase F5 establishes the Farm Services Catalog, Launch Console, Cohort Manager, Order Queue & History, along with the dedicated `/dashboard/farm/services` page and Sidebar regroup.

## Subtasks Implemented
- **F5.1 Service Catalog** (`src/farm/service-catalog.ts`):
  - Catalog of 8 algorithmic services: `watch` (completion + rewatch), `like`, `comment` (vetted niche vocabulary), `share` (internal/external copy-link), `save`/favorite, `follow` creator, `live-boost` (dwell + chat questions), and `FYP_PUSH` (full 7-step sequence).
  - Enforces minimum aging tier (`FRESH`, `JUNIOR`, `MATURE`, `PRIME`), daily cap per account, and safety budget deductions.
- **F5.2 Launch Wizard** (`src/farm/launch-wizard.ts`):
  - 6-step state machine: Step 1: Target (URL + canary verification), Step 2: Goal (views, likes, comments, delivery hours), Step 3: Cohort selection (niche filter, min tier, availability), Step 4: Pacing (Gaussian decay curve, jitter), Step 5: Safety preflight simulator (cluster and reach verification), Step 6: Review and confirmation.
  - State serializable to and deserializable from URL search params.
- **F5.3 Cohort Manager** (`src/farm/cohort-manager.ts`):
  - Named cohorts (`Crypto-Fresh`, `Beauty-Prime-US`, `Tech-Mature-Global`).
  - Auto-replenishment rule when accounts quarantine from candidate pool matching niche and tier.
  - Dynamic sizing filter based on health scores (>= 50 floor).
- **F5.4 Order Queue & History** (`src/farm/order-queue.ts`):
  - In-memory and persisted order store with status lifecycle: `PENDING`, `RUNNING`, `PAUSED`, `COMPLETED`, `FAILED`, `ABORTED`.
  - Exponential backoff retry handler and live progress tracking.
- **F5.5 Farm Services Page** (`src/app/dashboard/farm/services/page.tsx`):
  - Tabbed interface (`catalog`, `launch`, `active`, `history`, `reports`).
  - Metric cards with live/cached provenance chips.
  - Loading skeleton (`loading.tsx`), Error boundary (`error.tsx`), and accessible ARIA attributes.
- **F5.6 Sidebar Regroup** (`src/components/Sidebar.tsx`):
  - Dedicated "Farm" navigation group containing `Farm Accounts` (`/dashboard/farm/accounts`) and `Farm Services` (`/dashboard/farm/services`).
  - Badges reflecting active account counts and running tasks.

## Test Verification
- **Unit & Component Tests**:
  - `src/farm/__tests__/farm-services-and-launch.test.ts`: 10/10 tests green.
  - `src/app/dashboard/farm/services/__tests__/page.test.tsx`: 4/4 tests green.
  - `src/components/__tests__/Sidebar.test.tsx`: 4/4 tests green.
- **Full Test Suite**: 201 test files passed, 827 tests passed.
- **Branch Coverage**: 81.27% (Gate >= 80.00% maintained).
- **Typecheck**: `npm run typecheck` passed (0 errors).
- **Production Build**: `npm run build` completed cleanly (26 routes generated).
