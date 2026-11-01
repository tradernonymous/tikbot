import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RealtimeConnectionManager,
  calculateBackoffMs,
} from '../client-realtime';

describe('S2.8 Client Realtime Connection Manager', () => {
  let mockEventSourceInstances: any[] = [];
  let listeners: Record<string, Function[]> = {};

  beforeEach(() => {
    mockEventSourceInstances = [];
    listeners = {};
    vi.useFakeTimers();

    // Mock window and document for node environment
    (globalThis as any).window = globalThis;
    (globalThis as any).document = {
      visibilityState: 'visible',
      addEventListener: (type: string, fn: Function) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: Function) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((f) => f !== fn);
        }
      },
      dispatchEvent: (event: any) => {
        if (listeners[event.type]) {
          listeners[event.type].forEach((fn) => fn(event));
        }
      },
    };

    // Mock EventSource globally
    (globalThis as any).EventSource = class MockEventSource {
      url: string;
      onopen: (() => void) | null = null;
      onmessage: ((ev: any) => void) | null = null;
      onerror: (() => void) | null = null;
      closed = false;

      constructor(url: string) {
        this.url = url;
        mockEventSourceInstances.push(this);
      }

      close() {
        this.closed = true;
      }
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    delete (globalThis as any).EventSource;
    delete (globalThis as any).window;
    delete (globalThis as any).document;
  });

  it('calculates exponential backoff with a cap', () => {
    expect(calculateBackoffMs(0)).toBe(1000);
    expect(calculateBackoffMs(1)).toBe(2000);
    expect(calculateBackoffMs(2)).toBe(4000);
    expect(calculateBackoffMs(5)).toBe(30000); // capped at 30s
    expect(calculateBackoffMs(10)).toBe(30000);
  });

  it('connects, receives messages, handles heartbeat comments, and closes', () => {
    const manager = new RealtimeConnectionManager('http://localhost:3000/api/v1/realtime/stream');
    manager.start();
    expect(manager.getStatus()).toBe('CONNECTING');

    const es = mockEventSourceInstances[0];
    expect(es).toBeDefined();

    // Simulate onopen
    es.onopen();
    expect(manager.getStatus()).toBe('CONNECTED');

    // Simulate heartbeat (starts with :)
    expect(() => {
      es.onmessage({ data: ': heartbeat' });
    }).not.toThrow();

    // Simulate actual JSON payload
    es.onmessage({
      data: JSON.stringify({
        type: 'JOB_COMPLETED',
        jobId: 'j-123',
        status: 'COMPLETED',
      }),
    });

    // Simulate malformed JSON
    expect(() => {
      es.onmessage({ data: 'not-json' });
    }).not.toThrow();

    manager.stop();
    expect(manager.getStatus()).toBe('DISCONNECTED');
    expect(es.closed).toBe(true);
  });

  it('handles disconnect and reconnects with backoff', () => {
    const manager = new RealtimeConnectionManager('http://localhost:3000/api/v1/realtime/stream');
    manager.start();
    const es1 = mockEventSourceInstances[0];

    // Simulate error triggering disconnect
    es1.onerror();
    expect(manager.getStatus()).toBe('DISCONNECTED');

    // Advance timer by 1000ms (backoff for retry 0)
    vi.advanceTimersByTime(1000);
    expect(mockEventSourceInstances.length).toBe(2);
    expect(manager.getStatus()).toBe('CONNECTING');

    manager.stop();
  });

  it('pauses connection when document is hidden and resumes when visible', () => {
    const doc = (globalThis as any).document;
    doc.visibilityState = 'visible';

    const manager = new RealtimeConnectionManager();
    manager.start();
    const es = mockEventSourceInstances[0];
    es.onopen();
    expect(manager.getStatus()).toBe('CONNECTED');

    // Tab hidden
    doc.visibilityState = 'hidden';
    doc.dispatchEvent({ type: 'visibilitychange' });

    // Trigger error while hidden
    es.onerror();
    expect(manager.getStatus()).toBe('PAUSED');

    // Tab becomes visible again
    doc.visibilityState = 'visible';
    doc.dispatchEvent({ type: 'visibilitychange' });
    expect(manager.getStatus()).toBe('CONNECTING');

    manager.stop();
  });

  it('handles environment without EventSource gracefully', () => {
    delete (globalThis as any).EventSource;
    const manager = new RealtimeConnectionManager();
    manager.start();
    expect(manager.getStatus()).toBe('DISCONNECTED');
    manager.stop();
  });
});
