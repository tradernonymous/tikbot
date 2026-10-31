import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      count: vi.fn(),
    },
    platformAccount: {
      count: vi.fn(),
    },
    systemSetting: {
      findUnique: vi.fn(),
    },
  },
}));

describe('GET /api/metrics Prometheus Exposition (R7.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes standard Prometheus metrics format with real database values', async () => {
    vi.mocked(prisma.job.count)
      .mockResolvedValueOnce(12) // pending
      .mockResolvedValueOnce(3);  // running

    vi.mocked(prisma.platformAccount.count)
      .mockResolvedValueOnce(40) // total
      .mockResolvedValueOnce(35) // active
      .mockResolvedValueOnce(2);  // banned

    const now = new Date();
    const heartbeatTime = new Date(now.getTime() - 15000).toISOString(); // 15s ago
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValueOnce({
      key: 'WORKER_HEARTBEAT',
      value: JSON.stringify({ timestamp: heartbeatTime }),
      updatedAt: new Date(),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');

    const text = await res.text();
    expect(text).toContain('tikbot_queue_depth{status="pending"} 12');
    expect(text).toContain('tikbot_queue_depth{status="running"} 3');
    expect(text).toContain('tikbot_accounts_active 35');
    expect(text).toContain('tikbot_accounts_banned 2');
    expect(text).toContain('tikbot_accounts_ban_rate 5');
    expect(text).toContain('tikbot_worker_heartbeat_age_seconds');
  });

  it('handles database errors gracefully and returns fallback metrics', async () => {
    vi.mocked(prisma.job.count).mockRejectedValueOnce(new Error('Connection terminated'));

    const res = await GET();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('tikbot_health_status 0');
  });
});
