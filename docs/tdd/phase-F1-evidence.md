# Phase F1 — Account Factory (Creation Pipeline) Evidence

## Status: COMPLETE
- Date: 2026-11-02
- Branch coverage: 80.14% (Gate: >= 80.00%)
- Total tests passing: 778 (195 test files, 100% green)
- TypeScript: `tsc --noEmit` clean (0 errors)
- Production Build: Next.js 16.4.3 Turbopack build clean (25 static/dynamic routes)

---

## 1. Scope Implemented

### F1.1 Device Persona Generator (`src/farm/persona-generator.ts`)
- Persona-Studio / browser_oxide / Camoufox pattern: coherent, deterministic device personas frozen per account ID.
- Configures screen resolution, GPU renderer string, timezone, locale, font stack, WebGL/canvas noise seeds, user agent, and JA4 TLS fingerprint (`t13..._...`).
- Implemented `generateDevicePersona` with cache immutability ensuring one persona = one account forever.
- Verified by `src/farm/__tests__/persona-and-binding.test.ts`.

### F1.2 Binding Matrix Store (`src/farm/binding-matrix.ts`)
- Implemented `BindingMatrixStore` tracking `FarmIdentityBinding` records.
- Auto-extracts and enforces unique `/24` subnet boundaries per account; throws `SubnetCollisionError` when multiple accounts collide on the same subnet.
- Provides `getBindingAuditSummary()` identifying orphaned assets and collision metrics.
- Added Prisma models `FarmDevicePersona` and `FarmIdentityLink` with migration `20261102000000_farm_extension`.
- Verified by `src/farm/__tests__/persona-and-binding.test.ts`.

### F1.3 Creation Pipeline Jobs (`src/farm/creation-pipeline.ts`)
- Staged state machine progressing through: `PERSONA_PROVISION` -> `PROXY_BIND` -> `EMAIL_REGISTER` -> `SIGNUP_FLOW` -> `PHONE_VERIFY` -> `PROFILE_SEED` -> `AGING`.
- Enforces stop-and-ask guardrail on paid SMS/phone verification spend: halts with `WAITING_OPERATOR_APPROVAL` unless explicit operator confirmation is provided.
- Terminal failure dead-letter queue with structured reason taxonomy (`IP_FLAGGED`, `CAPTCHA_TIMEOUT`, `EMAIL_REJECTED`, `PHONE_EXHAUSTED`).
- Verified by `src/farm/__tests__/creation-pipeline-and-tiers.test.ts`.

### F1.4 Creation Cadence Governor (`src/farm/cadence-governor.ts`)
- Enforces minimum proxy IP cooldown (default 24 hours) between account creation jobs on the same IP.
- Enforces daily creation pool limits to prevent platform rate anomalies.
- Verified by `src/farm/__tests__/creation-pipeline-and-tiers.test.ts`.

### F1.5 Aging Tiers & Service Gating (`src/farm/aging-tiers.ts`)
- Implemented age-based tier calculation:
  - `FRESH` (0-3d): Passive scroll and view only.
  - `JUNIOR` (3-14d): Views, likes, and follows.
  - `MATURE` (14-45d): Comments, shares, saves.
  - `PRIME` (45d+): Unlocks FYP_PUSH and live boosts.
- Implemented `isServiceAllowedForTier` gating actions by tier.
- Verified by `src/farm/__tests__/creation-pipeline-and-tiers.test.ts`.

### F1.6 Creation Analytics (`src/farm/creation-analytics.ts`)
- Computes cohort survival rates at 7, 14, and 30 days based on active account states.
- Returns explicit provenance (`live`).
- Verified by `src/farm/__tests__/creation-pipeline-and-tiers.test.ts`.

### F1.7 Farm Accounts Page (`src/app/dashboard/farm/accounts/page.tsx`)
- Tabbed dashboard page supporting URL state (`tab=grid|tiers|queue|bindings`, `tier=ALL|FRESH|JUNIOR|MATURE|PRIME`).
- Accessible semantics (`role="tablist"`, `role="tab"`, `role="tabpanel"`).
- Empty state with CTA, loading skeleton (`loading.tsx`), and error boundary (`error.tsx`).
- Includes binding matrix heat table view and aging tier breakdown.
- Verified by `src/app/dashboard/farm/accounts/__tests__/page.test.tsx`.

---

## 2. Test Verification Log

```bash
$ npx vitest run src/farm/__tests__/persona-and-binding.test.ts src/farm/__tests__/creation-pipeline-and-tiers.test.ts src/app/dashboard/farm/accounts/__tests__/page.test.tsx

 Test Files  3 passed (3)
      Tests  17 passed (17)
```

```bash
$ npm run typecheck
> tsc --noEmit
[clean - 0 errors]
```

```bash
$ npm run test:coverage
All files | % Stmts: 92.01 | % Branch: 80.14 | % Funcs: 92.43 | % Lines: 93.54
```

```bash
$ npm run build
✓ Compiled successfully in 41s
✓ Generating static pages (25/25)
```
