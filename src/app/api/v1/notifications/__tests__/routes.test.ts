import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { GET as getNotifications } from '../route';
import { GET as getNotificationCounts } from '../counts/route';
import { POST as markNotificationRead } from '../[id]/read/route';
import { POST as markAllNotificationsRead } from '../read-all/route';
import { prisma } from '@/lib/prisma';
import { createSessionToken } from '@/security/auth';

describe('F1.3 Notification Routes (GET, /counts, /:id/read, /read-all)', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';
  let validCookie: string;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = secret;
    const token = createSessionToken(
      { userId: 'admin-user', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret
    );
    validCookie = `tikbot_session=${token}`;
  });

  describe('Authentication guard', () => {
    it('returns 401 on GET /api/v1/notifications when session cookie is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/notifications');
      const res = await getNotifications(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 on GET /api/v1/notifications/counts when unauthenticated', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/notifications/counts');
      const res = await getNotificationCounts(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 on POST /api/v1/notifications/:id/read when unauthenticated', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/notifications/n1/read', {
        method: 'POST',
      });
      const res = await markNotificationRead(req, { params: Promise.resolve({ id: 'n1' }) });
      expect(res.status).toBe(401);
    });

    it('returns 401 on POST /api/v1/notifications/read-all when unauthenticated', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/notifications/read-all', {
        method: 'POST',
      });
      const res = await markAllNotificationsRead(req);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/notifications pagination and filtering', () => {
    it('returns paginated notifications for authenticated operator', async () => {
      const mockNotifications = [
        { id: 'n1', type: 'APPROVAL', title: 'Approval 1', createdAt: new Date() },
        { id: 'n2', type: 'INCIDENT', title: 'Incident 2', createdAt: new Date() },
      ];
      (prisma.notification.findMany as any).mockResolvedValueOnce(mockNotifications);
      (prisma.notification.count as any).mockResolvedValueOnce(2);

      const req = new NextRequest('http://localhost:3000/api/v1/notifications?limit=2', {
        headers: { cookie: validCookie },
      });
      const res = await getNotifications(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.notifications).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('filters unread notifications when filter=UNREAD', async () => {
      (prisma.notification.findMany as any).mockResolvedValueOnce([]);
      (prisma.notification.count as any).mockResolvedValueOnce(0);

      const req = new NextRequest('http://localhost:3000/api/v1/notifications?filter=UNREAD', {
        headers: { cookie: validCookie },
      });
      const res = await getNotifications(req);
      expect(res.status).toBe(200);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ readAt: null }),
        })
      );
    });
  });

  describe('GET /api/v1/notifications/counts', () => {
    it('returns unread count breakdown per area', async () => {
      (prisma.notification.count as any)
        .mockResolvedValueOnce(5) // total unread
        .mockResolvedValueOnce(2) // approvals
        .mockResolvedValueOnce(1) // incidents
        .mockResolvedValueOnce(1) // research
        .mockResolvedValueOnce(1); // system

      const req = new NextRequest('http://localhost:3000/api/v1/notifications/counts', {
        headers: { cookie: validCookie },
      });
      const res = await getNotificationCounts(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.counts.total).toBe(5);
      expect(data.counts.approvals).toBe(2);
      expect(data.counts.incidents).toBe(1);
      expect(data.counts.research).toBe(1);
      expect(data.counts.system).toBe(1);
    });
  });

  describe('POST /api/v1/notifications/:id/read & /read-all', () => {
    it('marks a single notification as read', async () => {
      (prisma.notification.update as any).mockResolvedValueOnce({
        id: 'n1',
        readAt: new Date(),
      });

      const req = new NextRequest('http://localhost:3000/api/v1/notifications/n1/read', {
        method: 'POST',
        headers: { cookie: validCookie },
      });
      const res = await markNotificationRead(req, { params: Promise.resolve({ id: 'n1' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'n1' },
          data: expect.objectContaining({ readAt: expect.any(Date) }),
        })
      );
    });

    it('marks all unread notifications as read', async () => {
      (prisma.notification.updateMany as any).mockResolvedValueOnce({ count: 4 });

      const req = new NextRequest('http://localhost:3000/api/v1/notifications/read-all', {
        method: 'POST',
        headers: { cookie: validCookie },
      });
      const res = await markAllNotificationsRead(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(4);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { readAt: null },
          data: expect.objectContaining({ readAt: expect.any(Date) }),
        })
      );
    });
  });
});
