export interface ViewerPoint {
  timestamp: string;
  count: number;
}

export interface CapturedQuestion {
  author: string;
  text: string;
  timestamp: string;
}

export interface LiveRoomTracker {
  targetHandle: string;
  currentViewers: number;
  peakViewers: number;
  viewerTimeSeries: ViewerPoint[];
  capturedQuestions: CapturedQuestion[];
  totalGiftsCount: number;
}

export type LiveRoomEvent =
  | { type: 'VIEWER_COUNT'; viewerCount: number; timestamp: string }
  | { type: 'CHAT_MESSAGE'; author: string; text: string; timestamp: string }
  | { type: 'GIFT'; author: string; giftName: string; count: number; timestamp: string };

export function createLiveRoomTracker(targetHandle: string): LiveRoomTracker {
  return {
    targetHandle,
    currentViewers: 0,
    peakViewers: 0,
    viewerTimeSeries: [],
    capturedQuestions: [],
    totalGiftsCount: 0,
  };
}

export function ingestLiveEvent(tracker: LiveRoomTracker, event: LiveRoomEvent): void {
  switch (event.type) {
    case 'VIEWER_COUNT':
      tracker.currentViewers = event.viewerCount;
      if (event.viewerCount > tracker.peakViewers) {
        tracker.peakViewers = event.viewerCount;
      }
      tracker.viewerTimeSeries.push({
        timestamp: event.timestamp,
        count: event.viewerCount,
      });
      break;

    case 'CHAT_MESSAGE':
      if (
        event.text.includes('?') ||
        /^(how|what|why|where|can you|could you)/i.test(event.text.trim())
      ) {
        tracker.capturedQuestions.push({
          author: event.author,
          text: event.text,
          timestamp: event.timestamp,
        });
      }
      break;

    case 'GIFT':
      tracker.totalGiftsCount += event.count;
      break;
  }
}
