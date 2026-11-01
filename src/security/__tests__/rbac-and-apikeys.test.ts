import { describe, it, expect } from 'vitest';
import {
  Role,
  Permission,
  hasPermission,
  authorizeRequest,
  UnauthorizedRoleError,
} from '../rbac';
import {
  ApiKeyManager,
  type ApiKeyRecord,
  InvalidApiKeyError,
  InsufficientScopeError,
} from '../api-keys';

describe('T7.1 Role-Based Access Control (RBAC)', () => {
  it('grants full permissions to ADMIN', () => {
    expect(hasPermission('ADMIN', 'system:manage')).toBe(true);
    expect(hasPermission('ADMIN', 'publish:create')).toBe(true);
    expect(hasPermission('ADMIN', 'research:read')).toBe(true);
  });

  it('permits MANAGER to publish and manage content but forbids system administration', () => {
    expect(hasPermission('MANAGER', 'publish:create')).toBe(true);
    expect(hasPermission('MANAGER', 'campaigns:manage')).toBe(true);
    expect(hasPermission('MANAGER', 'system:manage')).toBe(false);
  });

  it('restricts ANALYST to read-only research and reports', () => {
    expect(hasPermission('ANALYST', 'research:read')).toBe(true);
    expect(hasPermission('ANALYST', 'reports:read')).toBe(true);
    expect(hasPermission('ANALYST', 'publish:create')).toBe(false);
    expect(hasPermission('ANALYST', 'accounts:mutate')).toBe(false);
  });

  it('restricts VIEWER from any mutation', () => {
    expect(hasPermission('VIEWER', 'overview:read')).toBe(true);
    expect(hasPermission('VIEWER', 'research:read')).toBe(false);
    expect(hasPermission('VIEWER', 'publish:create')).toBe(false);
  });

  it('authorizeRequest throws UnauthorizedRoleError when permission is denied', () => {
    expect(() => {
      authorizeRequest('VIEWER', 'publish:create');
    }).toThrow(UnauthorizedRoleError);
  });
});

describe('T7.2 Scoped API Keys & Rate Limiting', () => {
  const manager = new ApiKeyManager({
    rateLimitPerMinute: 60,
  });

  it('generates, hashes, and validates valid scoped API keys', () => {
    const { rawKey, record } = manager.createKey({
      name: 'Zapier Ingest',
      role: 'MANAGER',
      scopes: ['publish:create', 'research:read'],
    });

    expect(rawKey.startsWith('tikbot_live_')).toBe(true);
    expect(record.keyHash).not.toBe(rawKey);

    const verified = manager.verifyKey(rawKey, 'publish:create');
    expect(verified.name).toBe('Zapier Ingest');
    expect(verified.scopes).toContain('publish:create');
  });

  it('rejects invalid or unknown API keys', () => {
    expect(() => {
      manager.verifyKey('tikbot_live_fake999', 'research:read');
    }).toThrow(InvalidApiKeyError);
  });

  it('rejects valid key when requested scope is missing', () => {
    const { rawKey } = manager.createKey({
      name: 'Read Only Bot',
      role: 'ANALYST',
      scopes: ['research:read'],
    });

    expect(() => {
      manager.verifyKey(rawKey, 'system:manage');
    }).toThrow(InsufficientScopeError);
  });
});
