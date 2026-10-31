import { describe, it, expect, vi } from 'vitest';
import { StructuredLogger, redactSensitiveData } from '../logger';

describe('redactSensitiveData', () => {
  it('redacts sensitive keys including passwords, tokens, cookies, and api keys', () => {
    const raw = {
      username: 'admin',
      password: 'supersecretpassword123',
      sessionToken: 'jwt.token.val',
      apiKey: 'sk-live-123456789',
      cookie: 'session_id=abc; secure',
      proxyUrl: 'http://user:pass@1.2.3.4:8080',
      nested: {
        clientSecret: 'secret_value',
        normalField: 'ok',
      },
    };

    const redacted = redactSensitiveData(raw);

    expect(redacted.username).toBe('admin');
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.sessionToken).toBe('[REDACTED]');
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect(redacted.cookie).toBe('[REDACTED]');
    expect(redacted.nested.clientSecret).toBe('[REDACTED]');
    expect(redacted.nested.normalField).toBe('ok');
  });
});

describe('StructuredLogger', () => {
  it('formats structured log entries as JSON with traceId and level', () => {
    const output: string[] = [];
    const logger = new StructuredLogger({
      serviceName: 'tikbot-core',
      sink: (line) => output.push(line),
    });

    logger.info('System initialized', { version: '1.0.0', traceId: 'trace-abc-123' });

    expect(output).toHaveLength(1);
    const parsed = JSON.parse(output[0]);
    expect(parsed.level).toBe('INFO');
    expect(parsed.service).toBe('tikbot-core');
    expect(parsed.message).toBe('System initialized');
    expect(parsed.traceId).toBe('trace-abc-123');
    expect(parsed.timestamp).toBeDefined();
  });

  it('redacts secrets in logged metadata objects', () => {
    const output: string[] = [];
    const logger = new StructuredLogger({
      sink: (line) => output.push(line),
    });

    logger.warn('Failed login attempt', {
      user: 'operator',
      password: 'myPassword123!',
      nestedArray: [{ apiKey: 'secret-in-array' }],
    });

    const parsed = JSON.parse(output[0]);
    expect(parsed.user).toBe('operator');
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.nestedArray[0].apiKey).toBe('[REDACTED]');
  });

  it('supports debug and error logging methods', () => {
    const output: string[] = [];
    const logger = new StructuredLogger({ sink: (line) => output.push(line) });

    logger.debug('Debug trace');
    logger.error('Critical failure');

    expect(output).toHaveLength(2);
    expect(JSON.parse(output[0]).level).toBe('DEBUG');
    expect(JSON.parse(output[1]).level).toBe('ERROR');
  });
});
