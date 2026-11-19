import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  researchPost: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

import { applyBaselineOutlierScore } from '../outlier-scoring';

describe('R2.6 — persisted outlier scoring on stored baselines (Phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates outlierScore when creator has sufficient stored baseline', async () => {
    prismaMock.researchPost.findUnique.mockResolvedValue({
      id: 'p1',
      viewCount: 5000,
      creator: { id: 'c1' },
    });
    prismaMock.researchPost.findMany.mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => ({ viewCount: 1000 + i * 100 }))
    );
    await applyBaselineOutlierScore('p1');
    // median of [1000..1500] = 1250. outlierScore = 5000/1250 = 4.0
    expect(prismaMock.researchPost.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: expect.objectContaining({ outlierScore: 4.0 }),
    });
  });

  it('skips the update when baseline is insufficient (honesty)', async () => {
    prismaMock.researchPost.findUnique.mockResolvedValue({ id: 'p1', viewCount: 5000, creator: { id: 'c1' } });
    prismaMock.researchPost.findMany.mockResolvedValue([{ viewCount: 0 }]);
    await applyBaselineOutlierScore('p1');
    expect(prismaMock.researchPost.update).not.toHaveBeenCalled();
  });

  it('no-op when the post has no creator', async () => {
    prismaMock.researchPost.findUnique.mockResolvedValue({ id: 'p1', viewCount: 5000, creator: null });
    await applyBaselineOutlierScore('p1');
    expect(prismaMock.researchPost.update).not.toHaveBeenCalled();
  });

  it('swallows scoring errors (best-effort)', async () => {
    prismaMock.researchPost.findUnique.mockRejectedValue(new Error('db down'));
    await expect(applyBaselineOutlierScore('p1')).resolves.toBeUndefined();
  });
});
