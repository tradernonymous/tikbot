import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardAggregates } from '../dashboard-aggregates.repository';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    platformAccount: {
      count: vi.fn(),
    },
    campaign: {
      count: vi.fn(),
    },
    publishJob: {
      count: vi.fn(),
    },
    job: {
      count: vi.fn(),
    },
    researchPost: {
      aggregate: vi.fn(),
    },
  },
}));

describe('Dashboard Aggregates Repository (P5.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes server aggregates via parallel Prisma queries with live provenance', async () => {
    vi.mocked(prisma.platformAccount.count)
      .mockResolvedValueOnce(50) // total
      .mockResolvedValueOnce(35) // active
      .mockResolvedValueOnce(2);  // banned

    vi.mocked(prisma.campaign.count).mockResolvedValueOnce(3); // pending campaigns
    vi.mocked(prisma.publishJob.count).mockResolvedValueOnce(1); // pending publish
    vi.mocked(prisma.job.count).mockResolvedValueOnce(5); // running jobs
    vi.mocked(prisma.researchPost.aggregate).mockResolvedValueOnce({
      _max: { outlierScore: 4.8 },
    } as any);

    const aggregates = await getDashboardAggregates();

    expect(aggregates.provenance).toBe('live');
    expect(aggregates.totalAccounts).toBe(50);
    expect(aggregates.activeAccounts).toBe(35);
    expect(aggregates.bannedAccounts).toBe(2);
    expect(aggregates.pendingApprovals).toBe(4);
    expect(aggregates.runningTasksCount).toBe(5);
    expect(aggregates.maxOutlierScore).toBe(4.8);
    expect(aggregates.banRateFormatted).toBe('4.0%');
  });

  it('handles database connection failure gracefully with unknown provenance', async () => {
    vi.mocked(prisma.platformAccount.count).mockRejectedValueOnce(new Error('DB unreachable'));

    const aggregates = await getDashboardAggregates();

    expect(aggregates.provenance).toBe('unknown');
    expect(aggregates.totalAccounts).toBe(0);
    expect(aggregates.banRateFormatted).toBeNull();
  });
});
