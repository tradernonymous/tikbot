import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { createSessionToken } from '@/security/auth';
import { DouyinTikTokClient } from '@/research/download-api-client';

describe('Research Video Analyzer Route (P7, S4 TDD)', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';
  let validToken: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SESSION_SECRET = secret;
    validToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret
    );
  });

  function makeRequest(body: any, token?: string): NextRequest {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    };
    if (token) {
      headers['cookie'] = `tikbot_session=${token}`;
    }
    return new NextRequest('http://localhost:3000/api/v1/research/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  it('rejects unauthenticated requests with 401', async () => {
    const res = await POST(makeRequest({ url: 'https://tiktok.com/@u/video/1' }));
    expect(res.status).toBe(401);
  });

  it('rejects invalid or missing URL with 400', async () => {
    const res = await POST(makeRequest({ url: '' }, validToken));
    expect(res.status).toBe(400);
  });

  it('fetches real video data via client, calculates outlier score, and labels provenance as live', async () => {
    vi.spyOn(DouyinTikTokClient.prototype, 'extractVideoData').mockResolvedValue({
      platform: 'TIKTOK',
      postId: '1234567890',
      caption: 'Top 3 business strategies that scaled our store #growth',
      playUrl: 'https://cdn.tiktok.internal/v123.mp4',
      coverUrl: 'https://cdn.tiktok.internal/c123.jpg',
      author: {
        id: 'auth_1',
        handle: 'growth_expert',
        nickname: 'Growth Expert',
      },
      stats: {
        views: 250000,
        likes: 35000,
        comments: 1200,
        shares: 4500,
      },
    });

    const res = await POST(
      makeRequest(
        { url: 'https://www.tiktok.com/@growth_expert/video/1234567890' },
        validToken
      )
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.provenance).toBe('live');
    expect(data.result.author).toBe('@growth_expert');
    expect(data.result.views).toBe(250000);
    expect(data.result.likes).toBe(35000);
    expect(data.result.outlierScore).toBeGreaterThan(0);
    expect(data.savedPostId).toBeDefined();
  });
});
