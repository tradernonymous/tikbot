import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { emitRealtimeEvent } from '@/sync/server-event-bus';
import { createSessionToken } from '@/security/auth';

describe('Realtime SSE Stream Endpoint (S2.8)', () => {
  const secret = 'test-session-secret-at-least-32-chars-long';

  beforeEach(() => {
    process.env.SESSION_SECRET = secret;
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const req = new Request('http://localhost:3000/api/v1/realtime/stream');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('connects authenticated sessions with text/event-stream', async () => {
    const token = createSessionToken({ role: 'OPERATOR' } as any, secret);
    const req = new Request('http://localhost:3000/api/v1/realtime/stream', {
      headers: { cookie: `tikbot_session=${token}` },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');

    const reader = res.body?.getReader();
    expect(reader).toBeDefined();

    // Greeting check
    const firstChunk = await reader?.read();
    const text = new TextDecoder().decode(firstChunk?.value);
    expect(text).toContain('"type":"CONNECTED"');

    // Emit realtime event
    emitRealtimeEvent({
      type: 'NOTIFICATION_ADDED',
      channel: 'notifications',
      payload: { id: 'notif-stream-test', title: 'Stream test' },
    });

    const secondChunk = await reader?.read();
    const secondText = new TextDecoder().decode(secondChunk?.value);
    expect(secondText).toContain('NOTIFICATION_ADDED');
    expect(secondText).toContain('notif-stream-test');

    await reader?.cancel();
  });
});
