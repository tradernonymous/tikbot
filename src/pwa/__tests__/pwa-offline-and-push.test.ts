import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  OfflineMutationQueue,
  type QueuedMutation,
} from '../offline-queue';
import {
  PushNotificationManager,
  type PushSubscriptionConfig,
} from '../push-notifications';

describe('P8.1 PWA Offline Mutation Queue', () => {
  let queue: OfflineMutationQueue;

  beforeEach(() => {
    queue = new OfflineMutationQueue();
  });

  it('enqueues offline mutations and preserves chronological order', () => {
    queue.enqueue({
      id: 'mut-1',
      endpoint: '/api/v1/system/kill-switch',
      method: 'POST',
      body: { state: 'TRIPPED', reason: 'Emergency stop' },
      timestamp: 1000,
    });

    queue.enqueue({
      id: 'mut-2',
      endpoint: '/api/v1/intelligence/inbox',
      method: 'POST',
      body: { commentId: 'c1', approved: true },
      timestamp: 2000,
    });

    expect(queue.size()).toBe(2);
    const pending = queue.peekAll();
    expect(pending[0].id).toBe('mut-1');
    expect(pending[1].id).toBe('mut-2');
  });

  it('replays queued mutations when connection is restored and removes succeeded items', async () => {
    queue.enqueue({
      id: 'mut-1',
      endpoint: '/api/v1/approval',
      method: 'POST',
      body: { id: 'appr-1' },
      timestamp: 1000,
    });

    const handler = vi.fn().mockResolvedValue({ success: true });
    const result = await queue.replayQueuedMutations(handler);

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
    expect(queue.size()).toBe(0);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('retains failing mutations in queue for subsequent retry', async () => {
    queue.enqueue({
      id: 'mut-fail',
      endpoint: '/api/v1/fail',
      method: 'POST',
      body: {},
      timestamp: 1000,
    });

    const handler = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await queue.replayQueuedMutations(handler);

    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(queue.size()).toBe(1);
  });
});

describe('P8.2 Web Push Notifications', () => {
  const manager = new PushNotificationManager({
    vapidPublicKey: 'BEl62iUYgUivxIkv69yViEuiBIaMockVapidKey',
  });

  it('formats web push payload with action links and icon', () => {
    const payload = manager.formatPushPayload({
      title: 'Anomaly Alert: @bot1 Throttled',
      body: 'Captcha spike detected on Account bot1. Smart mode auto-paused.',
      targetUrl: '/dashboard/compliance',
      tag: 'safety-alert',
    });

    expect(payload.notification.title).toBe('Anomaly Alert: @bot1 Throttled');
    expect(payload.notification.data.url).toBe('/dashboard/compliance');
    expect(payload.notification.tag).toBe('safety-alert');
    expect(payload.notification.actions).toBeDefined();
    expect(payload.notification.actions[0].action).toBe('view');
  });

  it('validates push subscription payload before saving', () => {
    const validSub: PushSubscriptionConfig = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-sub-1',
      keys: {
        p256dh: 'mock-p256dh-key',
        auth: 'mock-auth-secret',
      },
    };

    expect(manager.isValidSubscription(validSub)).toBe(true);

    const invalidSub: PushSubscriptionConfig = {
      endpoint: '',
      keys: { p256dh: '', auth: '' },
    };
    expect(manager.isValidSubscription(invalidSub)).toBe(false);
  });
});
