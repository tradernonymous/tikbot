import { EventEmitter } from 'events';
import { globalJobEventBus, JobEvent } from '@/queue/job-events';

export type RealtimeChannel =
  | 'jobs'
  | 'notifications'
  | 'campaigns'
  | 'accounts'
  | 'live'
  | 'system';

export interface RealtimeServerEnvelope<T = any> {
  type: string;
  channel: RealtimeChannel;
  payload: T;
  timestamp: string;
}

class RealtimeEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(200);

    // Wire globalJobEventBus into RealtimeEventBus automatically
    globalJobEventBus.subscribe((jobEvent: JobEvent) => {
      this.emitRealtimeEvent({
        type: jobEvent.type,
        channel: 'jobs',
        payload: {
          jobId: jobEvent.jobId,
          name: jobEvent.name,
          status: jobEvent.status,
          progress: jobEvent.progress,
          message: jobEvent.message,
          job: jobEvent.job,
        },
        timestamp: jobEvent.timestamp || new Date().toISOString(),
      });
    });
  }

  emitRealtimeEvent(envelope: Omit<RealtimeServerEnvelope, 'timestamp'> & { timestamp?: string }): RealtimeServerEnvelope {
    const fullEnvelope: RealtimeServerEnvelope = {
      ...envelope,
      timestamp: envelope.timestamp || new Date().toISOString(),
    };
    this.emit('realtime_event', fullEnvelope);
    return fullEnvelope;
  }

  subscribe(listener: (event: RealtimeServerEnvelope) => void): () => void {
    this.on('realtime_event', listener);
    return () => {
      this.off('realtime_event', listener);
    };
  }
}

export const globalRealtimeEventBus = new RealtimeEventBus();

export function emitRealtimeEvent<T = any>(
  envelope: Omit<RealtimeServerEnvelope<T>, 'timestamp'> & { timestamp?: string }
): RealtimeServerEnvelope<T> {
  return globalRealtimeEventBus.emitRealtimeEvent(envelope);
}

export function subscribeRealtimeEvents(listener: (event: RealtimeServerEnvelope) => void): () => void {
  return globalRealtimeEventBus.subscribe(listener);
}
