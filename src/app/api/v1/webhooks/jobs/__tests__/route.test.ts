import { describe, it, expect, vi } from 'vitest';
import { handleJobWebhook } from '../route';

describe('Async Job Webhook Ingestion', () => {
  const secret = 'valid-webhook-secret';

  it('rejects webhooks with missing or invalid secret header', async () => {
    const payload = { jobId: 'job-123', status: 'COMPLETED' as const };
    const res = await handleJobWebhook(payload, 'wrong-secret', secret);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('rejects webhooks with invalid payload structure', async () => {
    const invalidPayload = { invalid: true } as any;
    const res = await handleJobWebhook(invalidPayload, secret, secret);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('jobId and status are required');
  });

  it('accepts valid webhook completion and invokes callback', async () => {
    const payload = {
      jobId: 'job-123',
      status: 'COMPLETED' as const,
      result: { videoUrl: 'https://cdn.tiktok.com/vid.mp4' },
    };

    const mockCallback = vi.fn().mockResolvedValue(true);
    const res = await handleJobWebhook(payload, secret, secret, mockCallback);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCallback).toHaveBeenCalledWith('job-123', 'COMPLETED', payload.result, undefined);
  });
});
