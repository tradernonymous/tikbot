import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    mediaAsset: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('W1.7 Media Library REST API', () => {
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
    const req = new NextRequest('http://localhost:3000/api/v1/content/media');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('lists media assets with aspect ratio, tags, and usage counts', async () => {
    const mockAssets = [
      {
        id: 'media-1',
        storageKey: 'videos/hook_test.mp4',
        mimeType: 'video/mp4',
        fileSizeBytes: 15420000,
        checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        durationSeconds: 28.5,
        width: 1080,
        height: 1920,
        metadata: { tags: ['ugc', 'hook'], variants: ['PORTRAIT_CROP'] },
        publishJobs: [{ id: 'job-1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue(mockAssets as any);

    const req = new NextRequest('http://localhost:3000/api/v1/content/media?tag=ugc', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.assets).toHaveLength(1);
    expect(body.assets[0].aspectRatio).toBe('9:16');
    expect(body.assets[0].usageCount).toBe(1);
    expect(body.provenance).toBe('live');
  });

  it('registers a new media asset in POST', async () => {
    vi.mocked(prisma.mediaAsset.create).mockResolvedValue({
      id: 'media-new',
      storageKey: 'videos/new_post.mp4',
      mimeType: 'video/mp4',
      fileSizeBytes: 8900000,
      checksumSha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      durationSeconds: 15.0,
      width: 1080,
      height: 1920,
      metadata: { tags: ['tutorial'] },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/v1/content/media', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        storageKey: 'videos/new_post.mp4',
        mimeType: 'video/mp4',
        fileSizeBytes: 8900000,
        durationSeconds: 15.0,
        width: 1080,
        height: 1920,
        tags: ['tutorial'],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.asset.id).toBe('media-new');
  });
});
