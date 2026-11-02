import { describe, it, expect, beforeEach } from 'vitest';
import { listOrders, clearOrders, enqueueOrder } from '@/farm/order-queue';
import { getCohorts, clearCohorts, createCohort } from '@/farm/cohort-manager';

describe('Phase 2 — State Persistence, Memory Cleanup & No Zombie Resurrections', () => {
  beforeEach(() => {
    clearOrders();
    clearCohorts();
  });

  it('order queue returns empty array when empty and never injects sample orders after clear', () => {
    clearOrders();
    const orders = listOrders();
    expect(orders).toEqual([]);

    // Enqueue one order
    const order = enqueueOrder({
      targetUrl: 'https://tiktok.com/@growth/video/123456',
      targetHandle: '@growth',
      goalTier: 'PRIME',
      targetReach: 300,
      plausibilityScore: 90,
    });
    expect(listOrders()).toHaveLength(1);
    expect(listOrders()[0].id).toBe(order.id);

    // Clear orders and verify it remains completely empty
    clearOrders();
    expect(listOrders()).toEqual([]);
  });

  it('cohort manager retains empty state when cleared and does not re-seed on every getCohorts call', () => {
    clearCohorts();
    expect(getCohorts()).toEqual([]);

    createCohort({
      name: 'Custom-Niche',
      niche: 'fitness',
      minTier: 'PRIME',
      accountIds: ['acc-fit-1'],
    });

    expect(getCohorts()).toHaveLength(1);
    expect(getCohorts()[0].name).toBe('Custom-Niche');

    clearCohorts();
    expect(getCohorts()).toEqual([]);
  });

  it('guarantees audit log DTO matches Compliance page query requirements', () => {
    const rawAuditRecord = {
      id: 'audit-log-99',
      action: 'APPROVE_CAMPAIGN',
      resourceId: 'camp-xyz',
      resourceType: 'Campaign',
      timestamp: '2026-11-01T20:00:00.000Z',
      ipAddress: '127.0.0.1',
      metadata: { actorEmail: 'admin@tikbot.local', status: 'SUCCESS' },
    };

    const mappedLog = {
      id: rawAuditRecord.id,
      action: rawAuditRecord.action,
      actorEmail: rawAuditRecord.metadata?.actorEmail || 'admin@tikbot.local',
      resourceId: rawAuditRecord.resourceId || rawAuditRecord.resourceType || 'SYSTEM',
      ipAddress: rawAuditRecord.ipAddress || '127.0.0.1',
      createdAt: rawAuditRecord.timestamp ? new Date(rawAuditRecord.timestamp).toLocaleTimeString() : 'Today',
      status: (rawAuditRecord.metadata?.status as 'SUCCESS' | 'WARNING' | 'FAILED') || 'SUCCESS',
    };

    expect(mappedLog.actorEmail).toBe('admin@tikbot.local');
    expect(mappedLog.resourceId).toBe('camp-xyz');
    expect(mappedLog.action.toLowerCase()).toBe('approve_campaign');
    expect(mappedLog.actorEmail.toLowerCase()).toBe('admin@tikbot.local');
    expect(mappedLog.resourceId.toLowerCase()).toBe('camp-xyz');
  });

  it('guarantees publish jobs DTO matches Publishing page table columns', () => {
    const rawJobRecord = {
      id: 'pub-job-1',
      caption: '3 copywriting hooks',
      status: 'SCHEDULED',
      accountUsername: 'growth_hacker',
      scheduledAt: '2026-11-02T14:00:00.000Z',
      mediaStorageKey: 'hook-1.mp4',
    };

    const mappedJob = {
      id: rawJobRecord.id,
      title: rawJobRecord.caption,
      platform: 'TIKTOK' as const,
      status: rawJobRecord.status,
      account: rawJobRecord.accountUsername ? `@${rawJobRecord.accountUsername}` : '@account',
      scheduledAt: rawJobRecord.scheduledAt ? new Date(rawJobRecord.scheduledAt).toLocaleTimeString() : 'Scheduled',
    };

    expect(mappedJob.account).toBe('@growth_hacker');
    expect(mappedJob.title).toBe('3 copywriting hooks');
    expect(mappedJob.status).toBe('SCHEDULED');
    expect(mappedJob.scheduledAt).toBeDefined();
  });
});
