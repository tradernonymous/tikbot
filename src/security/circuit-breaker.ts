import { prisma } from '@/lib/prisma';
import { globalNotificationService } from '@/notifications/service';

export interface CircuitBreakerOptions {
  banThreshold?: number;
  windowMs?: number;
}

export class CircuitBreakerTrippedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerTrippedError';
  }
}

export class BanRateCircuitBreaker {
  private banThreshold: number;
  private windowMs: number;
  private banEvents: Array<{ accountId: string; timestamp: number }> = [];
  private tripped = false;

  constructor(options: CircuitBreakerOptions = {}) {
    this.banThreshold = options.banThreshold ?? 3;
    this.windowMs = options.windowMs ?? 10 * 60 * 1000; // 10 minutes default
  }

  isTripped(): boolean {
    return this.tripped;
  }

  assertExecutionAllowed(): void {
    if (this.tripped) {
      throw new CircuitBreakerTrippedError(
        'Circuit breaker is TRIPPED: Excessive account ban rate detected. Operations paused.'
      );
    }
  }

  async recordBan(accountId: string, timestamp: number = Date.now()): Promise<void> {
    this.banEvents.push({ accountId, timestamp });
    await this.evaluate();
  }

  async evaluate(): Promise<boolean> {
    const cutoff = Date.now() - this.windowMs;
    this.banEvents = this.banEvents.filter((e) => e.timestamp >= cutoff);

    if (this.banEvents.length >= this.banThreshold && !this.tripped) {
      this.tripped = true;

      // Auto-pause active campaigns
      try {
        await prisma.campaign.updateMany({
          where: { status: 'RUNNING' },
          data: { status: 'PAUSED' },
        });
      } catch (err) {
        console.error('[CircuitBreaker] Failed to pause active campaigns:', err);
      }

      // Emit incident notification
      try {
        await globalNotificationService.emitIncident(
          'CRITICAL',
          'CIRCUIT_BREAKER_TRIPPED',
          `Ban circuit breaker tripped: ${this.banEvents.length} bans in 10 minutes. Active campaigns have been paused automatically.`
        );
      } catch (err) {
        console.error('[CircuitBreaker] Failed to emit incident notification:', err);
      }

      return true;
    }

    return this.tripped;
  }

  async reset(): Promise<void> {
    this.tripped = false;
    this.banEvents = [];
  }
}

export const globalBanRateCircuitBreaker = new BanRateCircuitBreaker();
