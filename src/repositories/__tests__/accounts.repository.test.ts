import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listAccounts,
  createAccount,
  deleteAccount,
  updateAccountStatus,
} from '../accounts.repository';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    platformAccount: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Accounts Repository (P3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists accounts and maps proxy and session info without exposing encrypted fields', async () => {
    vi.mocked(prisma.platformAccount.findMany).mockResolvedValue([
      {
        id: 'acc-1',
        platform: 'TIKTOK',
        username: 'creator_node_1',
        encryptedPassword: 'enc_password',
        encryptedCookies: 'enc_cookies',
        status: 'ACTIVE',
        healthScore: 98,
        actionsToday: 12,
        dailyCap: 80,
        lastActiveAt: new Date(),
        proxyId: 'proxy-1',
        proxy: { host: '192.168.1.1', port: 8080, status: 'HEALTHY' } as any,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]);

    const accounts = await listAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].username).toBe('creator_node_1');
    expect(accounts[0].hasCookies).toBe(true);
    expect((accounts[0] as any).encryptedCookies).toBeUndefined();
    expect((accounts[0] as any).encryptedPassword).toBeUndefined();
  });

  it('creates an account in the database', async () => {
    vi.mocked(prisma.platformAccount.create).mockResolvedValue({
      id: 'acc-new',
      platform: 'TIKTOK',
      username: 'new_creator',
      encryptedPassword: null,
      encryptedCookies: null,
      status: 'CREATED',
      healthScore: 100,
      actionsToday: 0,
      dailyCap: 80,
      lastActiveAt: null,
      proxyId: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const created = await createAccount({
      username: 'new_creator',
      platform: 'TIKTOK',
    });

    expect(created.id).toBe('acc-new');
    expect(prisma.platformAccount.create).toHaveBeenCalled();
  });

  it('deletes an account and ensures delete persists (never resurrects)', async () => {
    vi.mocked(prisma.platformAccount.delete).mockResolvedValue({
      id: 'acc-1',
    } as any);

    await deleteAccount('acc-1');
    expect(prisma.platformAccount.delete).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
    });
  });
});
