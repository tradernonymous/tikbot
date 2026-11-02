# Evidence File: Phase Fix - Session Persistence, Memory Cleanup & Real Mutation Sync

## Date: 2026-11-02
## Scope
Resolution of:
1. Re-login prompt triggered every time the page or tab is reloaded.
2. Dashboard pre-populated with mock data without settings configured, and deleted items resurrecting upon reload or re-sign in.
3. Event bubbling issues causing entity drawers to open when clicking table row action buttons (Delete, Approve, Cooldown).
4. DTO mismatch crashes between OperationsContext mappings and Compliance / Publishing page requirements.

---

## Root Causes Identified & Fixed

### 1. Re-login on Page/Tab Reload
- **Root Cause**: 
  - `src/app/dashboard/layout.tsx` evaluated `process.env.SESSION_SECRET` directly. If not explicitly set in the local `.env`, this was `undefined`, triggering `redirect('/login')` even when a valid session token cookie existed.
  - In `src/app/api/v1/auth/login/route.ts`, `cookieName` was hardcoded to `__Host-tikbot_session` when `NODE_ENV === 'production'`. Browsers reject cookies with the `__Host-` prefix when delivered over unencrypted HTTP (e.g. running production mode on `localhost:3000` or via an unencrypted reverse proxy).
  - `sameSite: 'strict'` caused browser cookie dropping on cross-tab / top-level refresh navigations.
- **Fix**:
  - Centralized `getSessionSecret()` in [src/security/auth.ts](file:///mnt/hdd/storage/projects/home/tikbot/src/security/auth.ts) ensuring deterministic key access across layouts, middleware/proxy, and API routes.
  - Implemented `getSessionCookieOptions(isHttps)` in [src/security/auth.ts](file:///mnt/hdd/storage/projects/home/tikbot/src/security/auth.ts), applying `__Host-` prefix and `secure: true` only when actual HTTPS transport is present, and setting `sameSite: 'lax'`.
  - Updated [src/app/api/v1/auth/login/route.ts](file:///mnt/hdd/storage/projects/home/tikbot/src/app/api/v1/auth/login/route.ts), [src/app/dashboard/layout.tsx](file:///mnt/hdd/storage/projects/home/tikbot/src/app/dashboard/layout.tsx), [src/proxy.ts](file:///mnt/hdd/storage/projects/home/tikbot/src/proxy.ts), and [src/config/index.ts](file:///mnt/hdd/storage/projects/home/tikbot/src/config/index.ts).
  - Enhanced [src/app/login/page.tsx](file:///mnt/hdd/storage/projects/home/tikbot/src/app/login/page.tsx) to redirect using `window.location.assign(from || '/dashboard')`.

### 2. Mock Data Pre-Populated & Zombie Resurrection
- **Root Cause**:
  - [src/context/OperationsContext.tsx](file:///mnt/hdd/storage/projects/home/tikbot/src/context/OperationsContext.tsx) initialized React state with hardcoded arrays from `getDevFixtures()` and hardcoded `@jackprintezy` fixtures. Every time the app reloaded or re-signed in, `useState` ran its initializers, resurrecting the deleted items.
  - In `addAccount`, temporary IDs (`acc-xxxx`) were assigned and never synced with the database CUID. Consequently, `removeAccount` executed `DELETE /api/v1/accounts?id=acc-xxxx`, which silently did not match any database row.
  - `createCampaign`, `approveCampaign`, `rejectCampaign`, `pauseCampaign`, and `resumeCampaign` mutated client React state without dispatching `POST`, `PATCH`, or `DELETE` to `/api/v1/campaigns`.
  - In `src/farm/order-queue.ts` and `src/farm/cohort-manager.ts`, `listOrders()` and `getCohorts()` re-seeded default records whenever the collection was empty.
- **Fix**:
  - Initialized all collections (`accounts`, `proxies`, `campaigns`, `farmTasks`, `publishJobs`, `mediaAssets`, `auditLogs`, `notifications`) as empty arrays `[]`. Real state is hydrated from API routes on mount.
  - In `addAccount`, synced the server-generated CUID from `POST /api/v1/accounts`.
  - Connected `createCampaign`, `approveCampaign`, `rejectCampaign`, `pauseCampaign`, and `resumeCampaign` to `/api/v1/campaigns` `POST`, `PATCH`, and `DELETE`.
  - Connected `rejectPublishJob` to `DELETE /api/v1/publishing/jobs`.
  - Added seeded state flags in `order-queue.ts` and `cohort-manager.ts` so `clearOrders()` and `clearCohorts()` keep the collections clean without resurfacing sample records.

### 3. DTO Mappings & Event Bubbling
- **Root Cause**:
  - In `OperationsContext.tsx`, audit logs fetched from `/api/v1/audit-logs` were mapped without `actorEmail`, `resourceId`, or `createdAt`. When searching or rendering in `CompliancePage`, calling `.toLowerCase()` on undefined triggered runtime errors.
  - Publish jobs were mapped with mismatched property names (`accountTarget`, `scheduledFor`) instead of `account` and `scheduledAt`.
  - Action buttons in Accounts, Campaigns, and Publishing tables lacked `e.stopPropagation()`, causing clicks on Delete, Approve, or Cooldown to bubble up and open the entity drawer.
- **Fix**:
  - Corrected audit log and publish job mappings in [src/context/OperationsContext.tsx](file:///mnt/hdd/storage/projects/home/tikbot/src/context/OperationsContext.tsx).
  - Added `e.stopPropagation()` to all action buttons in [src/app/dashboard/accounts/page.tsx](file:///mnt/hdd/storage/projects/home/tikbot/src/app/dashboard/accounts/page.tsx), [src/app/dashboard/campaigns/page.tsx](file:///mnt/hdd/storage/projects/home/tikbot/src/app/dashboard/campaigns/page.tsx), and [src/app/dashboard/publishing/page.tsx](file:///mnt/hdd/storage/projects/home/tikbot/src/app/dashboard/publishing/page.tsx).
  - Updated SMM button disabled states in [src/app/dashboard/settings/page.tsx](file:///mnt/hdd/storage/projects/home/tikbot/src/app/dashboard/settings/page.tsx) so `smmKeyConfigured || smmApiKey.trim().length > 0` enables operations.

---

## Verification Evidence

### 1. TypeScript Verification (`npm run typecheck`)
```
> tikbot@1.0.0 typecheck
> tsc --noEmit
Exit code: 0
```

### 2. Unit & Integration Test Suite (`npm test`)
```
Test Files  203 passed (203)
Tests       836 passed (836)
Duration    14.27s
Exit code:  0
```

### 3. Test Coverage Gate (`npm run test:coverage`)
```
All files:
- Statements: 92.68%
- Branches:   81.44% (>= 80.00% Coverage Gate Maintained)
- Functions:  93.36%
- Lines:      94.04%
Exit code: 0
```

### 4. Production Build (`npm run build`)
```
▲ Next.js 16.4.3 (Turbopack)
✓ Compiled successfully in 38.8s
✓ Finished TypeScript in 10.2s
✓ Collecting page data using 7 workers in 2.8s
✓ Generating static pages using 7 workers (26/26) in 1790ms
✓ Finalizing page optimization in 2.7s
Exit code: 0
```
