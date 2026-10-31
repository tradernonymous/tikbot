# MVP Cut Line & Emergency Rollback Plan

## 1. MVP Scope Cut Line

To balance rapid deployment with operational safety and zero risk of uncontrolled platform actions, the feature boundaries are defined as follows:

### In Scope for MVP
1. **Core Platform Foundation**:
   - Single-operator authentication with Argon2/bcrypt and secure HTTP-only sessions.
   - Postgres-backed job queue with `FOR UPDATE SKIP LOCKED` and exponential backoff.
   - Encrypted secret vault (AES-256-GCM) for proxies, account passwords, and session cookies.
   - System-wide Kill Switch toggle accessible via API and top navigation bar.
2. **Research & Archive Layer**:
   - Video download & metadata archiving (no watermark) via self-hosted API and fallback scrapers.
   - Safe URL normalization (TikTok, Douyin, shortened redirect links).
   - Audio extraction and Whisper transcription pipeline.
   - Outlier detection math ($(\text{views} / \text{median}) \times \text{engagement}$) and transcript hook mining.
3. **Managed Farm & Account Pool**:
   - Account lifecycle state machine (`CREATED`, `WARMING`, `ACTIVE`, `COOLDOWN`, `BANNED`).
   - Sticky proxy association with country verification and health monitoring.
   - Human-velocity action caps (hourly and daily hard limits).
4. **Engagement Engine (Governed & Sandboxed)**:
   - Mandatory manual approval queue for every campaign before execution.
   - Like, comment, save, and viewer boost execution via stealth browser profiles.
   - Automated ban and challenge detection with immediate quarantine.
5. **Publishing & Content Ops**:
   - Media asset library with checksum deduplication.
   - Content composer with scheduled slots and manual publish approval.

### Out of Scope for MVP (Post-Launch Phase)
- Unsupervised, fully automated account creation without operator CAPTCHA/SMS verification gates.
- Multi-tenant client billing or Stripe subscription portals.
- Mobile device hardware farm integration (ADB / Android physical rigs).

---

## 2. Emergency Rollback Plan

### 2.1 Kill Switch (Level 1: Operational Stop)
If an abnormal number of account challenges occur, or if platform updates trigger errors:
1. Operator engages Kill Switch via the top navigation bar or `POST /api/v1/system/kill-switch { "active": true, "reason": "operator intervention" }`.
2. All running workers detect the signal within 1 second, abort browser processes, and cancel pending campaign actions.
3. No database data is lost; jobs return to paused status.

### 2.2 Database Schema Rollback (Level 2: Data Rollback)
Prisma migrations are strictly additive and versioned. If a migration introduces regressions:
1. Identify the failing migration index in `prisma/migrations/`.
2. Apply the corresponding down-migration script located in `prisma/rollbacks/`.
3. Verify integrity:
   ```bash
   npx prisma migrate status
   npm run test:integration
   ```

### 2.3 Railway Application Rollback (Level 3: Deployment Revert)
If a release build exhibits runtime bugs:
1. In the Railway dashboard or via CLI:
   ```bash
   railway rollback [DEPLOYMENT_ID]
   ```
2. Or checkout previous release tag and trigger immediate deployment:
   ```bash
   git checkout tags/v1.0.0-stable
   git push railway main
   ```
3. Run readiness check: `curl -f https://<app-domain>/api/health/readiness`.

### 2.4 Secret Compromise Protocol (Level 4: Key Rotation)
If the `MASTER_ENCRYPTION_KEY` or `OPERATOR_PASSWORD_HASH` is compromised:
1. Activate Kill Switch.
2. Generate a new 256-bit key: `openssl rand -hex 32`.
3. Run the offline re-encryption script `npm run secrets:rotate -- --old-key=$OLD --new-key=$NEW`.
4. Update Railway environment variables and redeploy all services simultaneously.
