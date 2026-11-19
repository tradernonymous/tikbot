# TikBot — Ops, Scale & Release (Phase 7)

Quick orientation. Everything runs with:

```bash
npm run dev        # dev
npm run start      # prod
npm run worker     # worker loop (real farm + publish execution)
```

## Health & Metrics

`GET /api/v1/metrics` (admin session) — queue depth, job success/fail/dead-letter, worker heartbeat age (stale count), system stats (uptime, node version).

## Runbooks

### Worker stuck

1. Check heartbeat: `GET /api/v1/metrics` → `workers.stale` — if a worker has `ageSeconds > 60`, it is dead or stalled (SIGKILL, kill switch, hung job).
2. In this repo, trigger: nothing auto-kills a hung worker — check `KILL_SWITCH` state via `/api/v1/system/kill-switch` first; if the worker is idle, restart it: `npm run worker`.
3. Fix: investigate why the job was hanging (phase logs via the worker stdout).

### Job failing repeatedly

1. `GET /api/v1/jobs` — check `lastError` + `deadLetterReason` on `DEAD_LETTER` jobs.
2. Common causes: missing driver (farm jobs — ensure `StealthFarmDriver` is registered: worker module wires it at boot), missing vaulted session (publish.upload), Download API sidecar down (research jobs → retry until max attempts).

### Prod kill switch

`POST /api/v1/system/kill-switch` (session-authenticated, origin-checked) — `{ active: true, reason }`. `GET /api/v1/system/kill-switch` to read.

## Restarting & Migrations

- `npm run db:migrate` — `prisma migrate deploy` against Postgres.
- CI (`.github/workflows/ci.yml`) — push to `main` runs: `npm ci`, `prisma generate`, `typecheck`, `test:coverage`, `npm run build`.

## Notes

- **Live intelligence (G6.12):** the tracker is in-process (`activeLiveTracker` in `src/app/api/v1/intelligence/live/route.ts`). It's created on `POST connect` but no production code connects it via `TikTok-Live-Connector` — viewer counts stay `0` until wired, and the UI already marks them as non-connected. If you want live viewer events, wire a connection: use `tiktok-live-connector` to a target handle, then `ingestLiveEvent(activeLiveTracker, { type: 'VIEWER_COUNT', ... })`.
- **V5 Download API sidecar:** optional, runs locally (`DouyinTikTokDownload_API`). If down, research analysis still works via the legacy client; if it 429s, the v5 adapter retries + circuit-breaks.

---

## Phase 7 Checklist

- [ ] R7.1 `GET /api/v1/metrics` — added (queue depth, job success/fail, worker staleness, uptime).
- [ ] R7.2 alerts — `emitWorkerStale` now fires in the worker loop every ~10s (stale > 60s); wired via `NotificationService.emitWorkerStale`; kill-switch + SMM emitters all wired.
- [ ] R7.3 backups — `scripts/backup-db.sh` + `scripts/restore-db.sh` (pg_dump/restore; verify locally once).
- [ ] R7.4 load/chaos — not yet run (quick smoke: `npm run worker`, hit `/api/v1/jobs`, kill, restart).
- [ ] R7.5 full E2E — login → account → research → approve → worker → notification → deep link → audit.
- [ ] R7.6 CSP without `unsafe-inline` — next.config.ts currently has `script-src 'unsafe-eval' 'unsafe-inline'`; drop these once Next 16 build passes (React production doesn't need them; if you add inline scripts, use nonces).
- [ ] R7.7 docs — this doc + `docs/plan/upgrade-plan-v2.md`.
