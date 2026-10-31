# Tikbot Compliance, Safety & Risk Mitigation Policy

## 1. Regulatory & Terms of Service Statement

Automated interactions, account generation, artificial view count inflation, and coordinated engagement can violate TikTok's Terms of Service and community guidelines. Unauthorized mass scraping or automated creation can also trigger computer fraud or anti-abuse statutes if not strictly sandboxed.

Tikbot is architected as an **internal research, content optimization, and controlled workflow harness** operated by an authenticated single administrator. 

---

## 2. Hard Policy Enforcements

### 2.1 Kill Switch Protocol
- **Global Halt**: A single physical toggle (`KILL_SWITCH_ACTIVE=true`) via environment variable, database flag, or admin UI immediately terminates all running browser processes, aborts active queue jobs, and resets running campaigns to `PAUSED_EMERGENCY`.
- **Zero Bypass**: Every background worker checks `KillSwitch.isActive()` before dispatching any browser invocation or network interaction.

### 2.2 Manual Approval Gate (Default Safe)
1. **Engagement Campaigns**: Any campaign involving Likes, Comments, Saves, Shares, or Live Views **MUST** enter `PENDING_APPROVAL` status. No bot action can begin without an explicit manual sign-off by the operator in the dashboard.
2. **Publishing Posts**: Video scheduling requires final operator approval unless explicitly flagged as auto-publish on a verified owned account.
3. **Account Creation Batches**: Provisioning accounts requires explicit operator confirmation before consuming SMS or proxy resources.

### 2.3 Strict Action Caps & Human Velocity Limits
To prevent aggressive platform abuse, network degradation, or rapid mass bans, hard limits are enforced in software:

| Action Type | Max per Account / Hour | Max per Account / Day | Randomized Jitter Delay |
|---|---|---|---|
| Video View (Watch time >= 75%) | 15 | 80 | 15s – 45s between views |
| Video Like | 5 | 25 | 45s – 120s between likes |
| Comment Post | 3 | 12 | 120s – 300s between comments |
| Profile Follow | 4 | 20 | 60s – 180s between follows |
| Video Save / Share | 4 | 15 | 60s – 180s between saves |
| Live View Session | 1 session (max 30m) | 2 sessions | Exponential ramp-up |

If an account reaches 80% of its daily threshold, the farm automatically transitions the account into `COOLDOWN` until UTC 00:00.

### 2.4 Proxy Compliance & Sticky IP Mapping
- **Residential / Mobile Proxies Only**: Datacenter IPs are prohibited for farm accounts to prevent instant subnet bans.
- **1-to-1 Sticky Binding**: Each platform account is permanently pinned to a dedicated proxy endpoint or sticky session hash. Switching IP regions within a 24-hour period is strictly rejected by the account manager.
- **Health Checks & Circuit Breaking**: If a proxy fails 3 consecutive health checks (latency > 3500ms or HTTP 403/429), it is marked `UNHEALTHY` and all assigned accounts are placed on hold.

### 2.5 Ban Detection & Graceful Fallback
- **Shadowban & Challenge Detection**: If an account encounters a Captcha checkpoint, SMS re-verify, or HTTP 403 Forbidden, the worker immediately updates the status to `RESTRICTED` or `BANNED`.
- **Quarantine**: Banned accounts are isolated. No further automated retries are attempted on a banned account. Audit logs record the trigger event and screenshot evidence.

### 2.6 Data Retention & Privacy
- **Downloaded Media Retention**: Scraped videos are held in temporary storage for a maximum of 30 days unless tagged by the operator into an active Content Pillar or permanent Archive.
- **Credentials & Session Security**: No raw passwords or plaintext session cookies are stored in database logs, job payloads, or application transcripts. All tokens are encrypted at rest using AES-256-GCM.
- **Right to Erasure**: Operator can issue a permanent purge of all profile archives, transcription blobs, and account data with a single command.

---

## 3. Operational Audit Trail
Every action taken by the system (scraping, comment generation, manual approval, proxy rotation, campaign launch) creates an immutable `AuditLog` record containing:
- `timestamp`: ISO 8601 UTC
- `operatorId`: ID of the authenticated operator
- `action`: Specific verb (`CAMPAIGN_APPROVE`, `KILL_SWITCH_ENGAGE`, `ACCOUNT_CREATE`, etc.)
- `resourceType` and `resourceId`: Target entity
- `ipAddress`: Request origin
- `metadata`: JSON payload of parameters (redacted of credentials)
