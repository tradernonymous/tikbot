import crypto from 'crypto';

export interface IdempotencyEntry {
  status: 'PENDING' | 'COMPLETED';
  result?: unknown;
  timestamp: number;
}

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  lockAcquired: boolean;
  inFlight?: boolean;
  existingResult?: unknown;
}

export interface SMMIdempotencyOptions {
  windowMs?: number;
}

export class SMMIdempotencyManager {
  private windowMs: number;
  private entries = new Map<string, IdempotencyEntry>();

  constructor(options: SMMIdempotencyOptions = {}) {
    this.windowMs = options.windowMs ?? 10 * 60 * 1000; // 10 minutes default
  }

  generateKey(params: {
    campaignId?: string;
    service: string | number;
    link: string;
    quantity: number;
  }): string {
    const raw = `${params.campaignId || 'ad-hoc'}:${String(params.service).trim()}:${params.link.trim()}:${params.quantity}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
    return `smm:order:${params.campaignId || 'ad-hoc'}:${String(params.service).trim()}:${hash}`;
  }

  async checkAndLock(key: string, now = Date.now()): Promise<IdempotencyCheckResult> {
    const existing = this.entries.get(key);

    if (existing) {
      // Check if expired
      if (now - existing.timestamp > this.windowMs) {
        this.entries.delete(key);
      } else if (existing.status === 'COMPLETED') {
        return {
          isDuplicate: true,
          lockAcquired: false,
          existingResult: existing.result,
        };
      } else if (existing.status === 'PENDING') {
        return {
          isDuplicate: false,
          lockAcquired: false,
          inFlight: true,
        };
      }
    }

    // Acquire lock
    this.entries.set(key, {
      status: 'PENDING',
      timestamp: now,
    });

    return {
      isDuplicate: false,
      lockAcquired: true,
    };
  }

  async recordSuccess(key: string, result: unknown, now = Date.now()): Promise<void> {
    this.entries.set(key, {
      status: 'COMPLETED',
      result,
      timestamp: now,
    });
  }

  async releaseLock(key: string): Promise<void> {
    const existing = this.entries.get(key);
    if (existing && existing.status === 'PENDING') {
      this.entries.delete(key);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}

export const globalSMMIdempotency = new SMMIdempotencyManager();
