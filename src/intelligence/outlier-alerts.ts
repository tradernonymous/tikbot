import { emitRealtimeEvent } from '@/sync/server-event-bus';

export interface OutlierPostEvent {
  postId: string;
  authorHandle: string;
  views: number;
  baselineViews: number;
  outlierScore: number;
  title: string;
  hookText?: string;
  videoUrl: string;
}

export interface OutlierAlertResult {
  alertCreated: boolean;
  notificationPayload?: {
    id: string;
    title: string;
    message: string;
    category: 'OUTLIER';
    href: string;
  };
  composerJumpUrl?: string;
}

export function processOutlierBreach(
  event: OutlierPostEvent,
  thresholdMultiplier: number = 3.0
): OutlierAlertResult {
  if (event.outlierScore < thresholdMultiplier) {
    return { alertCreated: false };
  }

  const hookParam = event.hookText ? `&hook=${encodeURIComponent(event.hookText)}` : '';
  const composerJumpUrl = `/dashboard/composer?topic=${encodeURIComponent(
    event.title
  )}${hookParam}&carriedFrom=outlier&outlierScore=${event.outlierScore}`;

  const notificationPayload = {
    id: `notif-outlier-${event.postId}`,
    title: `🔥 ${event.outlierScore}x Viral Outlier Detected`,
    message: `@${event.authorHandle} published a breakout post with ${event.views.toLocaleString()} views.`,
    category: 'OUTLIER' as const,
    href: composerJumpUrl,
  };

  emitRealtimeEvent({
    type: 'NOTIFICATION_ADDED',
    channel: 'notifications',
    payload: notificationPayload,
  });

  return {
    alertCreated: true,
    notificationPayload,
    composerJumpUrl,
  };
}
