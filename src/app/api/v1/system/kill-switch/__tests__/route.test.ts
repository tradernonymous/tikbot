import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import { createSessionToken } from '@/security/auth';
import { globalKillSwitch } from '@/security/kill-switch';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('Kill Switch API Route (S4 Auth Guard)', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';

  beforeEach(() => {
    process.env.SESSION_SECRET = secret;
    globalKillSwitch.setKillSwitch(false, 'test reset');
  });

  function makePostRequest(body: any, cookieToken?: string): NextRequest {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    };
    if (cookieToken) {
      headers['cookie'] = `tikbot_session=${cookieToken}`;
    }
    return new NextRequest('http://localhost:3000/api/v1/system/kill-switch', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  it('rejects POST with 401 when no session cookie is present', async () => {
    const req = makePostRequest({ active: true, reason: 'Emergency' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('accepts POST and engages kill switch when valid session cookie is provided', async () => {
    const validToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret
    );
    const req = makePostRequest({ active: true, reason: 'Operator test freeze' }, validToken);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.active).toBe(true);
    expect(globalKillSwitch.isActive()).toBe(true);
  });

  it('allows GET status check', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.active).toBeDefined();
  });
});
