import { describe, it, expect, beforeEach } from 'vitest';
import {
  SmartModeOrchestrator,
  type AccountState,
  type QueuedTask,
  type AnomalyEvent,
} from '../smart-mode';

describe('H5.3 Smart Mode Orchestration', () => {
  let orchestrator: SmartModeOrchestrator;

  beforeEach(() => {
    orchestrator = new SmartModeOrchestrator();
  });

  it('detects critical anomaly, auto-pauses target account and redistributes tasks to healthy accounts', () => {
    const accounts: AccountState[] = [
      {
        id: 'acc-unhealthy',
        username: 'unhealthy_bot',
        status: 'ACTIVE',
        hourlyCapacity: 50,
        actionsExecutedThisHour: 45,
      },
      {
        id: 'acc-healthy-1',
        username: 'healthy_bot_1',
        status: 'ACTIVE',
        hourlyCapacity: 60,
        actionsExecutedThisHour: 10,
      },
      {
        id: 'acc-healthy-2',
        username: 'healthy_bot_2',
        status: 'ACTIVE',
        hourlyCapacity: 60,
        actionsExecutedThisHour: 20,
      },
    ];

    const queuedTasks: QueuedTask[] = [
      { id: 'task-1', assignedAccountId: 'acc-unhealthy', actionType: 'LIKE', targetUrl: 'https://tiktok.com/@v1' },
      { id: 'task-2', assignedAccountId: 'acc-unhealthy', actionType: 'COMMENT', targetUrl: 'https://tiktok.com/@v2' },
    ];

    const anomaly: AnomalyEvent = {
      accountId: 'acc-unhealthy',
      type: 'CAPTCHA_BURST',
      severity: 'CRITICAL',
      occurredAt: new Date().toISOString(),
      details: '4 consecutive captchas within 60s',
    };

    const result = orchestrator.handleAnomaly(anomaly, accounts, queuedTasks);

    expect(result.pausedAccountId).toBe('acc-unhealthy');
    expect(result.accountStatusUpdatedTo).toBe('PAUSED');
    expect(result.reassignedTasks.length).toBe(2);
    expect(result.reassignedTasks.every((t) => t.newAccountId !== 'acc-unhealthy')).toBe(true);
    expect(result.notification).toBeDefined();
    expect(result.notification?.type).toBe('ANOMALY_PAUSE');
    expect(result.notification?.title).toContain('Auto-Paused');
    expect(result.notification?.provenance).toBe('live');
  });

  it('does not pause account if anomaly severity is LOW or INFORMATIONAL', () => {
    const accounts: AccountState[] = [
      {
        id: 'acc-mild',
        username: 'mild_bot',
        status: 'ACTIVE',
        hourlyCapacity: 50,
        actionsExecutedThisHour: 10,
      },
    ];
    const anomaly: AnomalyEvent = {
      accountId: 'acc-mild',
      type: 'MINOR_LATENCY_SPIKE',
      severity: 'LOW',
      occurredAt: new Date().toISOString(),
      details: 'Latency spiked to 800ms',
    };

    const result = orchestrator.handleAnomaly(anomaly, accounts, []);
    expect(result.pausedAccountId).toBeUndefined();
    expect(result.accountStatusUpdatedTo).toBeUndefined();
    expect(result.reassignedTasks).toHaveLength(0);
  });

  it('handles case where no eligible healthy accounts are available for redistribution', () => {
    const accounts: AccountState[] = [
      {
        id: 'acc-only',
        username: 'only_bot',
        status: 'ACTIVE',
        hourlyCapacity: 30,
        actionsExecutedThisHour: 20,
      },
    ];
    const tasks: QueuedTask[] = [
      { id: 'task-lone', assignedAccountId: 'acc-only', actionType: 'LIKE', targetUrl: 'https://tiktok.com/@v3' },
    ];
    const anomaly: AnomalyEvent = {
      accountId: 'acc-only',
      type: 'SESSION_REVOCATION',
      severity: 'CRITICAL',
      occurredAt: new Date().toISOString(),
      details: 'Login invalidated by platform',
    };

    const result = orchestrator.handleAnomaly(anomaly, accounts, tasks);
    expect(result.pausedAccountId).toBe('acc-only');
    expect(result.unassignedTaskIds).toContain('task-lone');
    expect(result.reassignedTasks).toHaveLength(0);
  });
});
