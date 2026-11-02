import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { createSessionToken } from '@/security/auth';

describe('Research OSINT Route (P7, S4)', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';
  let validToken: string;

  beforeEach(() => {
    process.env.SESSION_SECRET = secret;
    validToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret
    );
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('tiktok.com') || url.includes('youtube.com')) {
        return {
          status: 200,
          text: async () => '<html><head><title>Charli (@charli) TikTok</title></head><body>OK</body></html>',
        } as any;
      }
      return { status: 404, text: async () => 'not found' } as any;
    });
  });

  function makeRequest(body: any, token?: string): NextRequest {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    };
    if (token) {
      headers['cookie'] = `tikbot_session=${token}`;
    }
    return new NextRequest('http://localhost:3000/api/v1/research/osint', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  it('rejects unauthenticated request with 401', async () => {
    const res = await POST(makeRequest({ username: 'charli' }));
    expect(res.status).toBe(401);
  });

  it('validates input and returns real OSINT discovery results', async () => {
    const res = await POST(
      makeRequest(
        {
          username: 'charli',
          platforms: ['TIKTOK', 'YOUTUBE'],
        },
        validToken
      )
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.results).toHaveLength(2);
    expect(data.provenance).toBe('live');
  });

  it('returns 400 for empty username', async () => {
    const res = await POST(makeRequest({ username: '' }, validToken));
    expect(res.status).toBe(400);
  });
});
