import { describe, it, expect, vi } from 'vitest';
import {
  WebhookDispatcher,
  type WebhookSubscription,
  type WebhookEvent,
} from '../outgoing-webhooks';

describe('T7.3 Outgoing Signed Webhooks & Dead Letter Queue', () => {
  it('signs payload with HMAC-SHA256 and successfully delivers on 200 response', async () => {
    let capturedHeaders: Record<string, string> = {};
    const mockFetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return { ok: true, status: 200 };
    });

    const dispatcher = new WebhookDispatcher({
      fetchClient: mockFetch as any,
      retryDelayMs: 1, // fast for testing
    });

    const subscription: WebhookSubscription = {
      id: 'sub-1',
      url: 'https://example.com/webhook',
      secret: 'whsec_test_secret_123',
      events: ['publish.completed'],
    };

    const event: WebhookEvent = {
      id: 'evt-1',
      type: 'publish.completed',
      timestamp: '2026-11-02T05:00:00Z',
      payload: { jobId: 'job-99', videoId: 'vid-123' },
    };

    const result = await dispatcher.dispatch(subscription, event);
    expect(result.delivered).toBe(true);
    expect(result.attemptCount).toBe(1);
    expect(capturedHeaders['X-TikBot-Signature']).toBeDefined();
    expect(capturedHeaders['X-TikBot-Signature'].startsWith('sha256=')).toBe(true);
    expect(capturedHeaders['X-TikBot-Timestamp']).toBe('2026-11-02T05:00:00Z');
  });

  it('retries on server error and sends to dead-letter queue when attempts exhausted', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const dispatcher = new WebhookDispatcher({
      fetchClient: mockFetch as any,
      maxRetries: 3,
      retryDelayMs: 1,
    });

    const subscription: WebhookSubscription = {
      id: 'sub-2',
      url: 'https://flaky-endpoint.com/hook',
      secret: 'whsec_secret_flaky',
      events: ['farm.anomaly'],
    };

    const event: WebhookEvent = {
      id: 'evt-2',
      type: 'farm.anomaly',
      timestamp: '2026-11-02T05:05:00Z',
      payload: { accountId: 'acc-flaky', reason: 'CAPTCHA' },
    };

    const result = await dispatcher.dispatch(subscription, event);
    expect(result.delivered).toBe(false);
    expect(result.attemptCount).toBe(3);

    const dlq = dispatcher.getDeadLetterQueue();
    expect(dlq.length).toBe(1);
    expect(dlq[0].eventId).toBe('evt-2');
    expect(dlq[0].endpointUrl).toBe('https://flaky-endpoint.com/hook');
    expect(dlq[0].lastError).toContain('500');
  });
});
