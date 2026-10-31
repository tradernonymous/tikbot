import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountRateLimiter } from '../rate-limiter';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    accountActionLedger: {
      create: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('AccountRateLimiter with Database Action Ledger (P6 TDD)', () => {
  let limiter: AccountRateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    limiter = new AccountRateLimiter();
  });

  it('handles unknown action types safely by returning allowed: false without throwing', async () => {
    // When passed an unknown action, must NOT throw!
    const result = await limiter.canPerformAction('acc-1', 'UNKNOWN_BURST_HACK' as any);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('unknown action');
  });

  it('records actions into the database action ledger', async () => {
    const timestamp = Date.now();
    vi.mocked(prisma.accountActionLedger.create).mockResolvedValue({
      id: 'ledger-1',
      accountId: 'acc-1',
      actionType: 'LIKE',
      timestamp: new Date(timestamp),
    });

    await limiter.recordAction('acc-1', 'LIKE', timestamp);

    expect(prisma.accountActionLedger.create).toHaveBeenCalledWith({
      data: {
        accountId: 'acc-1',
        actionType: 'LIKE',
        timestamp: new Date(timestamp),
      },
    });
  });

  it('enforces hourly cap from database action ledger', async () => {
    // Hourly cap for LIKE is 5
    vi.mocked(prisma.accountActionLedger.count)
      .mockResolvedValueOnce(5) // hourly count
      .mockResolvedValueOnce(5); // daily count

    const result = await limiter.canPerformAction('acc-1', 'LIKE');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Hourly cap exceeded');
    expect(result.hourlyCount).toBe(5);
  });

  it('enforces daily cap from database action ledger', async () => {
    // Daily cap for LIKE is 25
    vi.mocked(prisma.accountActionLedger.count)
      .mockResolvedValueOnce(3) // hourly count
      .mockResolvedValueOnce(25); // daily count

    const result = await limiter.canPerformAction('acc-1', 'LIKE');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Daily cap exceeded');
    expect(result.dailyCount).toBe(25);
  });

  it('survives process restarts by reading from the ledger in new instances', async () => {
    // First instance records actions
    vi.mocked(prisma.accountActionLedger.create).mockResolvedValue({} as any);
    await limiter.recordAction('acc-survive', 'VIEW');

    // Simulate process restart by creating a new instance
    const newLimiterInstance = new AccountRateLimiter();

    // Database returns the recorded count
    vi.mocked(prisma.accountActionLedger.count)
      .mockResolvedValueOnce(15) // hourly max reached
      .mockResolvedValueOnce(15);

    const checkAfterRestart = await newLimiterInstance.canPerformAction('acc-survive', 'VIEW');
    expect(checkAfterRestart.allowed).toBe(false);
    expect(checkAfterRestart.reason).toContain('Hourly cap exceeded');
  });

  it('resets account ledger records', async () => {
    vi.mocked(prisma.accountActionLedger.deleteMany).mockResolvedValue({ count: 5 });

    await limiter.resetAccount('acc-1');
    expect(prisma.accountActionLedger.deleteMany).toHaveBeenCalledWith({
      where: { accountId: 'acc-1' },
    });
  });
});
