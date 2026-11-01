import { randomUUID } from 'node:crypto';
import { KillSwitchManager, globalKillSwitch } from '../security/kill-switch';
import {
  computeVariantFingerprint,
  assertVariantIntegrity,
  registerPublishedVariant,
} from './variant-integrity-guard';

export interface PublishRequest {
  accountId: string;
  mediaPath: string;
  caption: string;
  hasValidSession: boolean;
  scheduledTime?: Date;
  fingerprintSha256?: string;
}

export interface PublishResult {
  success: boolean;
  publishedVideoId: string;
  url: string;
  publishId?: string;
  providerStatus?: string;
  privacyLevel?: 'SELF_ONLY' | 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR';
  driverType?: 'OFFICIAL' | 'BROWSER' | 'MOCK';
  details?: Record<string, unknown>;
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

    // A3.7 Variant integrity guard
    const fingerprint = req.fingerprintSha256 || computeVariantFingerprint(req.mediaPath);
    assertVariantIntegrity(
      { accountId: req.accountId, fingerprintSha256: fingerprint },
      { throwOnBlock: true }
    );

    const result = await this.uploaderDriver(req);

    registerPublishedVariant({
      accountId: req.accountId,
      fingerprintSha256: fingerprint,
      jobId: result.publishedVideoId || randomUUID(),
    });

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
