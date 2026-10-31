import { randomUUID } from 'node:crypto';
import { KillSwitchManager, globalKillSwitch } from '../security/kill-switch';

export interface PublishRequest {
  accountId: string;
  mediaPath: string;
  caption: string;
  hasValidSession: boolean;
  scheduledTime?: Date;
}

export interface PublishResult {
  success: boolean;
  publishedVideoId: string;
  url: string;
}

export interface PublishAuditEntry {
  id: string;
  accountId: string;
  mediaPath: string;
  caption: string;
  publishedVideoId: string;
  url: string;
  timestamp: Date;
}

export type UploaderDriver = (req: PublishRequest) => Promise<PublishResult>;

export class PublisherNotConfiguredError extends Error {
  constructor() {
    super('PUBLISHER_NOT_CONFIGURED: No explicit UploaderDriver provided. Real driver must be injected.');
    this.name = 'PublisherNotConfiguredError';
  }
}

export class ContentPublisher {
  private killSwitch: KillSwitchManager;
  private uploaderDriver: UploaderDriver;
  private auditTrail: PublishAuditEntry[] = [];

  constructor(options: { killSwitch?: KillSwitchManager; uploaderDriver: UploaderDriver }) {
    if (!options || !options.uploaderDriver) {
      throw new PublisherNotConfiguredError();
    }
    this.killSwitch = options.killSwitch || globalKillSwitch;
    this.uploaderDriver = options.uploaderDriver;
  }

  async publishVideo(req: PublishRequest): Promise<PublishResult> {
    this.killSwitch.assertOperationsPermitted();

    if (!req.hasValidSession) {
      throw new Error(`Account ${req.accountId} does not have an active authenticated session. Re-login required.`);
    }

    const result = await this.uploaderDriver(req);

    this.auditTrail.push({
      id: randomUUID(),
      accountId: req.accountId,
      mediaPath: req.mediaPath,
      caption: req.caption,
      publishedVideoId: result.publishedVideoId,
      url: result.url,
      timestamp: new Date(),
    });

    return result;
  }

  getAuditLog(): PublishAuditEntry[] {
    return [...this.auditTrail];
  }
}
