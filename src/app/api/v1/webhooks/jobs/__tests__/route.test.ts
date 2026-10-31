import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleJobWebhook, POST } from '../route';
import { NextRequest } from 'next/server';

describe('Async Job Webhook Ingestion (S6)', () => {
  const secret = 'valid-webhook-secret-min-16-chars';

  beforeEach(() => {
    process.env.INTERNAL_API_SECRET = secret;
    process.env.SESSION_SECRET = 'session-secret-session-secret-min-32-chars';
    process.env.MASTER_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.DATABASE_URL = 'postgresql://postgres:pass@localhost:5432/tikbot';
  });

  it('rejects webhooks with missing secret', async () => {
    const payload = { jobId: 'job-123', status: 'COMPLETED' as const };
    const res = await handleJobWebhook(payload, null, secret);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('rejects webhooks with different length secret (timingSafeEqual guard)', async () => {
    const payload = { jobId: 'job-123', status: 'COMPLETED' as const };
    const res = await handleJobWebhook(payload, 'short-secret', secret);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('rejects webhooks with same length but invalid secret characters', async () => {
    const payload = { jobId: 'job-123', status: 'COMPLETED' as const };
    const tamperedSecret = 'valid-webhook-secret-min-16-charX'; // same length, 1 diff
    const res = await handleJobWebhook(payload, tamperedSecret, secret);

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

  it('POST route rejects missing x-internal-secret header with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/webhooks/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobId: 'job-999', status: 'COMPLETED' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST route accepts valid x-internal-secret header with 200', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/webhooks/jobs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-secret': secret,
      },
      body: JSON.stringify({ jobId: 'job-999', status: 'COMPLETED' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
