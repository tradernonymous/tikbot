import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadConfig, getConfig } from '../index';

describe('Config Loader (Zod Validation)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('fails validation when required environment variables are missing', () => {
    expect(() => loadConfig({ NODE_ENV: 'test' })).toThrowError(/DATABASE_URL|MASTER_ENCRYPTION_KEY/);
  });

  it('fails validation when MASTER_ENCRYPTION_KEY is not a 64-char hex string (32 bytes)', () => {
    const invalidEnv = {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/tikbot',
      MASTER_ENCRYPTION_KEY: 'too-short-key',
      OPERATOR_PASSWORD_HASH: '$argon2id$v=19$m=65536,t=3,p=4$somehash',
      SESSION_SECRET: 'super-secret-session-key-minimum-32-chars-long',
    };
    expect(() => loadConfig(invalidEnv)).toThrowError(/64-character/);
  });

  it('successfully loads and validates with valid environment variables and defaults', () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/tikbot',
      MASTER_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      OPERATOR_PASSWORD_HASH: '$argon2id$v=19$m=65536,t=3,p=4$validhash',
      SESSION_SECRET: 'super-secret-session-key-minimum-32-chars-long',
      STORAGE_DRIVER: 'local',
    };

    const config = loadConfig();
    expect(config.NODE_ENV).toBe('test');
    expect(config.DATABASE_URL).toBe('postgresql://postgres:pass@localhost:5432/tikbot');
    expect(config.KILL_SWITCH_ACTIVE).toBe(false);
    expect(config.WORKER_CONCURRENCY).toBe(3);
    expect(config.PORT).toBe(3000);
  });

  it('correctly handles all variations of KILL_SWITCH_ACTIVE', () => {
    const baseEnv = {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/tikbot',
      MASTER_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      OPERATOR_PASSWORD_HASH: '$argon2id$v=19$m=65536,t=3,p=4$validhash',
      SESSION_SECRET: 'super-secret-session-key-minimum-32-chars-long',
    };

    expect(loadConfig({ ...baseEnv, KILL_SWITCH_ACTIVE: 'true' }).KILL_SWITCH_ACTIVE).toBe(true);
    expect(loadConfig({ ...baseEnv, KILL_SWITCH_ACTIVE: '1' }).KILL_SWITCH_ACTIVE).toBe(true);
    expect(loadConfig({ ...baseEnv, KILL_SWITCH_ACTIVE: 'false' }).KILL_SWITCH_ACTIVE).toBe(false);
    expect(loadConfig({ ...baseEnv, KILL_SWITCH_ACTIVE: '0' }).KILL_SWITCH_ACTIVE).toBe(false);
  });

  it('returns cached config or loads it automatically when getConfig is called', async () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/tikbot',
      MASTER_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      OPERATOR_PASSWORD_HASH: '$argon2id$v=19$m=65536,t=3,p=4$validhash',
      SESSION_SECRET: 'super-secret-session-key-minimum-32-chars-long',
    };

    // dynamically reimport to test initial getConfig() branch
    const { getConfig: freshGetConfig } = await import('../index?t=' + Date.now());
    const config = freshGetConfig();
    expect(config.DATABASE_URL).toBe('postgresql://postgres:pass@localhost:5432/tikbot');

    const cached = freshGetConfig();
    expect(cached).toBe(config);
  });
});
