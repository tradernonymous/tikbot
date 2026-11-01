export class RateLimitBreachedError extends Error {
  constructor(keyId: string, limit: number) {
    super(`Rate limit of ${limit} req/min breached for API key: ${keyId}`);
    this.name = 'RateLimitBreachedError';
  }
}

export interface ApiUsageRecord {
  keyId: string;
  totalUsed: number;
  remaining: number;
  allowed: boolean;
  windowExpiresAt: string;
}

export interface AbuseAlert {
  id: string;
  keyId: string;
  type: 'RATE_LIMIT_EXCEEDED' | 'VOLUME_SPIKE';
  message: string;
  provenance: 'live' | 'cached' | 'unknown';
  timestamp: string;
}

export interface ApiMeterConfig {
  maxRequestsPerMinute?: number;
  windowSizeMs?: number;
}

export class ApiUsageMeter {
  private maxRequestsPerMinute: number;
  private windowSizeMs: number;
  private usageStore = new Map<string, { count: number; windowStart: number }>();
  private abuseAlerts: AbuseAlert[] = [];

  constructor(config: ApiMeterConfig = {}) {
    this.maxRequestsPerMinute = config.maxRequestsPerMinute ?? 60;
    this.windowSizeMs = config.windowSizeMs ?? 60_000;
  }

  recordRequest(keyId: string, nowMs = Date.now()): ApiUsageRecord {
    let current = this.usageStore.get(keyId);

    if (!current || nowMs - current.windowStart >= this.windowSizeMs) {
      current = { count: 0, windowStart: nowMs };
    }

    if (current.count >= this.maxRequestsPerMinute) {
      const alert: AbuseAlert = {
        id: `abuse-${Date.now()}-${keyId}`,
        keyId,
        type: 'RATE_LIMIT_EXCEEDED',
        message: `API Key ${keyId} exceeded rate limit (${this.maxRequestsPerMinute} req/min)`,
        provenance: 'live',
        timestamp: new Date().toISOString(),
      };
      this.abuseAlerts.push(alert);
      throw new RateLimitBreachedError(keyId, this.maxRequestsPerMinute);
    }

    current.count += 1;
    this.usageStore.set(keyId, current);

    const remaining = Math.max(0, this.maxRequestsPerMinute - current.count);
    const windowExpiresAt = new Date(current.windowStart + this.windowSizeMs).toISOString();

    return {
      keyId,
      totalUsed: current.count,
      remaining,
      allowed: true,
      windowExpiresAt,
    };
  }

  getUsage(keyId: string, nowMs = Date.now()): ApiUsageRecord {
    const current = this.usageStore.get(keyId);
    if (!current || nowMs - current.windowStart >= this.windowSizeMs) {
      return {
        keyId,
        totalUsed: 0,
        remaining: this.maxRequestsPerMinute,
        allowed: true,
        windowExpiresAt: new Date(nowMs + this.windowSizeMs).toISOString(),
      };
    }

    return {
      keyId,
      totalUsed: current.count,
      remaining: Math.max(0, this.maxRequestsPerMinute - current.count),
      allowed: current.count < this.maxRequestsPerMinute,
      windowExpiresAt: new Date(current.windowStart + this.windowSizeMs).toISOString(),
    };
  }

  getAbuseAlerts(): AbuseAlert[] {
    return [...this.abuseAlerts];
  }

  resetUsage(keyId: string): void {
    this.usageStore.delete(keyId);
  }
}
