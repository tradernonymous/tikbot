import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSystemSetting, setSystemSetting, getSettingsStatus, SENSITIVE_SETTING_KEYS } from '../system-settings';
import { prisma } from '@/lib/prisma';
import { decryptSecret } from '@/security/crypto';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('System Settings Storage & Encryption (S7)', () => {
  const masterKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MASTER_ENCRYPTION_KEY = masterKey;
  });

  it('encrypts sensitive keys before persisting in the database', async () => {
    const rawKey = 'test_smm_api_key_secret_123';
    await setSystemSetting('SMM_PROVIDER_API_KEY', rawKey);

    expect(prisma.systemSetting.upsert).toHaveBeenCalled();
    const callArgs = vi.mocked(prisma.systemSetting.upsert).mock.calls[0][0];
    expect(callArgs.where.key).toBe('SMM_PROVIDER_API_KEY');
    
    // Value must not be plaintext in the DB write
    const storedValue = callArgs.update.value;
    expect(storedValue).not.toBe(rawKey);
    // Decrypting the stored envelope gives the original raw key
    expect(decryptSecret(storedValue, masterKey)).toBe(rawKey);
  });

  it('decrypts sensitive keys when reading for internal use', async () => {
    const rawKey = 'test_smm_api_key_secret_123';
    // setSystemSetting will call upsert with encrypted value
    await setSystemSetting('SMM_PROVIDER_API_KEY', rawKey);
    const storedValue = vi.mocked(prisma.systemSetting.upsert).mock.calls[0][0].update.value;

    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: 'SMM_PROVIDER_API_KEY',
      value: storedValue,
      updatedAt: new Date(),
    });

    const result = await getSystemSetting('SMM_PROVIDER_API_KEY');
    expect(result).toBe(rawKey);
  });

  it('never exposes sensitive keys in getSettingsStatus', async () => {
    vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([
      { key: 'SMM_PROVIDER_API_KEY', value: 'encrypted-envelope', updatedAt: new Date() },
      { key: 'SMM_PROVIDER_URL', value: 'https://supplierfollower.com/api/v2', updatedAt: new Date() },
    ]);

    const status = await getSettingsStatus();
    expect(status.SMM_PROVIDER_API_KEY.configured).toBe(true);
    // Must NOT contain the plaintext or encrypted key value
    expect((status.SMM_PROVIDER_API_KEY as any).value).toBeUndefined();

    // Non-sensitive settings like URL may expose value
    expect(status.SMM_PROVIDER_URL.configured).toBe(true);
    expect(status.SMM_PROVIDER_URL.value).toBe('https://supplierfollower.com/api/v2');
  });
});
