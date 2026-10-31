import { NotificationService } from '@/notifications/service';

export interface AlertStateInput {
  workerId?: string;
  lastHeartbeatAgeSeconds: number;
  activeAccounts: number;
  bannedAccountsLast10Min: number;
  smmFailedOrders: Array<{ orderId: string; error: string }>;
  killSwitchActive: boolean;
}

export interface TriggeredAlert {
  type: 'STALE_HEARTBEAT' | 'BAN_SPIKE' | 'SMM_FAILURE' | 'KILL_SWITCH';
  message: string;
}

export async function checkOperationalAlerts(
  input: AlertStateInput,
  notifications: NotificationService
): Promise<TriggeredAlert[]> {
  const alerts: TriggeredAlert[] = [];

  // 1. Worker heartbeat age > 60 seconds
  if (input.lastHeartbeatAgeSeconds > 60 && input.workerId) {
    const lastHeartbeat = new Date(Date.now() - input.lastHeartbeatAgeSeconds * 1000);
    await notifications.emitWorkerStale(input.workerId, lastHeartbeat);
    alerts.push({
      type: 'STALE_HEARTBEAT',
      message: `Worker ${input.workerId} heartbeat is stale (${input.lastHeartbeatAgeSeconds}s)`,
    });
  }

  // 2. Ban spike: >= 3 bans in 10 minutes
  if (input.bannedAccountsLast10Min >= 3) {
    await notifications.emitIncident(
      'CRITICAL',
      'Ban Spike Detected',
      `Detected ${input.bannedAccountsLast10Min} accounts banned in the last 10 minutes. Velocity paused.`
    );
    alerts.push({
      type: 'BAN_SPIKE',
      message: `${input.bannedAccountsLast10Min} accounts banned in 10m window`,
    });
  }

  // 3. SMM provider failures
  for (const smmFailure of input.smmFailedOrders) {
    await notifications.emitSmmFailure(smmFailure.orderId, smmFailure.error);
    alerts.push({
      type: 'SMM_FAILURE',
      message: `SMM Order ${smmFailure.orderId} failed: ${smmFailure.error}`,
    });
  }

  return alerts;
}
