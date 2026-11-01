import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  broadcastSyncEvent,
  subscribeSyncEvents,
  ingestServerEvent,
  getClientTabId,
  ClientSyncEvent,
  resetClientEventBusForTesting,
} from '../client-event-bus';

describe('S2.1 Cross-tab live sync event bus', () => {
  beforeEach(() => {
    resetClientEventBusForTesting();
  });

  it('publishes and subscribes to typed sync events in the local tab', () => {
    const received: ClientSyncEvent[] = [];
    const unsub = subscribeSyncEvents((ev) => received.push(ev));

    broadcastSyncEvent({
      type: 'CAMPAIGN_UPDATED',
      payload: { campaignId: 'c-123', status: 'ACTIVE' },
    });

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('CAMPAIGN_UPDATED');
    expect(received[0].payload).toEqual({ campaignId: 'c-123', status: 'ACTIVE' });
    expect(received[0].sourceTabId).toBe(getClientTabId());
    expect(typeof received[0].timestamp).toBe('string');

    unsub();

    broadcastSyncEvent({
      type: 'NOTIFICATION_READ',
      payload: { notificationId: 'n-999' },
    });
    expect(received).toHaveLength(1); // Unsubscribed
  });

  it('ingests server events and transforms them into client sync events', () => {
    const received: ClientSyncEvent[] = [];
    const unsub = subscribeSyncEvents((ev) => received.push(ev));

    // Job event
    ingestServerEvent({
      type: 'JOB_COMPLETED',
      jobId: 'job-456',
      status: 'COMPLETED',
      timestamp: '2026-11-02T04:30:00Z',
    });

    // Campaign event
    ingestServerEvent({
      type: 'CAMPAIGN_STATUS',
      jobId: 'camp-789',
      data: { id: 'camp-789', status: 'PAUSED' },
    });

    // Notification event
    ingestServerEvent({
      type: 'NOTIFICATION',
      data: { id: 'notif-1', title: 'Alert' },
    });

    // Null/unknown events
    expect(ingestServerEvent(null as any)).toBeNull();
    expect(ingestServerEvent({ type: '' } as any)).toBeNull();
    expect(ingestServerEvent({ type: 'UNKNOWN_EVENT' } as any)).toBeNull();

    expect(received).toHaveLength(3);
    expect(received[0].type).toBe('JOB_UPDATED');
    expect(received[1].type).toBe('CAMPAIGN_UPDATED');
    expect(received[2].type).toBe('NOTIFICATION_ADDED');

    unsub();
  });

  it('handles listener errors gracefully without failing broadcast', () => {
    const badListener = vi.fn().mockImplementation(() => {
      throw new Error('Listener error');
    });
    const goodListener = vi.fn();

    const unsubBad = subscribeSyncEvents(badListener);
    const unsubGood = subscribeSyncEvents(goodListener);

    expect(() => {
      broadcastSyncEvent({
        type: 'KILL_SWITCH_CHANGED',
        payload: { active: true },
      });
    }).not.toThrow();

    expect(badListener).toHaveBeenCalled();
    expect(goodListener).toHaveBeenCalled();

    unsubBad();
    unsubGood();
  });

  it('handles foreign events dispatched from BroadcastChannel', () => {
    const received: ClientSyncEvent[] = [];
    const unsub = subscribeSyncEvents((ev) => received.push(ev));

    const foreignEvent: ClientSyncEvent = {
      type: 'NOTIFICATION_READ',
      payload: { notificationId: 'n-123' },
      sourceTabId: 'other-tab-id',
      timestamp: new Date().toISOString(),
    };

    const bus = (globalThis as any).__TIKBOT_SYNC_BUS__;
    expect(bus).toBeDefined();
    bus._handleForeignEvent(foreignEvent);

    expect(received).toHaveLength(1);
    expect(received[0].sourceTabId).toBe('other-tab-id');

    unsub();
  });

  it('generates a tab id even if crypto.randomUUID is not present', () => {
    resetClientEventBusForTesting();
    const origMethod = crypto.randomUUID;
    try {
      (crypto as any).randomUUID = undefined;
      const id = getClientTabId();
      expect(id).toMatch(/^tab-/);
    } finally {
      (crypto as any).randomUUID = origMethod;
    }
  });
});
