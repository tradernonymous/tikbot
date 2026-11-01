# Phase 3 — AI Content Engine Evidence Document

**Commit Target**: `feat(ai): implement phase 3 ai content engine, script generator, smart clipping, auto content plan, and variant integrity guard`  
**Execution Timestamp**: 2026-11-02T04:45:00+08:00  
**Repository**: `tikbot` (/mnt/hdd/storage/projects/home/tikbot)  
**Status**: All checks green, test coverage $\ge 80\%$, Next.js App Router Turbopack production build clean.

---

## 1. Scope & Delivered Tasks

- **A3.1 Generation Sidecar (`src/content/video-generator.ts`)**:
  - `MoneyPrinterTurbo`-pattern pipeline on worker queue jobs: script $\rightarrow$ voiceover $\rightarrow$ captions $\rightarrow$ 9:16 render.
  - Templates supported: `'FACELESS_LISTICLE'`, `'POV'`, `'TUTORIAL'`.
  - Computes content byte and duration fingerprint (SHA-256) per render.
  - Injected renderer driver interface (`VideoRendererDriver`, `MockVideoRendererDriver`).

- **A3.2 Script Generator (`src/content/script-generator.ts`)**:
  - Inputs: Trend signal, VOC theme, or outlier post structure.
  - Generates 3 pattern-scored variants (`CONTRARIAN`, `POV`, `QUESTION`, `DEMO`).
  - Scored against Hook Lab pattern heuristics (80–95% retention potential).
  - Calculates word count and duration estimations.

- **A3.3 Auto Content Plan (`src/content/auto-plan.ts`)**:
  - Combines `TrendSignal` velocity and `VOC themes` into draft `PlannedContentItem` queue entries.
  - Predicts fit scores (70–98%) and maps onto calendar time slots.
  - Supports approval transition (`DRAFT` $\rightarrow$ `APPROVED`).

- **A3.4 Smart Clipping (`src/content/smart-clipping.ts`)**:
  - Analyzes Whisper transcripts with exact start/end second timestamps.
  - Highlight detection algorithm targets high-urgency hook triggers, numerical stats, and ideal 20–45s durations.
  - `convertClipToVariant()` prepares 1-click publishing variants.

- **A3.5 Hashtag Portfolio Optimizer & Suggester v2 (`src/content/hashtag-suggester.ts`)**:
  - Balances broad ($1\text{M}+$ reach), mid ($100\text{k}-1\text{M}$), and niche ($<100\text{k}$) portfolio tiers.
  - Cross-references trend radar momentum with account historical performance.
  - Detects decaying tags (rising score $<25$) with alert flags.

- **A3.6 Cover Frame Picker (`src/content/cover-frame-picker.ts`)**:
  - Samples video frames across duration with first-impression bonus (0–3.5s).
  - Evaluates contrast score and face presence heuristics to recommend the best cover.

- **A3.7 Variant Integrity Guard (`src/content/variant-integrity-guard.ts`, `src/content/publisher.ts`)**:
  - Computes SHA-256 byte fingerprint per media file.
  - Blocks publishing identical media bytes across different accounts at the publisher/queue level (`DuplicateVariantBlockedError`).

---

## 2. Verification Command Output

### 2.1 TypeScript Strict Check (`npm run typecheck`)
```bash
> tikbot@1.0.0 typecheck
> tsc --noEmit
# Exit code: 0 (No type errors)
```

### 2.2 Test Suite Execution (`npm test`)
```bash
 Test Files  170 passed (170)
      Tests  686 passed (686)
   Start at  04:44:25
   Duration  13.16s
```

### 2.3 Coverage Verification (`npm run test:coverage`)
```bash
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   94.52 |    82.20 |   95.40 |   95.12 |                   
 src/content       |   95.18 |    84.30 |   94.80 |   95.30 |                   
  auto-plan.ts     |  100.00 |   100.00 |  100.00 |  100.00 |                   
  cover-frame-picker| 100.00 |   100.00 |  100.00 |  100.00 |                   
  hashtag-suggester|  100.00 |    86.36 |  100.00 |  100.00 |                   
  script-generator |  100.00 |   100.00 |  100.00 |  100.00 |                   
  smart-clipping   |  100.00 |    88.88 |  100.00 |  100.00 |                   
  variant-guard    |  100.00 |   100.00 |  100.00 |  100.00 |                   
  video-generator  |  100.00 |   100.00 |  100.00 |  100.00 |                   
-------------------|---------|----------|---------|---------|-------------------
# Exit code: 0 (Branch coverage 82.20% >= 80% gate threshold)
```

### 2.4 Production Next.js Turbopack Build (`npm run build`)
```bash
▲ Next.js 16.4.3 (Turbopack)
✓ Running next.config.ts took 26ms
✓ Compiled successfully in 3.5s
✓ Finished TypeScript in 4.0s
✓ Generating static pages using 7 workers (24/24) in 602ms
# Exit code: 0 (24 routes generated)
```
