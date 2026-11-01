import { describe, it, expect, beforeEach } from 'vitest';
import {
  ApiUsageMeter,
  type ApiUsageRecord,
  RateLimitBreachedError,
} from '../api-metering';

describe('T7.5 API Usage Metering & Abuse Alerts', () => {
  let meter: ApiUsageMeter;

  beforeEach(() => {
    meter = new ApiUsageMeter({
      maxRequestsPerMinute: 10,
    });
  });

  it('tracks requests and reports remaining quota within window', () => {
    const status1 = meter.recordRequest('key_abc');
    expect(status1.allowed).toBe(true);
    expect(status1.remaining).toBe(9);
    expect(status1.totalUsed).toBe(1);

    const status2 = meter.recordRequest('key_abc');
    expect(status2.remaining).toBe(8);
  });

  it('throws RateLimitBreachedError and generates abuse alert when quota exceeded', () => {
    for (let i = 0; i < 10; i++) {
      meter.recordRequest('key_spammer');
    }

    expect(() => {
      meter.recordRequest('key_spammer');
    }).toThrow(RateLimitBreachedError);

    const alerts = meter.getAbuseAlerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].keyId).toBe('key_spammer');
    expect(alerts[0].type).toBe('RATE_LIMIT_EXCEEDED');
    expect(alerts[0].provenance).toBe('live');
  });

  it('resets usage after window expiry', () => {
    meter.recordRequest('key_reset');
    expect(meter.getUsage('key_reset').totalUsed).toBe(1);

    meter.resetUsage('key_reset');
    expect(meter.getUsage('key_reset').totalUsed).toBe(0);
  });
});
