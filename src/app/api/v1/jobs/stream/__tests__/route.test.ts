import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { globalJobEventBus } from '@/queue/job-events';
import { createSessionToken } from '@/security/auth';

describe('Job Progress Stream SSE Endpoint (R3.5)', () => {
  const secret = 'test-session-secret-at-least-32-chars-long';

  beforeEach(() => {
    process.env.SESSION_SECRET = secret;
    vi.clearAllMocks();
  });

  it('returns 401 Unauthorized when request lacks valid session cookie', async () => {
    const req = new Request('http://localhost:3000/api/v1/jobs/stream');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 text/event-stream when request has valid session cookie', async () => {
    const token = createSessionToken({ role: 'OPERATOR' } as any, secret);
    const req = new Request('http://localhost:3000/api/v1/jobs/stream', {
      headers: {
        cookie: `tikbot_session=${token}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    expect(res.headers.get('Cache-Control')).toContain('no-cache');
  });

  it('streams job events to connected client', async () => {
    const token = createSessionToken({ role: 'OPERATOR' } as any, secret);
    const req = new Request('http://localhost:3000/api/v1/jobs/stream', {
      headers: {
        cookie: `tikbot_session=${token}`,
      },
    });

    const res = await GET(req);
    const reader = res.body?.getReader();
    expect(reader).toBeDefined();

    // First chunk is CONNECTED greeting
    const firstChunk = await reader?.read();
    const firstText = new TextDecoder().decode(firstChunk?.value);
    expect(firstText).toContain('"type":"CONNECTED"');

    // Emit a job event
    globalJobEventBus.emitJobEvent({
      type: 'JOB_PROGRESS',
      jobId: 'job-sse-123',
      name: 'farm.view',
      progress: 60,
      timestamp: new Date().toISOString(),
    });

    const secondChunk = await reader?.read();
    const secondText = new TextDecoder().decode(secondChunk?.value);
    expect(secondText).toContain('job-sse-123');
    expect(secondText).toContain('"progress":60');

    await reader?.cancel();
  });
});
