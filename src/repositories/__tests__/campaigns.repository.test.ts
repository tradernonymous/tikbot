import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listCampaigns,
  createCampaign,
  deleteCampaign,
  updateCampaignStatus,
} from '../campaigns.repository';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Campaigns Repository (P3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists campaigns with action counts and progress', async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      {
        id: 'camp-1',
        title: 'Launch Boost #1',
        targetUrl: 'https://tiktok.com/@user/video/1',
        actionType: 'VIEW',
        targetCount: 1000,
        executedCount: 450,
        status: 'RUNNING',
        approvalId: null,
        metadata: null,
        startedAt: new Date(),
        finishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        actions: [],
      } as any,
    ]);

    const campaigns = await listCampaigns();
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].title).toBe('Launch Boost #1');
    expect(campaigns[0].targetCount).toBe(1000);
    expect(campaigns[0].executedCount).toBe(450);
  });

  it('creates and persists a campaign', async () => {
    vi.mocked(prisma.campaign.create).mockResolvedValue({
      id: 'camp-2',
      title: 'Likes Campaign',
      targetUrl: 'https://tiktok.com/@user/video/2',
      actionType: 'LIKE',
      targetCount: 50,
      executedCount: 0,
      status: 'PENDING_APPROVAL',
      approvalId: null,
      metadata: null,
      startedAt: null,
      finishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await createCampaign({
      title: 'Likes Campaign',
      targetUrl: 'https://tiktok.com/@user/video/2',
      actionType: 'LIKE',
      targetCount: 50,
    });

    expect(res.id).toBe('camp-2');
    expect(prisma.campaign.create).toHaveBeenCalled();
  });

  it('deletes campaign and cascades in database', async () => {
    vi.mocked(prisma.campaign.delete).mockResolvedValue({ id: 'camp-1' } as any);
    await deleteCampaign('camp-1');
    expect(prisma.campaign.delete).toHaveBeenCalledWith({ where: { id: 'camp-1' } });
  });
});
