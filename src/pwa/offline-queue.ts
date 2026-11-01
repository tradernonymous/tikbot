export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: Record<string, unknown>;
  timestamp: number;
}

export interface ReplaySummary {
  succeeded: number;
  failed: number;
}

export type MutationReplayHandler = (mutation: QueuedMutation) => Promise<unknown>;

export class OfflineMutationQueue {
  private queue: QueuedMutation[] = [];

  enqueue(mutation: QueuedMutation): void {
    this.queue.push({ ...mutation });
    this.queue.sort((a, b) => a.timestamp - b.timestamp);
  }

  size(): number {
    return this.queue.length;
  }

  peekAll(): QueuedMutation[] {
    return [...this.queue];
  }

  async replayQueuedMutations(handler: MutationReplayHandler): Promise<ReplaySummary> {
    const remaining: QueuedMutation[] = [];
    let succeeded = 0;
    let failed = 0;

    for (const mutation of this.queue) {
      try {
        await handler(mutation);
        succeeded++;
      } catch {
        failed++;
        remaining.push(mutation);
      }
    }

    this.queue = remaining;
    return { succeeded, failed };
  }

  clear(): void {
    this.queue = [];
  }
}
