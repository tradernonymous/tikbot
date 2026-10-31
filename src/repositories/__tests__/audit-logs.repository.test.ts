import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listAuditLogs, recordAuditLog } from '../audit-logs.repository';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Audit Logs Repository (P3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists audit logs ordered by timestamp desc', async () => {
    const now = new Date();
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      {
        id: 'log-1',
        timestamp: now,
        operatorId: 'admin',
        action: 'UPDATE_SETTING',
        resourceType: 'SYSTEM',
        resourceId: 'SMM_PROVIDER_URL',
        ipAddress: '127.0.0.1',
        metadata: { changed: true },
      },
    ]);

    const logs = await listAuditLogs(50);
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('UPDATE_SETTING');
    expect(logs[0].timestamp).toBe(now.toISOString());
  });

  it('records an audit log and persists', async () => {
    const now = new Date();
    vi.mocked(prisma.auditLog.create).mockResolvedValue({
      id: 'log-2',
      timestamp: now,
      operatorId: null,
      action: 'LOGIN',
      resourceType: 'AUTH',
      resourceId: null,
      ipAddress: '192.168.1.1',
      metadata: null,
    });

    const res = await recordAuditLog({
      action: 'LOGIN',
      resourceType: 'AUTH',
      ipAddress: '192.168.1.1',
    });

    expect(res).not.toBeNull();
    expect(res?.id).toBe('log-2');
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});
