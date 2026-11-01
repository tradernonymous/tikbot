import { useEffect } from 'react';
import { ingestServerEvent } from './client-event-bus';

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'PAUSED';

export function calculateBackoffMs(retryCount: number): number {
  return Math.min(30000, 1000 * Math.pow(2, retryCount));
}

export class RealtimeConnectionManager {
  private url: string;
  private status: ConnectionStatus = 'DISCONNECTED';
  private eventSource: EventSource | null = null;
  private retryCount = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isPausedForVisibility = false;

  constructor(url: string = '/api/v1/realtime/stream') {
    this.url = url;
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public start() {
    if (typeof window === 'undefined') return;
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') return;

    this.setupVisibilityListener();
    this.connect();
  }

  public stop() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.status = 'DISCONNECTED';
  }

  private connect() {
    if (typeof EventSource === 'undefined') {
      this.status = 'DISCONNECTED';
      return;
    }

    try {
      this.status = 'CONNECTING';
      this.eventSource = new EventSource(this.url);

      this.eventSource.onopen = () => {
        this.status = 'CONNECTED';
        this.retryCount = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data.startsWith(':')) return; // ignore heartbeat comments
          const parsed = JSON.parse(event.data);
          ingestServerEvent(parsed);
        } catch {
          // ignore parsing error
        }
      };

      this.eventSource.onerror = () => {
        this.handleDisconnect();
      };
    } catch {
      this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.status = 'DISCONNECTED';

    // Do not reconnect while hidden in background
    if (this.isPausedForVisibility) {
      this.status = 'PAUSED';
      return;
    }

    const delay = calculateBackoffMs(this.retryCount);
    this.retryCount++;
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private setupVisibilityListener() {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        this.isPausedForVisibility = true;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      } else {
        // Tab became visible again
        this.isPausedForVisibility = false;
        if (this.status === 'DISCONNECTED' || this.status === 'PAUSED') {
          this.retryCount = 0;
          this.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
}

// React Hook for using realtime sync in application root
export function useClientRealtime(url: string = '/api/v1/realtime/stream') {
  useEffect(() => {
    const manager = new RealtimeConnectionManager(url);
    manager.start();
    return () => {
      manager.stop();
    };
  }, [url]);
}
