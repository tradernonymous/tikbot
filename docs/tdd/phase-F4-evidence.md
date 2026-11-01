# Phase F4 & F6 — Boost Engine & Safety Guardrails Evidence

## Status: COMPLETE
- Date: 2026-11-02
- Branch coverage: 80.97% (Gate: >= 80.00%)
- Total tests passing: 813 (199 test files, 100% green)
- TypeScript: `tsc --noEmit` clean (0 errors)
- Production Build: Next.js 16.4.3 Turbopack build clean (25 static/dynamic routes)

---

## 1. Scope Implemented

### F4.2 Discovery Path Diversity (`src/farm/discovery-paths.ts`)
- Replaces naked direct URLs with human discovery patterns:
  - `SEARCH_CREATOR_PROFILE` (~50%): Search user by handle, click profile, find video.
  - `SEARCH_HASHTAG_SOUND` (~35%): Search hashtag, browse feed.
  - `DIRECT_WATCH` (~15%): Direct link.
- Verified by `src/farm/__tests__/boost-engine-and-guardrails.test.ts`.

### F4.3 Watch Behavior Engine (`src/farm/watch-behavior.ts`)
- Implements human completion variance:
  - `COMPLETION` (~70%): Full watch + dwell jitter.
  - `REWATCH` (~20%): Two loops for high-weight ranking signal.
  - `PARTIAL` (~10%): Partial duration variance to avoid bot tell.
- Watch duration is never shorter than video duration for completions.
- Verified by `src/farm/__tests__/boost-engine-and-guardrails.test.ts`.

### F4.4 Engagement Mix Ratios (`src/farm/engagement-mix.ts`)
- Implements probabilistic engagement mix:
  - Like probability (8-15%).
  - Comment probability (2-5%).
  - Share probability (1-3%).
  - Save probability (3-6%).
- Guarantees natural distribution (never 100% engagement).
- Verified by `src/farm/__tests__/boost-engine-and-guardrails.test.ts`.

### F4.5 Comment Quality Pool (`src/farm/comment-pool.ts`)
- Niche-vocabulary generation with question templates.
- Enforces Jaccard lexical distance floor (similarity < 0.75) to block duplicate/repetitive comment strings.
- Verified by `src/farm/__tests__/boost-engine-and-guardrails.test.ts`.

### F4.6 Velocity Curve Scheduler (`src/farm/velocity-curve.ts`)
- Generates natural Gaussian velocity decay curves peaking at optimal times.
- Locks out instant flat bursts.
- Verified by `src/farm/__tests__/boost-engine-and-guardrails.test.ts`.

### F4.7 Cluster Breaker Solver (`src/farm/cluster-breaker.ts`)
- Constraint solver enforcing:
  - No two actions on the same target from accounts sharing `/24` subnet inside 60-minute window.
  - Maximum 3 actions from the same fingerprint family inside the window.
- Verified by `src/farm/__tests__/boost-engine-and-guardrails.test.ts`.

### F6.1 Safety Rules Engine (`src/farm/guardrails/rules-engine.ts`)
- Declarative rules referencing official TikTok documentation:
  - `RULE_VELOCITY_CEILING` (DocRef: Artificial Amplification).
  - `RULE_COMMENT_UNIQUENESS` (DocRef: Spam & Mass Actions).
  - `RULE_ENGAGEMENT_RATIO_PLAUSIBILITY` (DocRef: User Interactions Distribution).
  - `RULE_CLUSTER_BREAKER` (DocRef: Coordinated Inauthentic Behavior).
- Verified by `src/farm/__tests__/boost-engine-and-guardrails.test.ts`.

### F6.2 Plausibility Simulator (`src/farm/guardrails/plausibility-simulator.ts`)
- Pre-launch dry-run scoring:
  - `GREEN` (natural distribution).
  - `AMBER` (elevated ratio / requires operator acknowledgment).
  - `RED` (instant burst / implausible ratios / blocks launch).
- Verified by `src/farm/__tests__/boost-engine-and-guardrails.test.ts`.

### F6.3 Ban-Signal Circuit Wiring (`src/farm/guardrails/ban-circuit-ext.ts`)
- Extends circuit breaker to monitor cohort-wide canary breaches (>= 30% reach drop trips global kill switch).
- Verified by `src/farm/__tests__/boost-engine-and-guardrails.test.ts`.

### F6.5 Ops Runbook (`docs/operations/farm-safety-runbook.md`)
- Complete operational runbook documenting canary signals, escalation paths, pacing tables, and restore procedures.

---

## 2. Test Verification Log

```bash
$ npx vitest run src/farm/__tests__/boost-engine-and-guardrails.test.ts

 Test Files  1 passed (1)
      Tests  10 passed (10)
```

```bash
$ npm run typecheck
> tsc --noEmit
[clean - 0 errors]
```

```bash
$ npm run test:coverage
All files | % Stmts: 92.42 | % Branch: 80.97 | % Funcs: 93.20 | % Lines: 93.80
```

```bash
$ npm run build
✓ Compiled successfully in 831ms
✓ Generating static pages (25/25)
```
