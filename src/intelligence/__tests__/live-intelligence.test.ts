import { describe, it, expect } from 'vitest';
import {
  createLiveRoomTracker,
  ingestLiveEvent,
  LiveRoomEvent,
} from '../live-intelligence';

describe('Live Room Intelligence (G6.12)', () => {
  it('tracks viewer concurrency time series and records peak viewers', () => {
    const tracker = createLiveRoomTracker('creator_handle');

    ingestLiveEvent(tracker, {
      type: 'VIEWER_COUNT',
      viewerCount: 150,
      timestamp: '2026-11-01T10:00:00Z',
    });

    ingestLiveEvent(tracker, {
      type: 'VIEWER_COUNT',
      viewerCount: 420,
      timestamp: '2026-11-01T10:05:00Z',
    });

    ingestLiveEvent(tracker, {
      type: 'VIEWER_COUNT',
      viewerCount: 310,
      timestamp: '2026-11-01T10:10:00Z',
    });

    expect(tracker.peakViewers).toBe(420);
    expect(tracker.viewerTimeSeries.length).toBe(3);
    expect(tracker.currentViewers).toBe(310);
  });

  it('captures chat questions for automatic feeding into content ideas', () => {
    const tracker = createLiveRoomTracker('creator_handle');

    ingestLiveEvent(tracker, {
      type: 'CHAT_MESSAGE',
      author: 'fan_123',
      text: 'How do you set up your proxy chain for multiple accounts?',
      timestamp: '2026-11-01T10:02:00Z',
    });

    ingestLiveEvent(tracker, {
      type: 'CHAT_MESSAGE',
      author: 'fan_456',
      text: 'Nice stream bro!',
      timestamp: '2026-11-01T10:03:00Z',
    });

    expect(tracker.capturedQuestions.length).toBe(1);
    expect(tracker.capturedQuestions[0].text).toContain('proxy chain');
  });
});
