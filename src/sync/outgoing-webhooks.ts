import { createHmac } from 'node:crypto';

export interface WebhookSubscription {
  id: string;
  url: string;
  secret: string;
  events: string[];
}

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  delivered: boolean;
  attemptCount: number;
  statusCode?: number;
  error?: string;
}

export interface DeadLetterItem {
  id: string;
  subscriptionId: string;
  eventId: string;
  endpointUrl: string;
  payload: Record<string, unknown>;
  failedAt: string;
  attempts: number;
  lastError: string;
}

export interface WebhookDispatcherConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  fetchClient?: typeof fetch;
}

export class WebhookDispatcher {
  private maxRetries: number;
  private retryDelayMs: number;
  private fetch: typeof fetch;
  private deadLetterQueue: DeadLetterItem[] = [];

  constructor(config: WebhookDispatcherConfig = {}) {
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
    this.fetch = config.fetchClient || globalThis.fetch.bind(globalThis);
  }

  private signPayload(secret: string, body: string): string {
    const hmac = createHmac('sha256', secret).update(body).digest('hex');
    return `sha256=${hmac}`;
  }

  async dispatch(
    subscription: WebhookSubscription,
    event: WebhookEvent
  ): Promise<WebhookDeliveryResult> {
    const rawBody = JSON.stringify(event);
    const signature = this.signPayload(subscription.secret, rawBody);

    let attempts = 0;
    let lastError = '';

    while (attempts < this.maxRetries) {
      attempts++;
      try {
        const response = await this.fetch(subscription.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-TikBot-Signature': signature,
            'X-TikBot-Timestamp': event.timestamp,
            'X-TikBot-Event': event.type,
          },
          body: rawBody,
        });

        if (response.ok) {
          return {
            delivered: true,
            attemptCount: attempts,
            statusCode: response.status,
          };
        }

        lastError = `HTTP ${response.status} ${response.statusText}`;
      } catch (err: any) {
        lastError = err?.message || 'Network error';
      }

      if (attempts < this.maxRetries && this.retryDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
      }
    }

    // Capture in Dead Letter Queue
    this.deadLetterQueue.push({
      id: `dlq-${Date.now()}-${event.id}`,
      subscriptionId: subscription.id,
      eventId: event.id,
      endpointUrl: subscription.url,
      payload: event.payload,
      failedAt: new Date().toISOString(),
      attempts,
      lastError,
    });

    return {
      delivered: false,
      attemptCount: attempts,
      error: lastError,
    };
  }

  getDeadLetterQueue(): DeadLetterItem[] {
    return [...this.deadLetterQueue];
  }

  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }
}
