import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    publishJob: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    platformAccount: {
      findMany: vi.fn(),
    },
    metricSample: {
      findMany: vi.fn(),
    },
  },
}));

describe('W1.8 Calendar REST API', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';
  let validToken: string;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = secret;
    validToken = createSessionToken(
      { userId: 'admin-1', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret
    );
  });

  it('returns 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/content/calendar');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('lists calendar jobs with recurring queue slots, heatmap and conflict detection', async () => {
    const mockJobs = [
      {
        id: 'job-1',
        accountId: 'acc-1',
        caption: 'Viral dropshipping hack',
        scheduledAt: new Date('2026-11-05T18:00:00Z'),
        status: 'PENDING',
        account: { id: 'acc-1', username: 'farm_bot_1', dailyActionBudget: 2 },
        mediaAsset: { id: 'm-1', storageKey: 'video1.mp4' },
      },
      {
        id: 'job-2',
        accountId: 'acc-1',
        caption: 'Part 2 hack',
        scheduledAt: new Date('2026-11-05T18:15:00Z'), // Conflict: 15 mins later
        status: 'PENDING',
        account: { id: 'acc-1', username: 'farm_bot_1', dailyActionBudget: 2 },
        mediaAsset: { id: 'm-2', storageKey: 'video2.mp4' },
      },
    ];

    vi.mocked(prisma.publishJob.findMany).mockResolvedValue(mockJobs as any);

    const req = new NextRequest('http://localhost:3000/api/v1/content/calendar?view=week', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.jobs).toHaveLength(2);
    expect(body.queueSlots).toBeDefined();
    expect(body.heatmap).toBeDefined();
    expect(body.conflicts).toHaveLength(1);
    expect(body.provenance).toBe('live');
  });

  it('reschedules a job in PATCH', async () => {
    vi.mocked(prisma.publishJob.update).mockResolvedValue({
      id: 'job-1',
      scheduledAt: new Date('2026-11-06T20:00:00Z'),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/v1/content/calendar', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        jobId: 'job-1',
        scheduledAt: '2026-11-06T20:00:00Z',
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.publishJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1' },
      })
    );
  });
});
