export type NotificationType =
  | 'APPROVAL'
  | 'INCIDENT'
  | 'RESEARCH'
  | 'SYSTEM'
  | 'CAMPAIGN'
  | 'TASK'
  | 'PUBLISH'
  | 'SECURITY';

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface EmitNotificationInput {
  type: NotificationType | string;
  severity?: NotificationSeverity | string;
  title: string;
  body: string;
  href?: string;
  entityType?: string;
  entityId?: string;
  dedupeKey?: string;
  dedupeWindowMs?: number; // default: 5 minutes (300_000 ms)
}

export class NotificationService {
  private prismaClient: any;

  constructor(options?: { prisma?: any }) {
    this.prismaClient = options?.prisma;
  }

  private async getPrisma(): Promise<any> {
    if (this.prismaClient !== undefined) return this.prismaClient;
    try {
      if (!process.env.DATABASE_URL) return null;
      const { prisma } = await import('@/lib/prisma');
      return prisma;
    } catch {
      return null;
    }
  }

  async emit(input: EmitNotificationInput): Promise<any> {
    const prisma = await this.getPrisma();
    const dedupeKey =
      input.dedupeKey ||
      `${input.type}:${input.entityType || 'none'}:${input.entityId || 'none'}`;
    const dedupeWindowMs = input.dedupeWindowMs ?? 300_000;
    const windowStart = new Date(Date.now() - dedupeWindowMs);

    if (prisma?.notification) {
      try {
        const existing = await prisma.notification.findFirst({
          where: {
            dedupeKey,
            createdAt: { gte: windowStart },
          },
        });

        if (existing) {
          return existing;
        }

        return await prisma.notification.create({
          data: {
            type: input.type,
            severity: input.severity || 'INFO',
            title: input.title,
            body: input.body,
            href: input.href,
            entityType: input.entityType,
            entityId: input.entityId,
            dedupeKey,
          },
        });
      } catch {
        // Fallback to in-memory record on database query failure
      }
    }

    return {
      id: `mem-${Date.now()}`,
      ...input,
      dedupeKey,
      createdAt: new Date(),
    };
  }

  async emitCampaignEvent(campaignId: string, status: 'APPROVED' | 'REJECTED', title: string) {
    return this.emit({
      type: 'APPROVAL',
      severity: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      title: `Campaign ${status}: ${title}`,
      body: `Campaign was marked ${status} by operator.`,
      entityType: 'campaign',
      entityId: campaignId,
      href: `/dashboard/campaigns?focus=${campaignId}`,
      dedupeKey: `APPROVAL:campaign:${campaignId}:${status}`,
    });
  }

  async emitTaskFailure(taskId: string, error: string) {
    return this.emit({
      type: 'INCIDENT',
      severity: 'WARNING',
      title: `Task Execution Failed: ${taskId}`,
      body: error,
      entityType: 'task',
      entityId: taskId,
      href: `/dashboard/panel?focus=${taskId}`,
      dedupeKey: `INCIDENT:task:${taskId}`,
    });
  }

  async emitPublishResult(publishJobId: string, success: boolean, message: string) {
    return this.emit({
      type: 'PUBLISH',
      severity: success ? 'SUCCESS' : 'WARNING',
      title: success ? 'Video Published Live' : 'Video Publishing Failed',
      body: message,
      entityType: 'publish_job',
      entityId: publishJobId,
      href: `/dashboard/publishing?focus=${publishJobId}`,
      dedupeKey: `PUBLISH:${publishJobId}`,
    });
  }

  async emitBanDetected(accountId: string, reason: string) {
    return this.emit({
      type: 'INCIDENT',
      severity: 'CRITICAL',
      title: `Account Challenge/Ban Detected: ${accountId}`,
      body: reason,
      entityType: 'account',
      entityId: accountId,
      href: `/dashboard/accounts?focus=${accountId}`,
      dedupeKey: `INCIDENT:account:${accountId}`,
    });
  }

  async emitKillSwitchEvent(active: boolean, reason: string) {
    return this.emit({
      type: 'SYSTEM',
      severity: active ? 'CRITICAL' : 'INFO',
      title: active ? 'Kill Switch Activated' : 'Kill Switch Disengaged',
      body: reason,
      entityType: 'system',
      entityId: 'kill_switch',
      href: '/dashboard',
      dedupeKey: `SYSTEM:kill_switch:${active ? 'active' : 'inactive'}`,
      dedupeWindowMs: 60_000,
    });
  }

  async emitSmmFailure(orderId: string, error: string) {
    return this.emit({
      type: 'INCIDENT',
      severity: 'WARNING',
      title: `SMM Provider Order Failed: ${orderId}`,
      body: error,
      entityType: 'smm_order',
      entityId: orderId,
      href: '/dashboard/panel',
      dedupeKey: `INCIDENT:smm:${orderId}`,
    });
  }

  async emitResearchJobFailure(jobId: string, error: string) {
    return this.emit({
      type: 'RESEARCH',
      severity: 'WARNING',
      title: `Research Job Failed: ${jobId}`,
      body: error,
      entityType: 'research_job',
      entityId: jobId,
      href: '/dashboard/research',
      dedupeKey: `RESEARCH:fail:${jobId}`,
    });
  }

  async emitWorkerStale(workerId: string, lastHeartbeat: Date) {
    return this.emit({
      type: 'SYSTEM',
      severity: 'WARNING',
      title: `Worker Heartbeat Stale: ${workerId}`,
      body: `Worker has not sent heartbeat since ${lastHeartbeat.toISOString()}.`,
      entityType: 'worker',
      entityId: workerId,
      href: '/dashboard',
      dedupeKey: `SYSTEM:worker_stale:${workerId}`,
    });
  }
}

export const globalNotificationService = new NotificationService();
