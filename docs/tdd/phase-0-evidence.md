# Phase 0 — Security Hotfix Evidence & Test Audit

**Milestone**: Phase 0 Security Hotfix  
**Branch**: `main`  
**Test Suite Status**: 54 test files, 242 tests passing (100% pass rate)  
**Coverage Gate**: Statements: 91.56%, Branches: 80.05%, Functions: 93.37%, Lines: 91.31% (Passed 80% threshold across all metrics)

---

## 1. Defects Remediated & Commit Evidence

| Task ID | Defect Summary | Resolution | Verified Commit |
|---|---|---|---|
| **S1** | Hardcoded `MASTER_ENCRYPTION_KEY` & `SESSION_SECRET` fallback keys | Deleted hardcoded fallback keys from `src/config/index.ts`. Enforced throw at boot in `NODE_ENV=production`. Added ephemeral generation with security warnings strictly in `NODE_ENV=development`. Tested with 7 config loader tests. | `8b93be39` |
| **S2, S3** | Fallback to password "admin" and "Default password: admin" printed in login UI | Removed default "admin" password. Route returns 503 if credentials not configured. Replaced string comparison with `crypto.timingSafeEqual`. Removed UI text block from `src/app/login/page.tsx`. | `e8a6c003` |
| **S4, S10** | Missing cookie signature verification in proxy and missing CSRF check on mutating endpoints | Created `src/proxy.ts` (replacing deprecated `middleware.ts`). Enforced `verifySessionToken` signature validation. Implemented shared `requireSession` helper validating session and enforcing CSRF Origin header check on POST/PUT/PATCH/DELETE. Exempted only static and login routes. | `bf7ea168` |
| **S5** | `apiUrl` and `apiKey` in request body was an SSRF primitive | Removed `apiUrl` and `apiKey` from input contract of `src/app/api/v1/smm/route.ts`. Validated body with Zod schema. Resolved URL and key server-side only. Enforced HTTPS and allowlist host verification (`supplierfollower.com`, `justanotherpanel.com`). Tested rejected SSRF payloads. | `0a41385a` |
| **S6** | Insecure default webhook secret & non-constant time comparison | Removed default `INTERNAL_API_SECRET`. Required explicit configuration (min 16 chars). Implemented constant-time buffer comparison with `crypto.timingSafeEqual` in `src/app/api/v1/webhooks/jobs/route.ts`. Tested rejected and accepted webhook payloads. | `d0dd8760` |
| **S7** | SMM API key stored in browser `localStorage` | Moved SMM API key server-side. Created `src/storage/system-settings.ts` and `src/app/api/v1/system/settings/route.ts` with AES-256-GCM encryption before storing in `SystemSetting` table. The key is never exposed in any GET response or client payload. Removed `TIKBOT_SMM_KEY` from `localStorage`. | `e0eb1bd5` |
| **S8** | Plaintext TikTok cookies persisted client-side in `cookiesJson` | Removed `cookiesJson` from `FarmAccount` client state. Created authenticated endpoint `src/app/api/v1/accounts/session/route.ts` that encrypts session cookies using AES-256-GCM via `encryptSecret` before persisting. Returns only `{ hasSession: true }`. Sanitized state hydration so no plaintext cookie touches `localStorage`. | `eda76f43` |
| **S9** | Missing login rate limiting | Implemented IP-based login rate limiter in `src/security/login-rate-limiter.ts`: max 5 attempts per minute per IP, 10 consecutive failures triggers 15-minute lockout. Tested with dedicated rate-limiting suite. | `e8a6c003` |
| **S11** | Cookie hardening & sliding session refresh | Cookie named `__Host-tikbot_session` in production, `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, 8h expiry. Automatic sliding token refresh occurs when less than 2h remain. | `e8a6c003`, `bf7ea168`, `0a41385a` |
| **P8** | Silent SMM order failure disguised as running success | Fixed `src/app/dashboard/panel/page.tsx`: on provider rejection or missing key, task is marked `FAILED` with real error message, failure banner is rendered, and no phantom running order is dispatched. | `5f878570` |
| **B5** | Incomplete `.env.example` and outdated ops documentation | Created comprehensive `.env.example` template with all keys documented. Reconciled `docs/operations/setup-and-run.md`. | `5f878570` |
| **B1** | Coverage gate failure (branches 71.77% < 80%) | Added comprehensive unit tests for `defaultSMMFetcher`, `getServices`, and `stealth-runner.ts`. Global branch coverage increased to 80.05% (passing 80% threshold). | `d64c7c30` |

---

## 2. Test Execution Verification

```bash
npm run test:coverage
```

Output:
```
✓ 54 test files passed (54)
✓ 242 tests passed (242)

Coverage Summary:
- % Statements: 91.56% (Threshold: 80%) -> PASS
- % Branches:   80.05% (Threshold: 80%) -> PASS
- % Functions:  93.37% (Threshold: 80%) -> PASS
- % Lines:      91.31% (Threshold: 80%) -> PASS
```

---

## 3. Next Phase Readiness

Phase 0 (Security Hotfix) is **100% complete, verified by test suites, and committed**.
Ready to transition to **Phase 1 — Real Persistence** (Tasks P1, P2, P3).
