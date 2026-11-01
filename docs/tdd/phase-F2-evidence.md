# Phase F2 — Account Health & Shadow-Detection Evidence

## Status: COMPLETE
- Date: 2026-11-02
- Branch coverage: 81.10% (Gate: >= 80.00%)
- Total tests passing: 795 (197 test files, 100% green)
- TypeScript: `tsc --noEmit` clean (0 errors)
- Production Build: Next.js 16.4.3 Turbopack build clean (25 static/dynamic routes)

---

## 1. Scope Implemented

### F2.1 Reach Canary (`src/farm/reach-canary.ts`)
- Implemented `ReachCanaryDetector` calculating Median and Median Absolute Deviation (MAD) of an account's historical post views.
- Detects organic discoverability drop (`REACH_DROP`) when current views breach below `median - MAD` for $N$ consecutive samples (default 2).
- Returns explicit provenance (`live`).
- Verified by `src/farm/__tests__/reach-canary-and-health.test.ts`.

### F2.2 Account Health Score (`src/farm/account-health-score.ts`)
- Computes composite 0-100 health score with weighted component breakdown:
  - Reach trend ratio (30 pts).
  - Login success rate (20 pts).
  - Security / captcha penalties (25 pts).
  - Action success rate (15 pts).
  - Account age tier factor (10 pts).
- Categorizes status into `PRIME_HEALTH`, `NORMAL`, `DEGRADED`, and `CRITICAL`.
- Verified by `src/farm/__tests__/reach-canary-and-health.test.ts`.

### F2.3 Auto-Quarantine (`src/farm/auto-quarantine.ts`)
- Automatically evicts accounts with health score below threshold (< 50) or fired reach canaries from active boost cohorts.
- Emits structured `AUTO_QUARANTINE` notification payload with live provenance.
- Implements `restoreFromQuarantine` requiring operator audit notes.
- Verified by `src/farm/__tests__/reach-canary-and-health.test.ts`.

### F2.4 Target-Account Monitor (`src/farm/target-monitor.ts`)
- Monitors the boosted target account / post link during boost runs:
  - Checks comment visibility on public re-fetch (flags `COMMENT_VISIBILITY_DROP` if posted comment is invisible).
  - Checks view velocity collapse against organic baseline.
- Automatically flags `shouldTripKillSwitch: true` on negative signals.
- Verified by `src/farm/__tests__/reach-canary-and-health.test.ts`.

### F2.5 Verification Incident Log (`src/farm/incident-log.ts`)
- Tracks incidents across accounts and proxies (`CAPTCHA`, `PHONE_REVERIFY`, `LOGIN_CHALLENGE`, `REACH_DROP`).
- Automatically recommends proxy retirement when an incident cluster breaches threshold (>= 3).
- Verified by `src/farm/__tests__/reach-canary-and-health.test.ts`.

---

## 2. Test Verification Log

```bash
$ npx vitest run src/farm/__tests__/reach-canary-and-health.test.ts src/farm/__tests__/farm-branches-booster.test.ts

 Test Files  2 passed (2)
      Tests  17 passed (17)
```

```bash
$ npm run typecheck
> tsc --noEmit
[clean - 0 errors]
```

```bash
$ npm run test:coverage
All files | % Stmts: 92.56 | % Branch: 81.10 | % Funcs: 92.97 | % Lines: 94.03
```

```bash
$ npm run build
✓ Compiled successfully in 1486ms
✓ Generating static pages (25/25)
```
