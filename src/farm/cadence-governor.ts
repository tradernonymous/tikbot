export interface CadenceGovernorConfig {
  minIpCooldownHours?: number;
  dailyPoolLimit?: number;
}

export interface CadenceCheckResult {
  allowed: boolean;
  reason?: string;
}

export class CadenceGovernor {
  private minIpCooldownHours: number;
  private dailyPoolLimit: number;
  private ipHistory = new Map<string, number>(); // ip -> lastTimestampMs
  private poolDailyHistory: number[] = []; // timestamps of creations within 24h

  constructor(config: CadenceGovernorConfig = {}) {
    this.minIpCooldownHours = config.minIpCooldownHours ?? 24;
    this.dailyPoolLimit = config.dailyPoolLimit ?? 10;
  }

  canCreateOnProxy(ip: string, nowMs = Date.now()): CadenceCheckResult {
    // 1. Check IP cooldown
    const lastCreation = this.ipHistory.get(ip);
    if (lastCreation) {
      const hoursSince = (nowMs - lastCreation) / (3600 * 1000);
      if (hoursSince < this.minIpCooldownHours) {
        return {
          allowed: false,
          reason: `Proxy IP ${ip} in cooldown (${hoursSince.toFixed(1)}h / ${this.minIpCooldownHours}h required)`,
        };
      }
    }

    // 2. Check daily pool limit
    const dayAgo = nowMs - 24 * 3600 * 1000;
    const recentPoolCreations = this.poolDailyHistory.filter((ts) => ts >= dayAgo);

    if (recentPoolCreations.length >= this.dailyPoolLimit) {
      return {
        allowed: false,
        reason: `Daily pool limit reached (${recentPoolCreations.length}/${this.dailyPoolLimit})`,
      };
    }

    return { allowed: true };
  }

  recordCreation(ip: string, nowMs = Date.now()): void {
    this.ipHistory.set(ip, nowMs);
    this.poolDailyHistory.push(nowMs);
  }
}
