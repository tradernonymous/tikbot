import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../service';

describe('F1.2 NotificationService.emit() with Dedupe Window', () => {
  let mockPrisma: any;
  let service: NotificationService;

  beforeEach(() => {
    mockPrisma = {
      notification: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    };
    service = new NotificationService({ prisma: mockPrisma });
  });

  it('emits a new notification when no duplicate exists in dedupe window', async () => {
    mockPrisma.notification.findFirst.mockResolvedValueOnce(null);
    mockPrisma.notification.create.mockResolvedValueOnce({
      id: 'notif-1',
      type: 'CAMPAIGN',
      severity: 'INFO',
      title: 'Campaign Approved',
      body: 'Campaign 123 was approved by operator',
      entityType: 'campaign',
      entityId: 'camp-123',
      dedupeKey: 'CAMPAIGN:campaign:camp-123',
      createdAt: new Date(),
    });

    const result = await service.emit({
      type: 'CAMPAIGN',
      severity: 'INFO',
      title: 'Campaign Approved',
      body: 'Campaign 123 was approved by operator',
      entityType: 'campaign',
      entityId: 'camp-123',
      href: '/dashboard/campaigns?focus=camp-123',
    });

    expect(result.id).toBe('notif-1');
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'CAMPAIGN',
          dedupeKey: 'CAMPAIGN:campaign:camp-123',
        }),
      })
    );
  });

  it('collapses duplicates within the 5-minute dedupe window and emits exactly once', async () => {
    const existing = {
      id: 'notif-existing',
      type: 'INCIDENT',
      severity: 'CRITICAL',
      title: 'Account Banned',
      body: 'Account acc-1 was challenged or banned',
      entityType: 'account',
      entityId: 'acc-1',
      dedupeKey: 'INCIDENT:account:acc-1',
      createdAt: new Date(Date.now() - 60_000), // 1 min ago
    };

    mockPrisma.notification.findFirst.mockResolvedValueOnce(existing);

    const duplicateResult = await service.emit({
      type: 'INCIDENT',
      severity: 'CRITICAL',
      title: 'Account Banned',
      body: 'Account acc-1 was challenged or banned again',
      entityType: 'account',
      entityId: 'acc-1',
      dedupeWindowMs: 300_000,
    });

    expect(duplicateResult.id).toBe('notif-existing');
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it('emits a new notification when the dedupe window has expired', async () => {
    // findFirst returns null because query specifies createdAt >= (now - window)
    mockPrisma.notification.findFirst.mockResolvedValueOnce(null);
    mockPrisma.notification.create.mockResolvedValueOnce({
      id: 'notif-new',
      type: 'SYSTEM',
      severity: 'WARNING',
      title: 'Kill Switch Activated',
      body: 'Emergency kill switch triggered',
      dedupeKey: 'SYSTEM:kill_switch',
      createdAt: new Date(),
    });

    const result = await service.emit({
      type: 'SYSTEM',
      severity: 'WARNING',
      title: 'Kill Switch Activated',
      body: 'Emergency kill switch triggered',
      dedupeKey: 'SYSTEM:kill_switch',
      dedupeWindowMs: 300_000,
    });

    expect(result.id).toBe('notif-new');
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
  });

  describe('Integration Sources emit verification', () => {
    it('campaign approval emits exactly one notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValueOnce(null);
      mockPrisma.notification.create.mockResolvedValueOnce({ id: 'n-camp' });

      await service.emitCampaignEvent('camp-456', 'APPROVED', 'Q4 Engagement');
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('task failure emits incident notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValueOnce(null);
      mockPrisma.notification.create.mockResolvedValueOnce({ id: 'n-task' });

      await service.emitTaskFailure('task-789', 'Execution timed out');
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('kill switch state change emits notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValueOnce(null);
      mockPrisma.notification.create.mockResolvedValueOnce({ id: 'n-ks' });

      await service.emitKillSwitchEvent(true, 'Admin initiated');
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('ban detection emits critical notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValueOnce(null);
      mockPrisma.notification.create.mockResolvedValueOnce({ id: 'n-ban' });

      await service.emitBanDetected('acc-999', 'TikTok returned checkpoint / challenge');
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('publish result emits notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValueOnce(null);
      mockPrisma.notification.create.mockResolvedValueOnce({ id: 'n-pub' });

      await service.emitPublishResult('pub-123', true, 'Published');
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('smm failure emits incident notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValueOnce(null);
      mockPrisma.notification.create.mockResolvedValueOnce({ id: 'n-smm' });

      await service.emitSmmFailure('smm-456', 'Provider balance zero');
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('research job failure emits research notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValueOnce(null);
      mockPrisma.notification.create.mockResolvedValueOnce({ id: 'n-res' });

      await service.emitResearchJobFailure('res-789', 'Download API error');
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('worker stale emits system warning', async () => {
      mockPrisma.notification.findFirst.mockResolvedValueOnce(null);
      mockPrisma.notification.create.mockResolvedValueOnce({ id: 'n-work' });

      await service.emitWorkerStale('worker-1', new Date());
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('falls back to in-memory notification when prisma is not available', async () => {
      const memoryService = new NotificationService({ prisma: null });
      const memNotif = await memoryService.emit({
        type: 'SYSTEM',
        title: 'Memory notification',
        body: 'Running in memory',
      });
      expect(memNotif.id).toMatch(/^mem-/);
    });
  });
});
