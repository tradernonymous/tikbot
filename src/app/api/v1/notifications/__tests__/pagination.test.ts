import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { createSessionToken } from '@/security/auth';

describe('B2 — GET /api/v1/notifications cursor pagination (regression)', () => {
  let validCookie: string;

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.notification.findMany as any).mockResolvedValue([]);
    process.env.SESSION_SECRET = 'super-secret-session-key-minimum-32-chars-long';
    const token = createSessionToken(
      { userId: 'admin-user', email: 'admin@tikbot.local', role: 'OPERATOR' },
      process.env.SESSION_SECRET
    );
    validCookie = `tikbot_session=${token}`;
  });

  it('does not skip the row after the cursor (skip: 0)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/notifications?cursor=c1&limit=5', {
      headers: { cookie: validCookie },
    });
    await GET(req);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, cursor: { id: 'c1' }, take: 6 })
    );
  });
});
