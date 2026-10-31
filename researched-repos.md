# Researched Repositories Reference

Purpose: future reference for tikbot dashboard/app planning.

## Main Repo
- **tradernonymous/tikbot** — Mission: run research on related topics and create best ideas for organic marketing reach. Repo currently minimal (one-line README).

## Research & Content
- **bradautomates/head-of-content** — Claude Cowork social content research skill set. Platforms: X, Instagram, YouTube, TikTok. Uses Apify (X/IG/TikTok), TubeLab (YouTube), Gemini (video analysis). Engagement scoring and outlier detection. Outputs reports/playbooks. Useful for research dashboard and content planning.

## SMM Panels
- **mediarayek-me/smmbooster** — Laravel 8 SMM panel. Sell/resell social media marketing services via API providers. Categories, services, orders, API providers, payments (PayPal/Stripe), tickets, settings, SEO, languages. Useful for admin panel and service catalog.
- **zuramai/laravel-smm** — Referenced SMM panel; README not found at checked branches. Treat as possible duplicate/variant of Laravel SMM panel.

## Reply/UGC Automation
- **cameronking4/ReplyGuy-clone (BuzzDaddy)** — Next.js SaaS for AI-generated comments across X, LinkedIn, Reddit. Keyword scraping + organic replies promoting product. Stack: Next.js, Auth.js, Prisma, Tailwind, shadcn, Framer Motion. Useful for comment campaigns and UGC promotion.

## TikTok Data APIs
- **Evil0ctal/Douyin_TikTok_Download_API** — Self-hosted data API for Douyin, TikTok, Bilibili. Docker Compose, Postgres + Redis, identity pool, signing, scheduler, archive, downloads, transcription, watchlists, REST/MCP/CLI. Useful as primary data layer.
- **drawrowfly/tiktok-scraper** — Node CLI/module scraper. Profiles, hashtags, trends, music, single videos. Session/proxy support, no-watermark URLs, download history, batch mode. Useful for feed collection.
- **davidteather/TikTok-Api** — Python unofficial TikTok API via Playwright. Trending, profiles, video metadata. Requires ms_token/proxies. Useful for Python-side collection.

## TikTok Upload/Publishing
- **makiisthenes/TiktokAutoUploader (autotok)** — Multi-language uploader (Python, TS, Go). Login, upload, schedule, proxies, cloud browsers, MCP server, web app. Useful for publishing and account session management.

## Growth/View Bots
- **xtekky/TikTok-ViewBot** — Simple Python TikTok view bot using tls_client/requests. Lightweight, fast. High ToS risk. Useful only as reference for view-boost mechanics.

## OSINT & Multi-Platform Scraping
- **qeeqbox/social-analyzer** — OSINT tool across 1000+ sites. Profile discovery, scoring, metadata, screenshots, filters. Useful for cross-platform username discovery.
- **JustAnotherArchivist/snscrape** — Python scraper for Facebook, Instagram, Mastodon, Reddit, Telegram, Twitter, VK, Weibo. Useful for multi-platform research.

## Research Skills
- **ScrapeCreators/social-media-research-skills** — Agent skills for social research. Outlier posts, transcript intelligence, comment mining, competitor research, ad teardown, trend discovery, influencer prospecting, audience research, listening, demand research, creator teardown, repurposing. Useful for intelligence layer.

## Social Automation
- **growchief/growchief** — Social media automation/outreach tool. Playwright/Patchright stealth, workflows, concurrency, working hours, proxies, enrichment. Useful for farm orchestration and human-like actions.

## API Catalog
- **cporter202/social-media-scraping-apis** — Large catalog of 3,268 social scraping APIs (Apify-heavy). Useful as fallback/paid data providers.

## Social Media Management
- **brightbeanxyz/brightbean-studio** — Django open-source social media management platform. Multi-workspace, RBAC, composer, calendar, scheduling, approvals, inbox, analytics, media library, API/MCP. Useful for content operations and dashboard patterns.
- **nz-m/SocialEcho** — MERN social platform with automated content moderation (Perspective, TextRazor, Hugging Face) and context-based auth. Useful for moderation and auth ideas.
- **SamurAIGPT/postiz-cheap** — Next.js scheduler with Prisma/Postgres. Calendar, composer, previews, AI writing, account connections, publishing. Useful for scheduling UI and publishing flow.

## Recommended Reuse Map
- Data layer: Douyin_TikTok_Download_API + tiktok-scraper + TikTok-Api.
- Research layer: head-of-content + ScrapeCreators research skills.
- Publishing: TiktokAutoUploader.
- Farm orchestration: growchief patterns.
- SMM panel: smmbooster.
- Content ops: brightbean-studio + postiz-cheap.
- OSINT: social-analyzer + snscrape.