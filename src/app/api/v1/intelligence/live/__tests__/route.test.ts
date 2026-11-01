import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { createSessionToken } from '@/security/auth';

describe('W1.10 Live Intelligence REST API', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';
  let validToken: string;

  beforeEach(() => {
    process.env.SESSION_SECRET = secret;
    validToken = createSessionToken(
      { userId: 'admin-1', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret
    );
  });

  it('returns 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/live');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns blank state when no live target is connected (no fake numbers)', async () => {
    // Ensure disconnected state first
    const disconnectReq = new NextRequest('http://localhost:3000/api/v1/intelligence/live', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ action: 'disconnect' }),
    });
    await POST(disconnectReq);

    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/live', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.connected).toBe(false);
    expect(body.tracker).toBeNull();
    expect(body.provenance).toBe('live');
  });

  it('connects to target handle and ingests live events in POST', async () => {
    const connectReq = new NextRequest('http://localhost:3000/api/v1/intelligence/live', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        action: 'connect',
        targetHandle: 'streamer_pro',
      }),
    });
    const connectRes = await POST(connectReq);
    expect(connectRes.status).toBe(200);

    const eventReq = new NextRequest('http://localhost:3000/api/v1/intelligence/live', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        action: 'event',
        event: {
          type: 'VIEWER_COUNT',
          viewerCount: 1450,
          timestamp: new Date().toISOString(),
        },
      }),
    });
    const eventRes = await POST(eventReq);
    expect(eventRes.status).toBe(200);

    // Verify GET now returns connected tracker with real numbers
    const getReq = new NextRequest('http://localhost:3000/api/v1/intelligence/live', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const getRes = await GET(getReq);
    const body = await getRes.json();
    expect(body.connected).toBe(true);
    expect(body.tracker.currentViewers).toBe(1450);
  });
});
