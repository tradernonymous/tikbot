import { encryptSecret, decryptSecret } from './crypto';

export interface SecretRotationConfig {
  oldKey: string;
  newKey: string;
}

export interface RotationRecord {
  id: string;
  success: boolean;
  newCipher?: string;
  error?: string;
}

export interface BatchRotationResult {
  total: number;
  rotated: number;
  failed: number;
  records: RotationRecord[];
}

export class SecretRotator {
  constructor(private config: SecretRotationConfig) {
    if (!config.oldKey || !config.newKey) {
      throw new Error('Both oldKey and newKey are required for secret rotation');
    }
  }

  rotateCiphertext(ciphertext: string): string {
    const plaintext = decryptSecret(ciphertext, this.config.oldKey);
    return encryptSecret(plaintext, this.config.newKey);
  }

  rotateBatch(items: Array<{ id: string; cipher: string }>): BatchRotationResult {
    const records: RotationRecord[] = [];
    let rotated = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const newCipher = this.rotateCiphertext(item.cipher);
        records.push({ id: item.id, success: true, newCipher });
        rotated += 1;
      } catch (err: any) {
        records.push({ id: item.id, success: false, error: err.message || 'Decryption/Re-encryption failed' });
        failed += 1;
      }
    }

    return {
      total: items.length,
      rotated,
      failed,
      records,
    };
  }
}
