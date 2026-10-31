import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listProxies,
  createProxy,
  deleteProxy,
  updateProxyStatus,
} from '../proxies.repository';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    proxy: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Proxies Repository (P3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists proxies from database without exposing credentials', async () => {
    vi.mocked(prisma.proxy.findMany).mockResolvedValue([
      {
        id: 'prx-1',
        protocol: 'HTTP',
        host: '103.152.112.44',
        port: 8080,
        username: 'user',
        encryptedPassword: 'secret_password_enc',
        country: 'SG',
        latencyMs: 142,
        status: 'HEALTHY',
        consecutiveErrors: 0,
        lastCheckedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const proxies = await listProxies();
    expect(proxies).toHaveLength(1);
    expect(proxies[0].host).toBe('103.152.112.44');
    expect(proxies[0].status).toBe('HEALTHY');
    expect((proxies[0] as any).encryptedPassword).toBeUndefined();
  });

  it('creates and persists a proxy', async () => {
    vi.mocked(prisma.proxy.create).mockResolvedValue({
      id: 'prx-2',
      protocol: 'HTTP',
      host: '45.12.34.56',
      port: 9000,
      username: null,
      encryptedPassword: null,
      country: 'MY',
      latencyMs: 88,
      status: 'HEALTHY',
      consecutiveErrors: 0,
      lastCheckedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await createProxy({
      host: '45.12.34.56',
      port: 9000,
      country: 'MY',
    });

    expect(res.id).toBe('prx-2');
    expect(prisma.proxy.create).toHaveBeenCalled();
  });

  it('deletes proxy from database', async () => {
    vi.mocked(prisma.proxy.delete).mockResolvedValue({ id: 'prx-1' } as any);
    await deleteProxy('prx-1');
    expect(prisma.proxy.delete).toHaveBeenCalledWith({ where: { id: 'prx-1' } });
  });
});
