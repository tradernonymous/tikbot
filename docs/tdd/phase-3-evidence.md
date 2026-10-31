# Phase 3 — Real Research Data Evidence & Verification

## Overview
Phase 3 removes simulated and fabricated numbers from research paths across `tikbot`. Video analysis, cross-platform OSINT discovery, VOC comment mining, and python sidecar communications now operate with real network probes, real backend route handlers, strict secret validation, and clear data provenance labelling.

---

## Completed Tasks

### Real Video Data & Outlier Analysis
- **API Route**: Created `src/app/api/v1/research/analyze/route.ts` with test coverage in `src/app/api/v1/research/analyze/__tests__/route.test.ts`.
- **Extraction Client**: Uses `DouyinTikTokClient` to retrieve real views, likes, comments, shares, play URLs, and author metadata.
- **Outlier Scoring**: Computes actual outlier score against baseline (`views / baseline`) rather than returning a hardcoded `480k views / 5.4x`.
- **Provenance**: Labels returned analytics as `provenance: 'live'` and surfaces this transparently in the Research dashboard UI.

### Honest Cross-Platform OSINT Discovery
- **Default Probe Fetcher**: Implemented `defaultPlatformProbeFetcher` in `src/intelligence/osint.ts` with timeouts, user-agent headers, and soft-404 detection ("user not found", "account doesn't exist").
- **API Route**: Created `src/app/api/v1/research/osint/route.ts` with session authentication and CSRF origin verification.
- **Eliminated Fake Statuses**: Replaced the previous `exists: false` hardcode and page-level simulated `exists: true` mock with real probe requests and honest confidence metrics.

### VOC Comment Mining & Provenance Transparency
- **Honest Metrics**: Removed `Math.random() * 50` like count generation from `src/app/dashboard/research/page.tsx`. Assigned honest zero-baseline like counts for unmetered plain text inputs.
- **UI Provenance Badges**: Styled badges for `LIVE`, `CACHED`, and `SIMULATED` metadata display across researched outlier items.

### Python Sidecar Hardening
- **Secret Enforcement**: Removed the fallback secret in `sidecars/tiktok-py/app.py`. Enforces `INTERNAL_API_SECRET` and rejects boot in production if missing.
- **Constant-Time Verification**: Replaced plain string equality with `hmac.compare_digest` to prevent timing attacks.
- **Gated Fallbacks**: Restricted canned simulation fixtures strictly to development environments (`NODE_ENV !== 'production'`). In production, returns live empty data or 501 Not Implemented.

---

## Verification & Metrics
- **Unit Tests**: 73 test files, 334 unit tests passing.
- **Branch Coverage Gate**: **81.24%** (Exceeds >= 80.00% threshold).
- **TypeScript**: `npx tsc --noEmit` passes with 0 errors.
- **Build**: `next build` passes.
