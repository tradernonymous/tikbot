import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkOperationalAlerts, AlertStateInput } from '../alert-watchdog';

describe('Operational Alert Watchdog (R7.2)', () => {
  let mockNotificationService: any;

  beforeEach(() => {
    mockNotificationService = {
      emitWorkerStale: vi.fn(),
      emitIncident: vi.fn(),
      emitKillSwitchToggled: vi.fn(),
      emitSmmFailure: vi.fn(),
    };
  });

  it('triggers alert notification when worker heartbeat is stale (>60s)', async () => {
    const input: AlertStateInput = {
      workerId: 'worker-1',
      lastHeartbeatAgeSeconds: 75,
      activeAccounts: 50,
      bannedAccountsLast10Min: 0,
      smmFailedOrders: [],
      killSwitchActive: false,
    };

    const alerts = await checkOperationalAlerts(input, mockNotificationService);

    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('STALE_HEARTBEAT');
    expect(mockNotificationService.emitWorkerStale).toHaveBeenCalledWith(
      'worker-1',
      expect.any(Date)
    );
  });

  it('triggers critical alert when ban spike occurs', async () => {
    const input: AlertStateInput = {
      workerId: 'worker-1',
      lastHeartbeatAgeSeconds: 10,
      activeAccounts: 50,
      bannedAccountsLast10Min: 4,
      smmFailedOrders: [],
      killSwitchActive: false,
    };

    const alerts = await checkOperationalAlerts(input, mockNotificationService);

    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('BAN_SPIKE');
    expect(mockNotificationService.emitIncident).toHaveBeenCalledWith(
      'CRITICAL',
      expect.stringContaining('Ban Spike'),
      expect.stringContaining('4 accounts banned')
    );
  });

  it('triggers notification on failed SMM supplier orders', async () => {
    const input: AlertStateInput = {
      workerId: 'worker-1',
      lastHeartbeatAgeSeconds: 10,
      activeAccounts: 50,
      bannedAccountsLast10Min: 0,
      smmFailedOrders: [{ orderId: 'ord-88', error: 'Balance depleted' }],
      killSwitchActive: false,
    };

    const alerts = await checkOperationalAlerts(input, mockNotificationService);

    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('SMM_FAILURE');
    expect(mockNotificationService.emitSmmFailure).toHaveBeenCalledWith(
      'ord-88',
      'Balance depleted'
    );
  });
});
