export type ClientSyncEventType =
  | 'CAMPAIGN_UPDATED'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_ADDED'
  | 'NOTIFICATION_CLEARED'
  | 'JOB_UPDATED'
  | 'ACCOUNT_UPDATED'
  | 'KILL_SWITCH_CHANGED'
  | 'CONTEXT_CHANGED'
  | 'DRAWER_OPEN'
  | 'SPLIT_VIEW_CHANGED'
  | 'UNDO_AVAILABLE';

export interface ClientSyncEvent<T = any> {
  type: ClientSyncEventType;
  payload: T;
  sourceTabId: string;
  timestamp: string;
}

export interface ServerEventEnvelope {
  type: string;
  jobId?: string;
  name?: string;
  status?: string;
  progress?: number;
  message?: string;
  timestamp?: string;
  data?: any;
}

let localTabId: string | null = null;

export function getClientTabId(): string {
  if (!localTabId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      localTabId = `tab-${crypto.randomUUID()}`;
    } else {
      localTabId = `tab-${Math.random().toString(36).substring(2, 10)}`;
    }
  }
  return localTabId;
}

type SyncEventHandler = (event: ClientSyncEvent) => void;

class ClientEventBusManager {
  private listeners: Set<SyncEventHandler> = new Set();
  private channel: any = null;

  constructor() {
    this.initChannel();
  }

  private initChannel() {
    if (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
      try {
        this.channel = new window.BroadcastChannel('tikbot_sync_bus');
        this.channel.onmessage = (msg: MessageEvent) => {
          if (msg && msg.data && msg.data.type) {
            this._handleForeignEvent(msg.data);
          }
        };
      } catch {
        this.channel = null;
      }
    }
  }

  public _handleForeignEvent(event: ClientSyncEvent) {
    this.listeners.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        // Prevent listener errors from crashing the bus
      }
    });
  }

  public subscribe(handler: SyncEventHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  public broadcast<T>(eventData: Omit<ClientSyncEvent<T>, 'sourceTabId' | 'timestamp'>): ClientSyncEvent<T> {
    const fullEvent: ClientSyncEvent<T> = {
      ...eventData,
      sourceTabId: getClientTabId(),
      timestamp: new Date().toISOString(),
    };

    // 1. Dispatch locally to current tab listeners
    this.listeners.forEach((handler) => {
      try {
        handler(fullEvent);
      } catch {
        // ignore
      }
    });

    // 2. Broadcast to other tabs via BroadcastChannel
    if (this.channel && typeof this.channel.postMessage === 'function') {
      try {
        this.channel.postMessage(fullEvent);
      } catch {
        // channel error
      }
    }

    return fullEvent;
  }

  public close() {
    this.listeners.clear();
    if (this.channel && typeof this.channel.close === 'function') {
      try {
        this.channel.close();
      } catch {
        // ignore
      }
      this.channel = null;
    }
  }
}

// Global bus reference across hot module reloads
const globalKey = '__TIKBOT_SYNC_BUS__';
function getGlobalBus(): ClientEventBusManager {
  const g = globalThis as any;
  if (!g[globalKey]) {
    g[globalKey] = new ClientEventBusManager();
  }
  return g[globalKey];
}

export function broadcastSyncEvent<T>(
  event: Omit<ClientSyncEvent<T>, 'sourceTabId' | 'timestamp'>
): ClientSyncEvent<T> {
  return getGlobalBus().broadcast(event);
}

export function subscribeSyncEvents(handler: SyncEventHandler): () => void {
  return getGlobalBus().subscribe(handler);
}

export function ingestServerEvent(serverEvent: ServerEventEnvelope): ClientSyncEvent | null {
  if (!serverEvent || !serverEvent.type) return null;

  const type = serverEvent.type.toUpperCase();

  if (type.startsWith('JOB_')) {
    return broadcastSyncEvent({
      type: 'JOB_UPDATED',
      payload: {
        jobId: serverEvent.jobId,
        status: serverEvent.status,
        progress: serverEvent.progress,
        message: serverEvent.message,
      },
    });
  }

  if (type === 'CAMPAIGN_STATUS' || type === 'CAMPAIGN_UPDATED') {
    return broadcastSyncEvent({
      type: 'CAMPAIGN_UPDATED',
      payload: serverEvent.data || { campaignId: serverEvent.jobId },
    });
  }

  if (type === 'NOTIFICATION' || type === 'NOTIFICATION_ADDED') {
    return broadcastSyncEvent({
      type: 'NOTIFICATION_ADDED',
      payload: serverEvent.data,
    });
  }

  return null;
}

export function resetClientEventBusForTesting(): void {
  const g = globalThis as any;
  if (g[globalKey]) {
    g[globalKey].close();
    delete g[globalKey];
  }
  localTabId = null;
}
