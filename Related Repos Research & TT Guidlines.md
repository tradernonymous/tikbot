# Related Repos Research & TT Guidlines

Purpose: single build-reference for all researched repositories and TikTok official
documentation positions used in tikbot plans (master plan v3 + farm extension plan v3-F).
Research dates: Nov 2026. Sources: GitHub search (stars > threshold, active push),
TikTok Newsroom / Community Guidelines / enforcement transparency pages.

---

## 1. Content, AI generation, repurposing

| Repo | Stars (Nov 2026) | Language | What it does | What tikbot takes | Lands in |
|---|---|---|---|---|---|
| [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | 137k | Python | Topic → script → TTS → subtitles → HD 9:16 short video, full FFmpeg pipeline, workflow automation | AI content engine blueprint (sidecar pattern, not vendored) | v3 A3.1 |
| [Anil-matcha/AI-Youtube-Shorts-Generator](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator) | 5.7k | Python | Long video → viral shorts. Whisper transcription + LLM highlight detection + auto vertical crop. Opus Clip / Vidyo alternative | Smart clipping: replace linear segmenter with ranked clip candidates + hook timestamps | v3 A3.4 |
| [krillinai/OpenCreator](https://github.com/krillinai/OpenCreator) | 14k | TypeScript | AI workspace: video translation + dubbing, 120+ languages, agent skills, downloader, editing | Localization pipeline for proven winners (STOP-AND-ASK before use: cost) | v3 M6.5 |
| [imputnet/cobalt](https://github.com/imputnet/cobalt) | 45.7k | Svelte/TS | Media downloader API, no watermarks, many platforms | Optional asset fetcher for media library (behind Download API sidecar) | v3 W1.7 |
| [JoeanAmier/TikTokDownloader](https://github.com/JoeanAmier/TikTokDownloader) | 17k | Python/JS | Douyin/TikTok works download + data collection, CSV/XLSX export, server mode | Export formats for reports page | v3 W1.6 |

## 2. Research, data, ingest

| Repo | Stars | Language | What it does | What tikbot takes | Lands in |
|---|---|---|---|---|---|
| [Evil0ctal/Douyin_TikTok_Download_API](https://github.com/Evil0ctal/Douyin_TikTok_Download_API) | 21k | Python | Self-hosted TikTok/Douyin/Bilibili data API. Identity pool, per-identity token buckets, circuit breaker, watchlists, counter snapshots, archive, offline speech-to-text, MCP | Primary data sidecar (already integrated) — v5 watchlist + snapshot endpoints feed PostSnapshot / MetricSample | v3 R2.8, R2.9 |
| [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) | 66k | Python | Research agent skill: Reddit, X, YouTube, HN, TikTok, web → grounded recency summary | Cross-platform trend synthesis pattern for trend radar + digests | v3 G6.1, G4.2 |
| [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) | 46.7k | TypeScript | RSS feeds for 100s of sites incl. TikTok users, hashtags | Cheap watch ingest channel for competitor watch (complements Download API polling) | v3 W1.4 |
| [davidteather/TikTok-Api](https://github.com/davidteather/TikTok-Api) | — | Python | Unofficial TikTok API via Playwright. Trending, profiles, video metadata. Needs ms_token/proxies | Python-side collection fallback | data layer fallback |
| [drawrowfly/tiktok-scraper](https://github.com/drawrowfly/tiktok-scraper) | — | Node | Profiles, hashtags, trends, music, batch mode. Stale since 2023 | NOT adopting (stale) — noted for completeness | — |
| [bellingcat/tiktok-hashtag-analysis](https://github.com/bellingcat/tiktok-hashtag-analysis) | 379 | Python | Hashtag co-occurrence analysis | Co-occurrence logic for trend radar map tab | v3 G6.1 |
| [qeeqbox/social-analyzer](https://github.com/qeeqbox/social-analyzer) | — | Node/PHP | OSINT across 1000+ sites, profile discovery + scoring | Cross-platform username discovery in OSINT module | src/intelligence/osint.ts |
| [JustAnotherArchivist/snscrape](https://github.com/JustAnotherArchivist/snscrape) | — | Python | Multi-platform scraper (FB, IG, Reddit, Telegram, X, Weibo) | Multi-platform research reference | Phase 6 research |
| [cporter2021/social-media-scraping-apis](https://github.com/cporter2021/social-media-scraping-apis) | — | catalog | 3,268 social scraping APIs (Apify-heavy) | Paid fallback catalog (STOP-AND-ASK) | optional fallback |
| [apify/apify-mcp-server](https://github.com/apify/apify-mcp-server) | 14.1k | TypeScript | Actor-based paid scraping via MCP | Paid fallback scraping (STOP-AND-ASK) | v3 R2 optional |

## 3. Scheduling, publishing, content ops

| Repo | Stars | Language | What it does | What tikbot takes | Lands in |
|---|---|---|---|---|---|
| [inovector/mixpost](https://github.com/inovector/mixpost) | 3.9k | PHP/Laravel | Self-hosted scheduler: named queues, recurring weekly slots, auto-assign next slot, per-platform post versions, hashtag groups, conditional follow-up comments | Calendar + queue model | v3 G6.4, W1.8 |
| [brightbeanxyz/brightbean-studio](https://github.com/brightbeanxyz/brightbean-studio) | 2.6k | Python/Django | Open-source social management: multi-workspace, RBAC, composer, calendar, approvals, unified inbox + sentiment + assignments, 7/30/90 analytics, Kanban idea board, per-event notification prefs, 90-day audit | Inbox model, approval stages, Kanban CRM, reports windows | v3 F1.4, G6.8, G6.9, W1.3, W1.5 |
| [SamurAIGPT/postiz-cheap](https://github.com/SamurAIGPT/postiz-cheap) | 1.4k | JS/Next.js | Free Postiz alternative: AI post writer, content calendar, 8 platforms, MIT | Composer/scheduler UX patterns | v3 G6.5 |
| [makiisthenes/TiktokAutoUploader (autotok)](https://github.com/makiisthenes/TiktokAutoUploader) | 1.2k | TS | Upload SDK: Playwright login once per account, proxy per account, upload/schedule, MCP | BrowserDriver implementation | v3 R3.3 |
| [dreammis/social-auto-upload](https://github.com/dreammis/social-auto-upload) | 16k | Python | Auto-upload to Douyin, Xiaohongshu, Shipinhao, TikTok, YouTube, Bilibili | Multi-platform upload driver patterns (YT/XHS/Bilibili) | v3 M6.1+ |
| [Katzca/AutoSocial](https://github.com/Katzca/AutoSocial) | 1.5k | — | Per-account queues, persisted browser profiles, cron/daily/instant scheduling, yt-dlp ingest, FFmpeg uniquifier | Queueing + variant uniqueness (identical-bytes ban guard) | v3 R3.8, A3.7 |
| [bradautomates/head-of-content](https://github.com/bradautomates/head-of-content) | — | skill | Cowork research skill: outlier detection, engagement scoring, reports/playbooks | Outlier scoring concepts | v3 R2.6 |
| [ScrapeCreators/social-media-research-skills](https://github.com/ScrapeCreators/social-media-research-skills) | — | skills | Transcript intelligence, comment mining, competitor research, ad teardown, influencer prospecting, listening | Intelligence layer patterns | v3 Phase 6 |
| [zerodytrash/TikTok-Live-Connector](https://github.com/zerodytrash/TikTok-Live-Connector) | 2.2k | Node | Real LIVE room events: viewer count, chat, likes, gifts, follows, questions. No creds | Live intel page data source (replaces any fake viewer count) | v3 G6.12, W1.10 |

## 4. Farm: stealth, personas, warmup, action mechanics

| Repo | Stars | Language | What it does | What tikbot takes | Lands in |
|---|---|---|---|---|---|
| [TechQaiser/persona-studio](https://github.com/TechQaiser/persona-studio) | 87 | Python+React | Self-hosted anti-detect profile manager. Coherent fingerprints, proxies, persistent sessions, pluggable engines (CloakBrowser/Camoufox/Patchright/Playwright), dashboard + CLI | Device persona generator + binding model | F1.1, F1.2 |
| [heretic-tech/apostate](https://github.com/heretic-tech/apostate) | 75 | Python | Open anti-detect Chromium. 153 patches. FPJS suspect 0, BrowserScan authentic. CI-verifiable builds | Stealth engine option for persona pool | F1.1 |
| [chentaymane/ManyFaces](https://github.com/chentaymane/ManyFaces) | 27 | Python | Profile manager, 3 engines per profile (Camoufox/Chromium/real Android), coherent fingerprints, one-click phone profiles, proxy-pool rotation, cookie management | Multi-engine profile pattern, cookie vault | F1, F2 |
| [yfedoseev/browser_oxide](https://github.com/yfedoseev/browser_oxide) | 123 | Rust | Stealth headless engine. Native BoringSSL TLS/JA4 fingerprint, real JS via deno_core, no Chromium/CDP. Python + MCP bindings | Network-layer fingerprint coherence (JA4) | F1.1 |
| [l-portet/tiktok-warmup-bot](https://github.com/l-portet/tiktok-warmup-bot) | 688 | JavaScript | Warm up TikTok accounts: human-like swiping, dwell variance, staggered sessions | Warmup/curriculum behavioral pattern | F3.1 |
| [bymork/TikTok-Follow-Heart-Views-Bot](https://github.com/bymork/TikTok-Follow-Heart-Views-Bot) | 431 | Node | Follow/heart/views request bot | Action primitive mechanics reference | F4.3, F4.4 |
| [Ifarra/TikTokBoost](https://github.com/Ifarra/TikTokBoost) | 132 | Python | Ghost engagement via zefoy.com | ANTI-PATTERN: flat instant spikes = flagged. Velocity curves do the opposite | F4.6 (negative reference) |
| [Zeeshanahmad4/TikTok-Shop-Affiliate-Outreach-Bot](https://github.com/Zeeshanahmad4/TikTok-Shop-Affiliate-Outreach-Bot) | 76 | Python | Outreach within TikTok account limits, human-mimicking behavior | Pacing-within-limits guardrail model | F6.1 |
| [growchief/growchief](https://github.com/growchief/growchief) | 3.5k | — | Stealth browser orchestration, concurrency, working hours, proxy per worker | Farm runner orchestration | v3 R3.1 |
| [xtekky/TikTok-ViewBot](https://github.com/xtekky/TikTok-ViewBot) | — | Python | tls_client view inflation | NOT adopting: no telemetry, no retention, highest ban risk. Reference only | — |

## 5. SMM panels (existing integration context)

| Repo | Stars | What it does | What tikbot takes |
|---|---|---|---|
| [mediarayek-me/smmbooster](https://github.com/mediarayek-me/smmbooster) | — | Laravel SMM panel: services, orders, API providers, payments, tickets | Admin panel + service catalog patterns (tikbot SMM module) |
| [cameronking4/ReplyGuy-clone (BuzzDaddy)](https://github.com/cameronking4/ReplyGuy-clone) | — | Next.js AI comment SaaS: keyword scraping, organic replies | Comment campaign UX |
| [nz-m/SocialEcho](https://github.com/nz-m/SocialEcho) | — | MERN + automated moderation (Perspective, TextRazor, HF) | Moderation ideas for inbox sentiment |

---

## 6. TikTok official documentation positions

Sources are TikTok's own published pages. Each position maps to a design rule in tikbot
plans. URL patterns below; re-verify pages at build time, TikTok reorganizes docs.

### 6.1 Recommendation system ("For You" ranking)

Source: TikTok Newsroom — "How TikTok Recommends Videos #ForYou"
https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you

Published signals:

1. **User interactions**: likes, shares, comments, follows, watch completion, rewatch,
   "not interested" marks. Strong weight on watch time / completion / rewatch.
2. **Video information**: captions, sounds, hashtags, effects, trending topics.
3. **Device and account settings**: language preference, country setting, device type.
   Weaker weight than interactions.

tikbot consequences:

- Boost value = completion + rewatch + diverse engagement types, NOT raw view/like counts
  (F4.3, F4.4).
- Engagement from niche-aligned accounts carries more ranking weight than random
  accounts — hence niche training (F3).
- Sound/hashtag choice materially affects distribution — trend radar + hashtag portfolio
  optimizer feed composer suggestions (v3 A3.5, G4.4).
- TikTok Research API is academic/non-profit only, delivered via Virtual Compute
  Environment — NOT usable for this product. Never plan on it.

### 6.2 Community Guidelines — Integrity & Authenticity

Source: https://www.tiktok.com/community-guidelines (Integrity & Authenticity section)

Positions:

- **Fake engagement prohibited**: buying, selling, or exchanging views, likes,
  followers, shares, or comments; artificial amplification; engagement schemes.
- **Circumvention prohibited**: evading enforcement, including operating new accounts
  after a ban, using alternative apps/platforms to circumvent restrictions.
- **Spam behavior prohibited**: mass identical actions, repetitive comments,
  bulk messaging, follower-for-follower schemes.

tikbot consequences:

- All farm actions mimic organic distribution: time-spread, device/IP varied, no
  identical text (F4.5, F4.6).
- Binding matrix prevents a visible cluster graph linking accounts to each other or to
  previously banned assets (F1.2, F4.7).
- Comment uniqueness floor + text pools + no fixed intervals (F4.5, F6.1).
- Guardrails reduce detection risk but CANNOT zero it — ToS-risk acceptance is an
  explicit stop-and-ask before any production run (F-plan stop-and-ask).

### 6.3 Enforcement: reduced discoverability ("shadow" restriction)

Source: TikTok enforcement / transparency pages
https://www.tiktok.com/transparency (enforcement reports); in-app notices
("This video isn't eligible for the For You feed")

Positions:

- Content or accounts violating guidelines can be made **ineligible for the For You
  feed** (reduced discoverability) with or without full removal.
- Borderline content gets reduced distribution.
- TikTok shows "content ineligible for For You" notices on affected videos.

tikbot consequences:

- Reach canary: track own-post view sampling per account; falling below the account's
  own baseline band flags REACH_DROP (F2.1). Detects soft restriction without any API.
- Target-account monitor during boost runs: comment visibility check, FYP landing
  check via fresh-session search (F2.4). Any negative signal pauses the run.
- Provenance labels on every health metric (live / cached / stale) — no fabricated
  health scores.

### 6.4 Content Posting API (official publish path)

Source: TikTok for Developers — Content Posting API docs
https://developers.tiktok.com/doc/content-posting-api-get-started

Positions:

- Unaudited client apps can only post **private/self-only** videos.
- Public posting requires `video.publish` scope + app audit.
- Direct Post requires audited app; unaudited apps upload to drafts (SELF_ONLY).

tikbot consequences:

- OfficialDriver records SELF_ONLY honestly until audit passes (v3 R3.3).
- BrowserDriver (autotok pattern, session vault) is the working publish path.
- Never fabricate a TikTok URL on publish success (v2 R0.2 truth rule stays).

### 6.5 Discovery path and signal weight

Position (from FYP explainer + observed behavior): views arriving directly on a watch
URL behave differently in distribution terms than views arriving via search, profile,
or For You feed. Direct-link-only traffic patterns read as manipulated.

tikbot consequences:

- Discovery-path diversity: boost traffic mixed across search-handle → profile → video,
  search hashtag/sound → video, and some direct (F4.2). Default mix weighted like
  organic referral: majority search/profile, minority direct.
- No naked-URL-only boost runs.

---

## 7. Consolidated reuse map

- Data layer: Douyin_TikTok_Download_API (primary sidecar) + RSSHub (cheap watch feeds)
  + TikTok-Api / cobalt (fallbacks)
- Research layer: last30days-skill + head-of-content + ScrapeCreators skills +
  bellingcat hashtag analysis
- Content generation: MoneyPrinterTurbo (pipeline) + AI-Youtube-Shorts-Generator
  (clipping) + OpenCreator (localization, stop-and-ask)
- Publishing: autotok (BrowserDriver) + social-auto-upload (multi-platform) +
  Official Content Posting API (SELF_ONLY honesty)
- Content ops: mixpost (calendar/queues) + brightbean-studio (inbox/CRM/approvals) +
  postiz-cheap (composer UX)
- Farm personas: persona-studio + ManyFaces + apostate + browser_oxide
- Farm warmup: tiktok-warmup-bot pattern
- Farm actions: growchief orchestration + bymork primitives + outreach-bot pacing model
- Anti-patterns (never copy): flat instant spike boosts (TikTokBoost/zefoy),
  raw view inflation without retention (xtekky viewbot)
- TikTok docs: FYP ranking (Newsroom), Community Guidelines (Integrity & Authenticity),
  enforcement transparency (reduced discoverability), Content Posting API (SELF_ONLY)

## 8. Standing rules carried from this research

1. Never build on the Research API (academic-only).
2. Never promise public posting via Content Posting API before audit passes.
3. Every action keeps kill switch, caps, approval gates, provenance labels.
4. Every guardrail in F6 carries a docRef to the guideline section it defends against.
5. Stop-and-ask: paid APIs, real credentials, phone verification spend, SMM/proxy
   spend, ToS-risk acceptance for production farm runs.
