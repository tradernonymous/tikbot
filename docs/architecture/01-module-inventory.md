# Reusable Module Inventory & Mapping

This inventory documents all open-source repositories and architectural components analyzed for the **tikbot Research + TikTok Farm Dashboard**, specifying integration methods, extraction boundaries, and reuse strategy.

---

## 1. Research & Content Intelligence

### 1.1 `bradautomates/head-of-content`
- **Focus**: Social content intelligence pipeline across TikTok, X, Instagram, YouTube.
- **Key Assets**:
  - Engagement anomaly & outlier scoring algorithms ($(\text{views} / \text{median\_views}) \times \text{engagement\_rate}$).
  - LLM prompt templates for video analysis, script hooks, VOC (Voice of Customer), and content playbooks.
- **Integration**: Re-implemented in TypeScript in `@tikbot/research/intelligence/outliers` and `@tikbot/research/intelligence/prompts`.

### 1.2 `ScrapeCreators/social-media-research-skills`
- **Focus**: Modular agent skills for social listening, competitor teardowns, transcript mining, and audience personas.
- **Key Assets**:
  - Structured extraction schemas for:
    - Outlier hooks and thumbnail patterns
    - Claim-evidence decomposition
    - Comment sentiment, objection clustering, and product friction points
    - Repurposing playbooks across short-form platforms
- **Integration**: Direct schema and prompt translation into Phase 3 intelligence modules.

---

## 2. TikTok Data Scraping & Sidecars

### 2.1 `Evil0ctal/Douyin_TikTok_Download_API`
- **Focus**: High-performance asynchronous API for TikTok/Douyin video and metadata extraction with watermark removal.
- **Key Assets**:
  - Request signing headers (bogus, msToken, verifyFp generation).
  - Clean video extraction endpoints for standard and HD streams.
  - Proxy rotation and identity pool architecture.
- **Integration**: Sidecar service deployed on Railway private network or external self-hosted instance, wrapped by Node.js client `DouyinTikTokClient`.

### 2.2 `drawrowfly/tiktok-scraper`
- **Focus**: Node.js CLI & library for profile, hashtag, music, and trending feeds.
- **Key Assets**:
  - Batch feed pagination logic.
  - User-agent and mobile viewport header spoofing.
- **Integration**: Integrated as fallback data provider bridge when primary API experiences regional bans or rate limits.

### 2.3 `davidteather/TikTok-Api`
- **Focus**: Python Playwright-driven TikTok wrapper.
- **Key Assets**:
  - Headless browser session generation for tricky TikTok Web API endpoints (`ms_token` signing).
  - Complete author feed and sound scrape routines.
- **Integration**: Packaged into lightweight Python 3.12 sidecar (`sidecars/tiktok-py`) exposing internal REST/gRPC endpoints to Next.js worker.

---

## 3. Account Automation, Session Management & Uploading

### 3.1 `makiisthenes/TiktokAutoUploader (autotok)`
- **Focus**: Multi-language TikTok uploader supporting cloud browser sessions and cookie persistence.
- **Key Assets**:
  - Chrome user profile directory persistence and session restoration.
  - Drag-and-drop / file input file upload DOM interactions.
  - Video caption, privacy, and sound selection automation.
- **Integration**: Reused in Phase 6 Content Operations (`@tikbot/publisher/autotok-bridge`).

### 3.2 `growchief/growchief`
- **Focus**: Human-emulated browser automation framework using Playwright/Patchright stealth.
- **Key Assets**:
  - Humanized curve movements (Bézier curves for cursor, randomized typing delay with typos).
  - Working-hour scheduling and randomized session durations.
  - Fingerprint masking (canvas, WebGL, audio, client hints).
- **Integration**: Core reference for Phase 4 Farm warmup and Phase 5 Engagement action engine (`@tikbot/farm/stealth`).

### 3.3 `xtekky/TikTok-ViewBot`
- **Focus**: Lightweight TLS-fingerprinted HTTP client for view emulation.
- **Key Assets**:
  - `tls_client` / JA3/JA4 fingerprinting patterns.
- **Safety Policy**: Kept in quarantine; view booster in production is capped, strictly rate-limited, and requires manual operator kill-switch controls.

---

## 4. Multi-Platform Scraping & OSINT

### 4.1 `qeeqbox/social-analyzer`
- **Focus**: Cross-platform OSINT username availability and profile metadata extraction across 1,000+ sites.
- **Key Assets**:
  - RegEx patterns and detection endpoints for username footprints.
  - Scoring algorithm for cross-platform profile ownership confidence.
- **Integration**: Integrated into Research Phase 3 (`@tikbot/research/osint`).

### 4.2 `JustAnotherArchivist/snscrape`
- **Focus**: Multi-platform archive scraper without API keys.
- **Key Assets**:
  - Historical query generation across Twitter/Reddit/Instagram.
- **Integration**: Reference for background cross-platform context gathering.

---

## 5. UI, Workflow & SMM Panel Architecture

### 5.1 `cameronking4/ReplyGuy-clone (BuzzDaddy)`
- **Focus**: Next.js 14/15 SaaS with Tailwind, Prisma, and AI reply campaigns.
- **Key Assets**:
  - Campaign state machine (Draft -> Pending Review -> Approved -> Running -> Completed).
  - Relatable comment generation pipeline with tone constraints.
- **Integration**: Directly informs Phase 5 Campaign Orchestration and Review Queue UI.

### 5.2 `brightbeanxyz/brightbean-studio` & `SamurAIGPT/postiz-cheap`
- **Focus**: Modern content calendar, queue manager, media asset repository, and multi-platform preview UI.
- **Key Assets**:
  - Drag-and-drop calendar matrix with scheduling time-slots.
  - Pre-signed URL asset upload with media variant processing.
- **Integration**: Informs Phase 6 UI components (`components/calendar`, `components/composer`).

### 5.3 `mediarayek-me/smmbooster`
- **Focus**: SMM service catalog, order orchestration, external provider balance sync.
- **Key Assets**:
  - Service definition schema (Service ID, Category, Rate per 1k, Min/Max quantity, Drip-feed parameters).
  - Standard SMM provider API protocol (v2 compatibility: `add`, `status`, `balance`, `services`).
- **Integration**: Informs Phase 7 SMM Provider Adapter and Order Pipeline.
