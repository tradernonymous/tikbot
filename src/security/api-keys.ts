import { createHash, randomBytes } from 'node:crypto';
import type { Role, Permission } from './rbac';

export class InvalidApiKeyError extends Error {
  constructor(message = 'Invalid API key provided') {
    super(message);
    this.name = 'InvalidApiKeyError';
  }
}

export class InsufficientScopeError extends Error {
  constructor(scope: Permission) {
    super(`API key lacks required scope: ${scope}`);
    this.name = 'InsufficientScopeError';
  }
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyHash: string;
  role: Role;
  scopes: Permission[];
  createdAt: Date;
  lastUsedAt?: Date;
  revoked: boolean;
}

export interface CreateKeyOptions {
  name: string;
  role: Role;
  scopes: Permission[];
}

export interface ApiKeyManagerConfig {
  rateLimitPerMinute?: number;
}

export class ApiKeyManager {
  private keys = new Map<string, ApiKeyRecord>(); // keyHash -> record
  private rateLimitPerMinute: number;
  private usageCounter = new Map<string, { count: number; windowStart: number }>();

  constructor(config: ApiKeyManagerConfig = {}) {
    this.rateLimitPerMinute = config.rateLimitPerMinute ?? 60;
  }

  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }

  createKey(options: CreateKeyOptions): { rawKey: string; record: ApiKeyRecord } {
    const secret = randomBytes(24).toString('hex');
    const rawKey = `tikbot_live_${secret}`;
    const keyHash = this.hashKey(rawKey);

    const record: ApiKeyRecord = {
      id: `key-${Date.now()}-${randomBytes(4).toString('hex')}`,
      name: options.name,
      keyHash,
      role: options.role,
      scopes: options.scopes,
      createdAt: new Date(),
      revoked: false,
    };

    this.keys.set(keyHash, record);
    return { rawKey, record };
  }

  verifyKey(rawKey: string, requiredScope?: Permission): ApiKeyRecord {
    const hash = this.hashKey(rawKey);
    const record = this.keys.get(hash);

    if (!record || record.revoked) {
      throw new InvalidApiKeyError();
    }

    if (requiredScope && !record.scopes.includes(requiredScope) && record.role !== 'ADMIN') {
      throw new InsufficientScopeError(requiredScope);
    }

    record.lastUsedAt = new Date();
    return record;
  }

  revokeKey(keyHash: string): boolean {
    const record = this.keys.get(keyHash);
    if (!record) return false;
    record.revoked = true;
    return true;
  }
}
