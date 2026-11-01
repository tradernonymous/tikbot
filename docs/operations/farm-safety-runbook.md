# TikBot Farm Safety & Ops Runbook

## 1. Overview & Regulatory Grounding
Every safety mechanism in TikBot is mapped directly to official platform transparency and integrity documentation:
- **Artificial Amplification**: Prohibited by Community Guidelines. Mitigated via natural velocity decay curves (`F4.6`) and plausible engagement ratio bands (`F4.4`).
- **Spam & Repetitive Behaviors**: Prohibited by Community Guidelines. Mitigated via Jaccard distance uniqueness floors (`F4.5`) and staggered dwell variance (`F3.1`).
- **Coordinated Inauthentic Behavior & Cluster Detection**: Mitigated by `/24` proxy subnet decoupling and device fingerprint family dispersal (`F4.7`).
- **Reduced Discoverability**: Early detection via Reach Canaries (`F2.1`) and Target Post Canary checks (`F2.4`).

---

## 2. Canary Signals & Anomaly Taxonomy

| Signal | Detection Mechanism | Immediate Action | Escalation Path |
|---|---|---|---|
| `REACH_DROP` | Own post views fall below `median - MAD` for 2+ consecutive checks | Auto-quarantine farmer account (`F2.3`) | Exclude from all boost cohorts |
| `COMMENT_VISIBILITY_DROP` | Test comment absent upon anonymous public re-fetch | Auto-trip emergency kill switch | Pause active boost run immediately |
| `VELOCITY_COLLAPSE` | Target view velocity collapses below 30% baseline | Auto-trip emergency kill switch | Review target post status |
| `SUBNET_CLUSTER_BREACH` | Two actions scheduled on same target from same `/24` subnet | Constraint solver rejects assignment (`F4.7`) | Rebalance to alternate subnet |
| `CAPTCHA_BURST` | >= 3 captchas within 60 seconds | Cool-off mode (0x budget for 30m) (`H5.1`) | Proxy incident count incremented |

---

## 3. Cooldown & Pacing Tables

- **Proxy IP Cooldown**: Minimum 24 hours between new account creations on the same IP.
- **Daily Pool Limits**: Maximum 10 creations per pool per 24 hours.
- **Action Spacing**: Minimum 30 minutes between same-account actions on any single target link.
- **Account Aging Progression**:
  - `FRESH` (0-3 days): Passive browse only.
  - `JUNIOR` (3-14 days): Light views and likes.
  - `MATURE` (14-45 days): Comments and shares.
  - `PRIME` (45+ days): High-weight FYP_PUSH cohorts.

---

## 4. Restore-from-Quarantine Procedure

1. Verify account login via session vault validator (`H5.5`).
2. Confirm proxy is healthy and not flagged by proxy health scorer (`H5.2`).
3. Check Reach Canary history over last 3 posts to verify view normalization.
4. Execute manual restore action in `AutoQuarantineManager.restoreFromQuarantine(accountId, operatorNotes)`.
5. Re-enroll account into appropriate niche training curriculum.
