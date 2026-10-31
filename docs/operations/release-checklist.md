# Production Release Checklist & Rollback Plan

**Application**: `tikbot` — Research & Farm Automation Platform  
**Target**: Railway Production  
**Release Tag**: v1.0.0-gold

---

## 1. Pre-Flight Verification Checklist

| Check | Requirement | Result | Verified By |
|---|---|---|---|
| Strict TypeScript Compilation | `next build` passes with 0 errors | PASS | Antigravity Agent |
| Vitest Test Suite | 44 test files, 180 tests passing | PASS | Vitest 5.0.5 |
| Code Coverage Mandate | Lines, Funcs, Stmts, Branches >= 80% | PASS (97.18% Lines) | Vitest v8 Coverage |
| Database Migration Integrity | Prisma schema aligns with all bounded contexts | PASS | Prisma 6.4.1 |
| AES-256-GCM Cryptographic Vault | Zero plain-text credentials in logs or DB | PASS | Crypto Suite |
| Operational Kill Switch | Instant halt of queues, publishing, & actions | PASS | E2E Flow 1 |
| Manual Approval Governance | 100% of campaigns & publishing require sign-off | PASS | E2E Flow 3 |
| Redaction Verification | PII & tokens stripped from structured logs | PASS | Logger Suite |

---

## 2. Rollback & Disaster Recovery Procedures

### Scenario A: Platform Ban Spike or Anti-Bot Challenge Alert
1. **Immediate Step**: Engage Global Kill Switch via Top Nav UI or API POST `/api/v1/system/kill-switch`.
2. **Investigation**: Query `/api/health/readiness` and inspect `tikbot_accounts_banned` gauge.
3. **Recovery**: Rotate proxies in `ProxyPoolManager` and move affected accounts to `COOLDOWN` state for 72 hours.

### Scenario B: Database Migration or Service Rollback
1. Revert Railway deployment to previous release commit SHA via Railway Dashboard (`Rollback to this deployment`).
2. Run database rollback scripts:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```
3. Restart app and worker instances.

### Scenario C: Secret Key Compromise
1. Generate new 32-character master key.
2. Run Secret Rotation utility:
   ```bash
   npm run secrets:rotate -- --oldKey=<COMPROMISED_KEY> --newKey=<FRESH_KEY>
   ```
3. Update `APP_SECRET_KEY` in Railway environment variables and trigger zero-downtime redeploy.
