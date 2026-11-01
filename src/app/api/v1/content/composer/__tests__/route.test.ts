import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    trendSignal: {
      findMany: vi.fn(),
    },
    sound: {
      findMany: vi.fn(),
    },
    mediaAsset: {
      findMany: vi.fn(),
    },
    publishJob: {
      create: vi.fn(),
    },
    platformAccount: {
      findMany: vi.fn(),
    },
  },
}));

describe('W1.9 Content Composer REST API', () => {
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
    const req = new NextRequest('http://localhost:3000/api/v1/content/composer');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('provides trend and voc driven hashtag & sound suggestions', async () => {
    vi.mocked(prisma.trendSignal.findMany).mockResolvedValue([
      { id: 'ts-1', type: 'HASHTAG', signalKey: 'ecommerce', score: 90 } as any,
    ]);
    vi.mocked(prisma.sound.findMany).mockResolvedValue([
      { id: 's-1', title: 'Trending Beat 2026', platformSoundId: 'snd-123' } as any,
    ]);
    vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue([
      { id: 'm-1', storageKey: 'video.mp4' } as any,
    ]);

    const req = new NextRequest('http://localhost:3000/api/v1/content/composer', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.hashtagSuggestions).toHaveLength(1);
    expect(body.sounds).toHaveLength(1);
    expect(body.provenance).toBe('live');
  });

  it('schedules composed post into publish job queue in POST', async () => {
    vi.mocked(prisma.publishJob.create).mockResolvedValue({
      id: 'job-created-1',
      accountId: 'acc-1',
      mediaAssetId: 'media-1',
      caption: 'Top hook test #ecommerce',
      scheduledAt: new Date('2026-11-06T18:00:00Z'),
      status: 'PENDING',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/v1/content/composer', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        action: 'schedule',
        accountId: 'acc-1',
        mediaAssetId: 'media-1',
        caption: 'Top hook test #ecommerce',
        platform: 'TIKTOK',
        scheduledAt: '2026-11-06T18:00:00Z',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.job.id).toBe('job-created-1');
  });
});
