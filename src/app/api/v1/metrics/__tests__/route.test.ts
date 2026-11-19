import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: { findMany: vi.fn().mockResolvedValue([]) },
    job: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { createSessionToken } from '@/security/auth';

describe('R7.1 GET /api/v1/metrics', () => {
  let validCookie: string;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = 'super-secret-session-key-minimum-32-chars-long';
    const token = createSessionToken(
      { userId: 'admin-user', email: 'admin@tikbot.local', role: 'OPERATOR' },
      process.env.SESSION_SECRET
    );
    validCookie = `tikbot_session=${token}`;
  });

  it('returns 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/metrics');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns queue depth and job counts', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/metrics', {
      headers: { cookie: validCookie },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.jobs.queueDepth).toBe(0);
    expect(data.jobs).toHaveProperty('pending');
    expect(data.jobs).toHaveProperty('completed');
    expect(data.jobs).toHaveProperty('failed');
    expect(data.jobs).toHaveProperty('deadLetter');
    expect(data.workers.count).toBe(0);
  });

  it('reports stale workers when a heartbeat is older than 60s', async () => {
    (prisma.systemSetting.findMany as any).mockResolvedValue([
      { key: 'WORKER_HEARTBEAT_worker-1', value: new Date(Date.now() - 120_000).toISOString() },
    ]);
    const req = new NextRequest('http://localhost:3000/api/v1/metrics', {
      headers: { cookie: validCookie },
    });
    const res = await GET(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.workers.stale).toEqual([{ id: 'worker-1', ageSeconds: expect.any(Number) }]);
  });
});
