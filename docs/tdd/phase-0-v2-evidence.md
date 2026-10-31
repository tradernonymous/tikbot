# Phase 0 Truth Pass Evidence Document

## Baseline & Verification
- **Baseline Commit**: `16921755`
- **TypeScript Check**: `npx tsc --noEmit` passed cleanly (0 errors).
- **Test Suite**: 88 test files passed (376 tests passed).
- **Branch Coverage**: `81.54%` (exceeds global `80%` gate).
- **Build Verification**: `next build` (Next.js 16.4.3 Turbopack standalone) passed cleanly.

---

## Tasks & Commits

### R0.1 — Remove Fake Farm Handlers & Require Explicit Drivers
- **Commit**: `7258bf68` (`fix(worker): remove fake farm action handlers and require explicit drivers (R0.1)`)
- **TDD Test**: `src/__tests__/worker-truth-pass.test.ts`
- **Changes**:
  - Removed fake default stub handlers for `farm.like`, `farm.comment`, and `farm.live` returning `{ success: true }`.
  - Added `HandlerNotConfiguredError` thrown whenever an unconfigured job type is invoked.
  - Required explicit driver registration via `registerJobHandler`.

### R0.2 — Remove Publisher Default Dummy Uploader & Fail Unconfigured Publish Jobs
- **Commit**: `c7a2ec46` (`fix(content): require explicit uploader driver and fail unconfigured publish jobs (R0.2)`)
- **TDD Test**: `src/content/__tests__/publisher-truth.test.ts`
- **Changes**:
  - Eliminated dummy inline driver in `ContentPublisher` generating fake `tt_*` video IDs and simulated TikTok URLs.
  - Added `PublisherNotConfiguredError`.
  - ContentPublisher constructor now requires an explicit `uploaderDriver`.
  - In `worker.ts`, unconfigured `publish.upload` immediately transitions to `status: 'FAILED'` with `PUBLISHER_NOT_CONFIGURED` without indefinite retries.

### R0.3 — Research Scrape Real Data Delegation to DouyinTikTokClient
- **Commit**: `5a95fe59` (`fix(worker): wire research.scrape to DouyinTikTokClient and remove zero-metric stub (R0.3)`)
- **TDD Test**: `src/research/__tests__/research-scrape-truth.test.ts`
- **Changes**:
  - Removed `{ views: 0, likes: 0, comments: 0 }` fake stub from `research.scrape`.
  - Delegated `research.scrape` execution to `DouyinTikTokClient.extractVideoData(target)`.
  - Returns real scraped metrics (`views`, `likes`, `comments`, `shares`, `author`, `caption`, `postId`) or throws when the API/client fails.

### U0.4 & U0.5 — Metric Component with Provenance Chip & Telemetry Truth Pass
- **Commit**: `19447bfa` (`feat(ui): add Metric component with provenance chip and eliminate hardcoded telemetry (U0.4, U0.5)`)
- **TDD Tests**:
  - `src/components/__tests__/Metric.test.tsx` (tests `live`, `cached`, `unknown` chips, value rendering, fallback em-dash)
  - `src/__tests__/telemetry-truth.test.ts` (grep guard asserting no `"100% Sticky Residential"`, `"0.0%"` ban rate, or hardcoded `value="100%"` compliance literal)
- **Changes**:
  - Created `src/components/Metric.tsx` displaying label, value, unit, subtext, and provenance badge (`LIVE` | `CACHED` | `UNKNOWN`).
  - Replaced hardcoded stats in `src/app/dashboard/page.tsx` Fleet Vitals Strip with `Metric` components bound to real aggregates.
  - Replaced hardcoded `0.0%` in `src/app/dashboard/compliance/page.tsx` with dynamic fleet challenge rate calculation.

### R0.6 — NotImplementedCard & Eliminate Simulated Publishing Success
- **Commit**: `59f49d97` (`feat(ui): add NotImplementedCard and remove simulated publishing success (R0.6)`)
- **TDD Tests**:
  - `src/components/__tests__/NotImplementedCard.test.tsx` (tests card rendering, badge, issue link, no fake buttons)
  - `src/__tests__/truth-no-fake-success.test.ts` (asserts no `"Simulate automated upload right now"`, no fake TikTok URLs via `Math.random()`)
- **Changes**:
  - Created `src/components/NotImplementedCard.tsx` with honest explanation and tracking issue link.
  - Deleted fake `handlePublishNow` button faking upload success and random video IDs in `src/app/dashboard/publishing/page.tsx`.
  - Removed `Math.random()` fake URL generation in `src/context/OperationsContext.tsx`.
  - Added `NotImplementedCard` for unconfigured video publisher driver.

---

## Final Verification Summary
- **Tests**: 88/88 test files passing (376 tests).
- **Coverage**: Branches at 81.54% (gate $\ge 80\%$).
- **TypeScript**: Clean (`tsc --noEmit` exit 0).
- **Next Build**: Clean standalone Turbopack build (exit 0).
