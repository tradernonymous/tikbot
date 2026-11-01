export interface PushSubscriptionConfig {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayloadInput {
  title: string;
  body: string;
  targetUrl?: string;
  tag?: string;
  icon?: string;
}

export interface FormattedPushPayload {
  notification: {
    title: string;
    body: string;
    icon: string;
    tag: string;
    data: {
      url: string;
      timestamp: number;
    };
    actions: Array<{
      action: string;
      title: string;
    }>;
  };
}

export class PushNotificationManager {
  private vapidPublicKey: string;

  constructor(options: { vapidPublicKey: string }) {
    this.vapidPublicKey = options.vapidPublicKey;
  }

  getPublicKey(): string {
    return this.vapidPublicKey;
  }

  isValidSubscription(sub?: PushSubscriptionConfig | null): boolean {
    if (!sub || !sub.endpoint || typeof sub.endpoint !== 'string') {
      return false;
    }
    if (!sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      return false;
    }
    return true;
  }

  formatPushPayload(input: PushNotificationPayloadInput): FormattedPushPayload {
    const targetUrl = input.targetUrl || '/dashboard';
    return {
      notification: {
        title: input.title,
        body: input.body,
        icon: input.icon || '/icon-192.png',
        tag: input.tag || 'tikbot-alert',
        data: {
          url: targetUrl,
          timestamp: Date.now(),
        },
        actions: [
          {
            action: 'view',
            title: 'Open in Dashboard',
          },
        ],
      },
    };
  }
}
