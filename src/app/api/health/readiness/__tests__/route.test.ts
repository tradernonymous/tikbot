import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { globalKillSwitch } from '@/security/kill-switch';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    job: {
      count: vi.fn(),
    },
    systemSetting: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Readiness Probe API Route (P2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalKillSwitch.setKillSwitch(false, 'test reset');
  });

  it('returns 200 with UP status when database SELECT 1 succeeds', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
    vi.mocked(prisma.job.count).mockResolvedValue(4);
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: 'WORKER_HEARTBEAT',
      value: new Date().toISOString(),
      updatedAt: new Date(),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('UP');
    expect(data.components.database.status).toBe('UP');
    expect(data.components.queue.pendingJobs).toBe(4);
    expect(data.components.worker.status).toBe('UP');
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('returns 503 with DOWN status when database probe throws', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection refused to PostgreSQL host:5432'));

    const res = await GET();
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.status).toBe('DOWN');
    expect(data.components.database.status).toBe('DOWN');
    expect(data.components.database.error).toContain('Connection refused');
  });

  it('returns 200 with DEGRADED status when Kill Switch is engaged', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
    globalKillSwitch.setKillSwitch(true, 'Emergency operator freeze');

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('DEGRADED');
    expect(data.components.killSwitch.active).toBe(true);
  });
});
