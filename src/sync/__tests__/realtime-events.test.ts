import { describe, it, expect, vi } from 'vitest';
import {
  globalRealtimeEventBus,
  RealtimeServerEnvelope,
  emitRealtimeEvent,
  subscribeRealtimeEvents,
} from '../server-event-bus';

describe('S2.8 Server Realtime Event Bus', () => {
  it('emits and receives typed realtime envelopes across channels', () => {
    const received: RealtimeServerEnvelope[] = [];
    const unsub = subscribeRealtimeEvents((event) => {
      received.push(event);
    });

    emitRealtimeEvent({
      type: 'NOTIFICATION_ADDED',
      channel: 'notifications',
      payload: { id: 'notif-1', title: 'High CPU' },
    });

    emitRealtimeEvent({
      type: 'ACCOUNT_HEALTH_ALERT',
      channel: 'accounts',
      payload: { accountId: 'acc-1', banRisk: 'HIGH' },
      timestamp: '2026-11-02T04:30:00Z',
    });

    emitRealtimeEvent({
      type: 'LIVE_VIEWERS_UPDATE',
      channel: 'live',
      payload: { roomId: 'room-1', viewerCount: 1540 },
    });

    expect(received).toHaveLength(3);
    expect(received[0].type).toBe('NOTIFICATION_ADDED');
    expect(received[0].channel).toBe('notifications');
    expect(received[1].channel).toBe('accounts');
    expect(received[1].timestamp).toBe('2026-11-02T04:30:00Z');
    expect(received[2].channel).toBe('live');
    expect(received[2].payload.viewerCount).toBe(1540);

    unsub();

    emitRealtimeEvent({
      type: 'CAMPAIGN_UPDATED',
      channel: 'campaigns',
      payload: { campaignId: 'c-1', status: 'ACTIVE' },
    });
    expect(received).toHaveLength(3);
  });
});
