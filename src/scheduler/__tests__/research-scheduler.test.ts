import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  watchlistTarget: {
    findMany: vi.fn(),
    update: vi.fn().mockResolvedValue({ id: 't1', lastPolledAt: new Date() }),
  },
  researchPost: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  metricSample: {
    findFirst: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

import {
  listDueWatchlistTargets,
  enqueueWatchPoll,
  scheduleDueMetricsJobs,
  runDueScheduledJobs,
} from '../research-scheduler';

describe('R2.4/R2.5 — research watchlist + metrics scheduler (Phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists due watchlist targets (expired or never polled)', async () => {
    const now = Date.now();
    prismaMock.watchlistTarget.findMany.mockResolvedValue([
      { id: 't1', targetHandle: '@topcreator', pollIntervalHours: 24, lastPolledAt: new Date(now - 25 * 3600_000) },
      { id: 't2', targetHandle: 'b', pollIntervalHours: 24, lastPolledAt: new Date(now) },
      { id: 't3', targetHandle: 'c', pollIntervalHours: 24, lastPolledAt: null },
    ]);
    const due = await listDueWatchlistTargets();
    expect(due.map((d) => d.id).sort()).toEqual(['t1', 't3']);
  });

  it('enqueueWatchPoll marks the target polled and enqueues research.watch', async () => {
    const queue = { enqueue: vi.fn().mockResolvedValue({ id: 'job-1' }) } as any;
    await enqueueWatchPoll(queue, { id: 't1', targetHandle: '@user', pollIntervalHours: 24, lastPolledAt: null });
    expect(queue.enqueue).toHaveBeenCalledWith('research.watch', { handle: 'user', platform: 'TIKTOK' });
    expect(prismaMock.watchlistTarget.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { lastPolledAt: expect.any(Date) } });
  });

  it('scheduleDueMetricsJobs enqueues metrics.collect for posts without recent samples', async () => {
    const post = { id: 'p1', viewCount: 5000, likeCount: 100, commentCount: 10, shareCount: 5, createdAt: new Date(Date.now() - 8 * 3600_000) };
    prismaMock.researchPost.findMany.mockResolvedValue([post]);
    prismaMock.metricSample.findFirst.mockResolvedValue(null);
    const queue = { enqueue: vi.fn().mockResolvedValue({ id: 'job-2' }) } as any;
    await scheduleDueMetricsJobs(queue);
    expect(queue.enqueue).toHaveBeenCalledWith('metrics.collect', expect.objectContaining({ targetType: 'RESEARCH_POST', targetId: 'p1' }));
  });

  it('scheduleDueMetricsJobs skips posts with a recent sample', async () => {
    prismaMock.researchPost.findMany.mockResolvedValue([{ id: 'p1', viewCount: 5000, likeCount: 100, commentCount: 10, shareCount: 5, createdAt: new Date(Date.now() - 3600_000) }]);
    prismaMock.metricSample.findFirst.mockResolvedValue({ timestamp: new Date() });
    const queue = { enqueue: vi.fn() } as any;
    await scheduleDueMetricsJobs(queue);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it('runDueScheduledJobs polls due watchlists + schedules metrics jobs', async () => {
    prismaMock.watchlistTarget.findMany.mockResolvedValue([
      { id: 't1', targetHandle: '@user', pollIntervalHours: 24, lastPolledAt: null },
    ]);
    prismaMock.researchPost.findMany.mockResolvedValue([]);
    prismaMock.metricSample.findFirst.mockResolvedValue(null);
    const queue = { enqueue: vi.fn().mockResolvedValue({ id: 'job' }) } as any;
    await runDueScheduledJobs(queue);
    expect(queue.enqueue).toHaveBeenCalledWith('research.watch', expect.objectContaining({ handle: 'user' }));
  });
});
