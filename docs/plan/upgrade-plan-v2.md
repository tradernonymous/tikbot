# tikbot — Upgrade Plan v2 (post Phase 0–9)

Status: planning only. No code changed by this document.
Baseline commit: `16921755`. Verified: 180 tests, coverage 94.32/80.90/96.38/97.18, migrations present, accounts/campaigns/proxies/publishing/audit are server-backed.

## What is already fixed (do not redo)

- Hardcoded secrets, default password, cookie-only auth, SSRF in SMM, webhook secret, rate limits, CSRF/cookie hardening (Phase 0).
- Prisma models + 2 migrations, real readiness DB probe, Postgres queue storage, persisted kill switch, encrypted session vault, action ledger.
- Accounts / proxies / campaigns / publish jobs / audit logs load from API. Legacy localStorage blob removed.

## What is still weak (verified in code)

| # | Finding | Evidence |
|---|---|---|
| 1 | No `error.tsx`, `loading.tsx`, `not-found.tsx` anywhere | `find src/app -name "error.tsx" ...` → empty |
| 2 | Zero accessibility attributes in the whole UI | `grep -rc "aria-" src/**/*.tsx` → 0 for every page |
| 3 | Notifications are client-memory only, `href` never rendered, no read state | `OperationsContext.tsx:112,375`; `TopNavbar.tsx:243` |
| 4 | Research results are client-only; no `ResearchPost`/snapshot model | `research/page.tsx:91` calls `addResearchedPost`; schema has no research tables |
| 5 | Worker fakes work: `farm.like`, `farm.comment`, `farm.live` return success, `research.scrape` returns zeros | `src/worker.ts:30-70` |
| 6 | Publisher default driver fabricates a TikTok URL | `src/content/publisher.ts:38-45` |
| 7 | Fake dashboard telemetry still rendered | `dashboard/page.tsx:113,117,158` |
| 8 | God provider, zero memoization → every page re-renders on any change | `OperationsContext.tsx` 1102 lines, no `useMemo`/`useCallback` |
| 9 | No metrics endpoint although registry exists | `src/observability/metrics.ts` has no route |
| 10 | Nav has no deep links, no per-entity detail view, tab state not in URL | Sidebar 8 links, pages use local state |
| 11 | No virtualization/pagination UI; lists render whole arrays | no `@tanstack/react-virtual` dep |
| 12 | Publishing is schedule-approve-only, no real upload driver contract | `publishNow`, `publisher.ts` |

## External constraints (do not design around)

- TikTok **Research API**: academic / non-profit only, data via Virtual Compute Environment. Not usable for this product. Do not plan on it.
- TikTok **Content Posting API**: unaudited clients post **private-only**; `video.publish` scope + app audit required. Plan a driver that reports `SELF_ONLY` honestly.
- Scraping and farm actions remain ToS-risky; keep kill switch, caps, approval gates, and provenance labels mandatory.

---

# Phase 0 — Truth pass (2 days)

Goal: no fabricated success anywhere. Everything unproven says so.

| ID | Task | Files | Acceptance |
|---|---|---|---|
| R0.1 | Delete fake `farm.like` / `farm.comment` / `farm.live` handlers. Register them only when a real driver is injected; otherwise handler throws `HandlerNotConfiguredError`. | `src/worker.ts` | Unit test: default registry rejects `farm.like`; no `{success:true}` path |
| R0.2 | Remove `ContentPublisher` default dummy uploader. Require explicit driver; `publish.upload` fails `PUBLISHER_NOT_CONFIGURED` when absent. | `src/content/publisher.ts`, `src/worker.ts` | Test: constructing publisher without driver throws; job marks FAILED with that code |
| R0.3 | `research.scrape` calls `DouyinTikTokClient` (or sidecar); returns real payload or throws. No zero-metric stub. | `src/worker.ts`, `src/research/*` | Test with mocked fetch: success path stores real numbers, failure path throws |
| U0.4 | Remove hardcoded `100% Sticky Residential`, `0.0%` ban rate, `100%` uptime, static action totals. Bind to aggregates or render `—` plus a provenance chip. | `src/app/dashboard/page.tsx` | Grep guard test: no literal `100%` / `0.0%` telemetry strings |
| U0.5 | Label every metric with provenance (`live` / `cached` / `unknown`) via shared `<Metric>` component. | new `src/components/Metric.tsx` | Component test for all three states |
| R0.6 | Add `NotImplementedCard` for features with no backend; remove buttons that pretend. | shared component | E2E: clicking leftover stub shows explanation, not toast success |

Exit: `npm test` green; grep shows no fabricated success path in `src/`.

---

# Phase 1 — Navigation + notification spine (4 days)

Goal: any event is visible where it matters, one click from where it happened.

| ID | Task | Acceptance |
|---|---|---|
| F1.1 | `Notification` model + migration: `type, severity, title, body, href, entityType, entityId, dedupeKey, readAt, createdAt`. Index on `(readAt, createdAt)` and `dedupeKey`. | Migration applies; `prisma validate` clean |
| F1.2 | `NotificationService.emit()` with dedupe window (e.g. same entity+type inside 5 min collapses). Wire on: campaign approve/reject, task fail, publish result, ban detection, kill switch, SMM failure, research job failure, worker stale. | Integration test per source emits exactly one notification |
| F1.3 | `GET /api/v1/notifications?filter&cursor`, `POST /api/v1/notifications/:id/read`, `POST /read-all`, `GET /counts` (unread per area). Zod + session guard. | Route tests: 401 unauth, pagination, counts match |
| F1.4 | Replace bell dropdown with a Notification Center panel: tabs All / Approvals / Incidents / Research / System, unread badge, per-item deep link, mark read on open, keyboard nav, `aria-live="polite"` on count. | Playwright: click notification → lands on target page with `?focus=` and row highlighted |
| F1.5 | Toast layer separate from the center: success/warn/error, auto-dismiss 5s, dedupe by key, timers cleared on unmount. | Test: unmount mid-toast leaves no timer; duplicate key collapses |
| F1.6 | Deep-link contract on every entity page: `?focus=<id>` (and `?tab=`), open detail drawer, highlight row, `router.replace` on close so back works. | E2E per page: direct URL opens the right drawer |
| F1.7 | Shared `EntityDrawer` (right sheet): account, campaign, job, publish job, task, audit log, research post. Fetches by id, shows relations and next actions. | Story/test: each entity type renders and links to related entities |
| F1.8 | Breadcrumbs become entity-aware (`Campaigns / Q4-likes / Tasks`); sidebar badges come from `/counts`, not client arrays. | Badge equals server count after reload |
| F1.9 | Command palette v2: pages, actions (approve, pause, kill switch), entities, recent items. Fuzzy match, `Cmd+K`, full keyboard control, `role="listbox"`. | Test: typing "appr" surfaces approvals; Enter navigates |
| F1.10 | Cross-entity action wiring: outlier post → "Run campaign" (prefilled), campaign → tasks + audit, account → sessions + campaigns, publish job → account + metrics, audit log → entity. | E2E: research outlier → campaign draft contains target URL |
| F1.11 | URL state for research sub-tabs (`?tab=voc`) and filters, so share/reload/back preserve context. | Reload keeps tab, filter, page |

Exit: every notification opens the exact record; no page state lost on refresh.

---

# Phase 2 — Persistence for research + metrics (1 week)

Goal: the research dashboard is a database product, not a scratchpad.

| ID | Task | Acceptance |
|---|---|---|
| R2.1 | Models: `ResearchPost`, `PostSnapshot`, `Creator`, `Watchlist`, `WatchlistTarget`, `TrendSignal`, `Sound`, `Hook`, `ContentPlan`, `MetricSample`. Unique `(platform, platformPostId)`. | Migration + relations valid |
| R2.2 | Repositories + zod schemas + route handlers per model, server pagination/sort/filter. | Route tests: filter, sort, cursor, 400 on bad input |
| R2.3 | Research page → server components + server actions. Remove client `addResearchedPost`; analysis writes `ResearchPost` + first `PostSnapshot`. | Reload after analysis still shows the post |
| R2.4 | `research.watch` job per watchlist target: ingest creator feed, upsert posts, snapshot, dedupe, respect rate limits. | Idempotent: running twice adds no duplicates |
| R2.5 | `metrics.collect` job at T+1h / 24h / 7d / 28d per post and per owned publish job; writes `MetricSample`. | Snapshot count grows on schedule; chart data endpoint returns series |
| R2.6 | Outlier scoring against stored baselines (median + MAD per creator/niche, min sample size, confidence field). Replace any fixed multiplier. | Test: outlier requires ≥N baseline posts; score reproducible |
| R2.7 | One-time import of legacy context data, then delete the code path. | Import test; no legacy keys read afterward |

Exit: research survives reload, device change and worker restart.

---

# Phase 3 — Real execution (1.5 weeks)

| ID | Task | Acceptance |
|---|---|---|
| R3.1 | Stealth runner hardening: per-view proxy from pool, nav timeout, concurrency cap, cancellation token, per-view error taxonomy, repeated-run listener check. | Repeat-run test: no `MaxListenersExceeded`; missing browser fails fast |
| R3.2 | Real `farm.like` / `farm.comment` / `farm.live` handlers: runner + comment bank + ledger + proof artifact (screenshot hash, DOM snippet). Keep-N/A when disabled by config. | Integration test with stubbed page: ledger row + proof stored; over-cap rejected |
| R3.3 | Publish drivers behind `UploaderDriver`: `OfficialDriver` (Content Posting API: creator_info query → init → status poll; records `SELF_ONLY` when unaudited), `BrowserDriver` (session vault), `MockDriver` dev-only. | Contract tests for each driver; publish job stores `publishId` + provider status |
| R3.4 | Retry policy per job type (max attempts, backoff + jitter, retryable vs terminal codes), dead-letter state with reason, idempotency key on enqueue. | Test: transient error retries, terminal error dead-letters once |
| R3.5 | Job progress stream: SSE endpoint `GET /api/v1/jobs/stream`; UI updates tasks without 15s polling. | E2E: task card updates within 2s of job event |
| R3.6 | Guards: per-account concurrency, global cap, ban-rate circuit breaker auto-pauses campaigns, kill switch checked before and during each job. | Test: 3 bans in 10 min pauses new work and emits incident notification |
| R3.7 | Worker lifecycle: heartbeat, stale `RUNNING` reclaim, graceful drain on SIGTERM, `WORKER_PAUSED` flag honored within one poll. | Chaos test: kill -9 mid-job → job reclaimed once, not duplicated |

Exit: every job type either does real work or fails loudly; no fake URL, no fake counts.

---

# Phase 4 — UI/UX upgrade (1 week)

| ID | Task | Acceptance |
|---|---|---|
| U4.1 | Design tokens in `@theme` (color, spacing, radius, type scale); remove dead `tailwind.config.js`; decide dark-only or real theme toggle. | Tokens used; no raw hex in components; toggle either works or is gone |
| U4.2 | Accessibility sweep: `htmlFor` on every label, `aria-label` on icon buttons, `aria-live` on toasts/terminal, focus trap + focus return in modals/drawers, visible focus ring, contrast ≥4.5:1, min 12px text, skip-to-content. | Axe scan 0 critical; keyboard-only run of approve flow |
| U4.3 | Responsive: sidebar → drawer under `lg`, mobile card layout for tables, sticky action bar, no horizontal scroll at 375px. | Playwright viewport tests at 375/768/1440 |
| U4.4 | Route states: `loading.tsx` (skeletons), `error.tsx` (retry + error id), `not-found.tsx`; `SectionErrorBoundary` above providers. | Forced throw renders error page, app shell survives |
| U4.5 | Forms: inline validation, disabled submit until valid, server errors mapped to fields, unsaved-changes guard, autofocus first invalid. | Test per form: invalid URL, zero count, negative caps |
| U4.6 | Tables: sortable headers, column visibility, row count, bulk select, per-row actions, virtualized body, destructive confirm + undo where safe. | 1k rows scroll at 60fps; sort/filter persist in URL |
| U4.7 | Consistent detail drawers, empty states with primary CTA, and status badges with text (not color alone). | Screenshot review checklist per page |
| U4.8 | Charts: real series only, legend + tooltip, accessible table fallback, provenance label. | No chart renders from fixtures in production |

Exit: no fake numbers, no unlabeled controls, usable on a phone.

---

# Phase 5 — Performance (5 days)

| ID | Task | Acceptance |
|---|---|---|
| P5.1 | Split `OperationsContext` into `UiContext` (modals, toasts, palette) + `NotificationsContext`; domain data moves to server components/hooks. Memoize every action. | React Profiler: one campaign mutation re-renders only campaign surfaces |
| P5.2 | Server-side aggregates for dashboard (counts, rates, trends) via `React.cache` + parallel Prisma queries; no client fetch waterfall on first paint. | TTFB and LCP budget met; no `useEffect` fetch on overview |
| P5.3 | Pagination + virtualized tables everywhere; server sort/filter; page size control. | 1k accounts: <100 DOM rows |
| P5.4 | Debounced search (250ms), abortable fetches, optimistic updates with rollback. | Typing 10 chars ≠ 10 requests |
| P5.5 | Code splitting: dynamic modals/charts, bundle analyzer budget, drop unused deps. | Initial JS for dashboard < 250 kB gzip |
| P5.6 | Media: `next/image`, lazy video posters, no full-size thumbnails in lists. | No CLS from media; Lighthouse ≥ 90 perf |
| P5.7 | DB: indexes for hot filters, kill N+1 in repositories, `EXPLAIN` the 5 slowest queries. | All p95 < 200 ms at 10k rows |
| P5.8 | Perf guard in CI: Lighthouse CI budget + bundle size check. | CI fails on regression |

---

# Phase 6 — TikTok organic marketing features (2 weeks)

Grounded in: head-of-content (outlier/engagement scoring), ScrapeCreators research skills (transcript, comment mining, trend, influencer), brightbean (calendar, inbox, approvals), postiz (composer/scheduler), Douyin_TikTok_Download_API (data), autotok (upload), growchief (orchestration).

| ID | Task | Acceptance |
|---|---|---|
| G6.1 | Trend radar: hashtag + sound discovery (Download API hashtag/music endpoints, Creative Center where scrapable), rising score, region filter, "use in composer". | Trend list shows source + timestamp + sample size |
| G6.2 | Competitor watch: add handles, daily ingest, feed of outliers vs their own baseline, "why it worked" (hook, length, sound, format). | Adding a handle produces posts + snapshots next run |
| G6.3 | Hook lab: transcripts → hook variants, tag by pattern (question, POV, contrarian, demo), score by retention proxy and own-post history. | Hook library searchable; hook links to posts that used it |
| G6.4 | Content calendar: month/week view per account, best-time slots from own `MetricSample`, drag reschedule, cap/conflict warnings. | Dragging a slot persists; over-cap slot blocked |
| G6.5 | Composer: caption + hashtag suggestions from trend/VOC data, sound attach, cover frame, per-platform variants, draft → approval → schedule. | Scheduled post appears in calendar and publish queue |
| G6.6 | A/B hooks: variants per asset, split scheduling, metric compare after 24h/72h, winner promote. | Two variants scheduled; comparison view resolves winner |
| G6.7 | Repurpose: one asset → TikTok / Shorts / Reels crops + captions, export package. | Export produces correct aspect ratios and captions |
| G6.8 | Performance report: "what worked" by hook type, length, sound, posting time, format, 7/28 days; export CSV. | Report numbers trace back to `MetricSample` rows |
| G6.9 | Influencer/UGC CRM: prospect list, outreach status, seeded content tracking, ROI link. | Status pipeline persists; seeded post links to creator |
| G6.10 | Comment inbox: reply queue with approval, sentiment, FAQ bank, escalate-to-content-idea. | Reply requires approval; idea creates `ContentPlan` |
| G6.11 | Research → action loop: outlier → campaign template, VOC theme → content plan, creator → watchlist; one-click with prefilled params. | E2E: research outlier creates campaign with target URL |

Do not build on the Research API. Do not promise public posting via the Content Posting API until app audit passes.

---

# Phase 7 — Ops, scale, release (1 week)

| ID | Task | Acceptance |
|---|---|---|
| R7.1 | `GET /api/metrics` exposing the existing registry: queue depth, job success/fail, ban rate, poller lag, supplier errors, worker heartbeat age. | Scrape returns Prometheus text; tested |
| R7.2 | Alert rules → notifications: stale heartbeat, ban spike, SMM failures, kill switch engaged, DB latency, disk. | Each rule fires in a simulated test |
| R7.3 | Backups: nightly `pg_dump` to object storage, restore drill doc, migration policy (expand/contract). | Restore into clean DB reproduces data |
| R7.4 | Load + chaos: 1k actions/day, 10k rows, worker kill mid-job, DB restart, proxy pool exhaustion. | Documented results, no duplicate actions |
| R7.5 | E2E suite: login → add account → research → campaign → approve → worker runs → notification → deep link → audit log. | Playwright green in CI, trace on failure |
| R7.6 | Security: CSP without `unsafe-inline`, origin checks on mutations, dependency audit, secret rotation drill. | `npm audit` clean/high; CSP violations = 0 |
| R7.7 | Docs: route map, entity/flow diagram, runbooks, onboarding, env matrix. | New operator can run the system from docs alone |

---

## Sequencing

```
Phase 0 (truth)
   └─> Phase 1 (nav/notifications)
          ├─> Phase 2 (data) ──> Phase 3 (execution) ──> Phase 6 (growth)
          ├─> Phase 4 (UI/UX)
          └─> Phase 5 (perf)
                                   Phase 7 (ops/release) last
```

Phase 4 and 5 may run in parallel with 2 after Phase 1 lands.

## Definition of done (every phase)

- Tasks implemented, not stubbed; no `success: true` without evidence.
- Failing test first, then fix; coverage gate ≥ 80% branches stays green.
- `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run build` green.
- Evidence file in `docs/tdd/<phase>-v2-evidence.md` with commands and output.
- No new client-side secret, no new fabricated metric, no dead nav link.

## Stop and ask

Paid SMM/proxy spend, real TikTok credentials, Content Posting API audit, legal/ToS decisions, destructive DB operations.
