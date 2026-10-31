import { prisma } from '@/lib/prisma';
import { encryptSecret, decryptSecret } from '@/security/crypto';

export const SENSITIVE_SETTING_KEYS = new Set([
  'SMM_PROVIDER_API_KEY',
  'INTERNAL_API_SECRET',
  'MASTER_ENCRYPTION_KEY',
  'SESSION_SECRET',
]);

function getMasterKey(): string {
  const key = process.env.MASTER_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('MASTER_ENCRYPTION_KEY is required to encrypt/decrypt system settings');
  }
  return key;
}

/**
 * Persists a system setting row. If the setting is in SENSITIVE_SETTING_KEYS,
 * the value is encrypted using AES-256-GCM before writing to the database.
 */
export async function setSystemSetting(key: string, value: string): Promise<void> {
  const masterKey = getMasterKey();
  const isSensitive = SENSITIVE_SETTING_KEYS.has(key);
  const storedValue = isSensitive ? encryptSecret(value, masterKey) : value;

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: storedValue },
    create: { key, value: storedValue },
  });
}

/**
 * Retrieves a system setting row. If sensitive, the value is decrypted.
 * Falls back to process.env[key] if not found in database.
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (row && row.value) {
      if (SENSITIVE_SETTING_KEYS.has(key)) {
        const masterKey = getMasterKey();
        return decryptSecret(row.value, masterKey);
      }
      return row.value;
    }
  } catch (err) {
    // If database is not yet initialized or unreachable, fallback to process.env
  }

  return process.env[key] || null;
}

/**
 * Returns configuration status of settings for client UI consumption.
 * NEVER returns the plaintext or ciphertext values for sensitive settings.
 */
export async function getSettingsStatus(): Promise<
  Record<string, { configured: boolean; value?: string }>
> {
  const result: Record<string, { configured: boolean; value?: string }> = {
    SMM_PROVIDER_API_KEY: {
      configured: Boolean(process.env.SMM_PROVIDER_API_KEY),
    },
    SMM_PROVIDER_URL: {
      configured: Boolean(process.env.SMM_PROVIDER_URL),
      value: process.env.SMM_PROVIDER_URL || 'https://supplierfollower.com/api/v2',
    },
  };

  try {
    const rows = await prisma.systemSetting.findMany();
    for (const row of rows) {
      const isSensitive = SENSITIVE_SETTING_KEYS.has(row.key);
      if (isSensitive) {
        result[row.key] = {
          configured: Boolean(row.value && row.value.length > 0),
        };
      } else {
        result[row.key] = {
          configured: Boolean(row.value && row.value.length > 0),
          value: row.value,
        };
      }
    }
  } catch {
    // Return env-based status if database table not available
  }

  return result;
}
