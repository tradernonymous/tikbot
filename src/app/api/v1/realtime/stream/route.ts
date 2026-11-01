import { NextResponse } from 'next/server';
import { requireSession } from '@/security/auth';
import { globalRealtimeEventBus, RealtimeServerEnvelope } from '@/sync/server-event-bus';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = requireSession(req as any);
  if (auth instanceof Response) {
    return auth;
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial greeting
      const greeting = {
        type: 'CONNECTED',
        channel: 'system',
        payload: { message: 'Realtime stream connected' },
        timestamp: new Date().toISOString(),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(greeting)}\n\n`));

      // 2. Subscribe to realtime server bus
      unsubscribe = globalRealtimeEventBus.subscribe((event: RealtimeServerEnvelope) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream closed
        }
      });

      // 3. Keepalive heartbeat every 15s
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          // Stream closed
        }
      }, 15000);
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
