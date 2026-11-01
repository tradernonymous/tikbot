import type { CookieItem } from './session-vault';

export type ReAuthReason =
  | 'MISSING_CRITICAL_COOKIE'
  | 'SESSION_EXPIRED'
  | 'SESSION_NEAR_EXPIRY'
  | 'SESSION_STALE';

export interface ReAuthTask {
  id: string;
  accountId: string;
  platform: string;
  priority: 'HIGH' | 'CRITICAL';
  status: 'PENDING_OPERATOR' | 'RESOLVED';
  reason: ReAuthReason;
  details: string;
  createdAt: string;
}

export interface AccountSessionCheckInput {
  accountId: string;
  platform: 'TIKTOK' | 'DOUYIN' | 'INSTAGRAM' | string;
  capturedAt: string;
  cookies: CookieItem[];
}

export interface SessionHealthResult {
  accountId: string;
  isValid: boolean;
  needsReAuth: boolean;
  reAuthTask?: ReAuthTask;
  provenance: 'live' | 'cached' | 'unknown';
}

export interface SessionHealthMonitorConfig {
  staleAgeDays?: number; // default 14
  nearExpirySeconds?: number; // default 86400 (24 hrs)
  criticalCookieNames?: string[];
}

const DEFAULT_CRITICAL_COOKIES: Record<string, string[]> = {
  TIKTOK: ['sessionid'],
  DOUYIN: ['sessionid'],
  INSTAGRAM: ['sessionid', 'ds_user_id'],
};

export class SessionHealthMonitor {
  private staleAgeDays: number;
  private nearExpirySeconds: number;
  private criticalCookieMap: Record<string, string[]>;

  constructor(config: SessionHealthMonitorConfig = {}) {
    this.staleAgeDays = config.staleAgeDays ?? 14;
    this.nearExpirySeconds = config.nearExpirySeconds ?? 86400;
    this.criticalCookieMap = {
      ...DEFAULT_CRITICAL_COOKIES,
    };
    if (config.criticalCookieNames) {
      this.criticalCookieMap.DEFAULT = config.criticalCookieNames;
    }
  }

  checkSessionHealth(
    input: AccountSessionCheckInput,
    nowEpochSeconds = Date.now() / 1000
  ): SessionHealthResult {
    const platformKey = input.platform.toUpperCase();
    const requiredCookies =
      this.criticalCookieMap[platformKey] || this.criticalCookieMap.DEFAULT || ['sessionid'];

    // 1. Check critical cookies presence
    const cookieNames = new Set(input.cookies.map((c) => c.name));
    const missingCookie = requiredCookies.find((name) => !cookieNames.has(name));

    if (missingCookie) {
      return {
        accountId: input.accountId,
        isValid: false,
        needsReAuth: true,
        provenance: 'live',
        reAuthTask: this.buildReAuthTask(
          input.accountId,
          input.platform,
          'MISSING_CRITICAL_COOKIE',
          `Missing critical session cookie: ${missingCookie}`
        ),
      };
    }

    // 2. Check expired cookies
    for (const cookie of input.cookies) {
      if (cookie.expires !== undefined && cookie.expires > 0) {
        if (cookie.expires <= nowEpochSeconds) {
          return {
            accountId: input.accountId,
            isValid: false,
            needsReAuth: true,
            provenance: 'live',
            reAuthTask: this.buildReAuthTask(
              input.accountId,
              input.platform,
              'SESSION_EXPIRED',
              `Cookie ${cookie.name} expired at ${new Date(cookie.expires * 1000).toISOString()}`
            ),
          };
        }
      }
    }

    // 3. Check staleness from capturedAt
    const capturedTime = new Date(input.capturedAt).getTime();
    const ageDays = (nowEpochSeconds * 1000 - capturedTime) / (86400 * 1000);
    if (ageDays >= this.staleAgeDays) {
      return {
        accountId: input.accountId,
        isValid: false,
        needsReAuth: true,
        provenance: 'live',
        reAuthTask: this.buildReAuthTask(
          input.accountId,
          input.platform,
          'SESSION_STALE',
          `Session captured ${Math.floor(ageDays)} days ago (exceeds ${this.staleAgeDays}-day threshold)`
        ),
      };
    }

    return {
      accountId: input.accountId,
      isValid: true,
      needsReAuth: false,
      provenance: 'live',
    };
  }

  private buildReAuthTask(
    accountId: string,
    platform: string,
    reason: ReAuthReason,
    details: string
  ): ReAuthTask {
    return {
      id: `reauth-${accountId}-${Date.now()}`,
      accountId,
      platform,
      priority: reason === 'SESSION_EXPIRED' ? 'CRITICAL' : 'HIGH',
      status: 'PENDING_OPERATOR',
      reason,
      details,
      createdAt: new Date().toISOString(),
    };
  }
}
