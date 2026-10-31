import { randomUUID } from 'node:crypto';
import { KillSwitchManager, globalKillSwitch } from '../security/kill-switch';
import { PublishingPlatform } from './composer';

export type ScheduleStatus =
  | 'PENDING_APPROVAL'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'RETRYING'
  | 'FAILED'
  | 'CANCELLED';

export interface ScheduleItemInput {
  mediaAssetId: string;
  caption: string;
  platform: PublishingPlatform;
  scheduledAt: Date;
  accountId: string;
  tags?: string[];
}

export interface ScheduleItem extends ScheduleItemInput {
  id: string;
  status: ScheduleStatus;
  approvedBy?: string;
  approvedAt?: Date;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  nextRetryAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
}

export interface SchedulerOptions {
  killSwitch?: KillSwitchManager;
  defaultMaxRetries?: number;
}

export class ContentScheduler {
  private items = new Map<string, ScheduleItem>();
  private killSwitch: KillSwitchManager;
  private defaultMaxRetries: number;

  constructor(options: SchedulerOptions = {}) {
    this.killSwitch = options.killSwitch || globalKillSwitch;
    this.defaultMaxRetries = options.defaultMaxRetries ?? 3;
  }

  schedulePost(input: ScheduleItemInput): ScheduleItem {
    const id = randomUUID();
    const item: ScheduleItem = {
      ...input,
      id,
      status: 'PENDING_APPROVAL',
      retryCount: 0,
      maxRetries: this.defaultMaxRetries,
      createdAt: new Date(),
    };

    this.items.set(id, item);
    return item;
  }

  getScheduleItem(id: string): ScheduleItem | undefined {
    return this.items.get(id);
  }

  approveScheduleItem(id: string, operatorId: string): ScheduleItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`Schedule item ${id} not found`);

    item.status = 'SCHEDULED';
    item.approvedBy = operatorId;
    item.approvedAt = new Date();
    return item;
  }

  generateRecurringSlots(params: {
    startDate: Date;
    intervalHours: number;
    count: number;
  }): Date[] {
    const slots: Date[] = [];
    const intervalMs = params.intervalHours * 60 * 60 * 1000;

    for (let i = 0; i < params.count; i++) {
      slots.push(new Date(params.startDate.getTime() + i * intervalMs));
    }

    return slots;
  }

  recordPublishFailure(id: string, errorReason: string): ScheduleItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`Schedule item ${id} not found`);

    item.retryCount += 1;
    item.lastError = errorReason;

    if (item.retryCount >= item.maxRetries) {
      item.status = 'FAILED';
      item.nextRetryAt = undefined;
    } else {
      item.status = 'RETRYING';
      // Exponential backoff: 2^(retryCount) * 60 seconds
      const delayMs = Math.pow(2, item.retryCount) * 60 * 1000;
      item.nextRetryAt = new Date(Date.now() + delayMs);
    }

    return item;
  }

  recordPublishSuccess(id: string): ScheduleItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`Schedule item ${id} not found`);

    item.status = 'PUBLISHED';
    item.publishedAt = new Date();
    return item;
  }

  assertCanPublish(): void {
    this.killSwitch.assertOperationsPermitted();
  }
}
