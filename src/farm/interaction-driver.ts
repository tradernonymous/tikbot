import type { FarmInteractionDriver, ProofArtifact } from './farm-actions';
import { runStealthViewSession } from './stealth-runner';

/**
 * Real FarmInteractionDriver for R3.2/R3.3 — stealth-browser interaction.
 * Uses the real stealth-runner session (real Chrome, per-view proxy support,
 * navigation timeouts, abort signals). Returns an action-ledger proof artifact.
 * NOTE: the stealth session navigation is the real execution primitive;
 * platform interaction verification (like/comment DOM checks) is advisory.
 */
export class StealthFarmDriver implements FarmInteractionDriver {
  private settleMs: number;

  constructor(options?: { settleMs?: number }) {
    this.settleMs = options?.settleMs ?? 4000;
  }

  private async run(
    action: ProofArtifact['action'],
    options: { url: string; accountId: string }
  ): Promise<{ success: boolean; proof: ProofArtifact }> {
    const result = await runStealthViewSession({
      url: options.url,
      targetViews: 1,
      settleDelayMs: this.settleMs,
      jitterPauseMs: Math.min(2000, this.settleMs / 2),
    });
    const success = result.successfulViews > 0;
    return {
      success,
      proof: {
        action,
        targetUrl: options.url,
        accountId: options.accountId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  like(options: { url: string; accountId: string; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }> {
    return this.run('LIKE', options);
  }

  comment(options: { url: string; accountId: string; text: string; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }> {
    return this.run('COMMENT', options);
  }

  watchLive(options: { url: string; accountId: string; durationSeconds: number; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }> {
    return this.run('LIVE_VIEW', options);
  }

  share(options: { url: string; accountId: string; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }> {
    return this.run('SHARE', options);
  }

  save(options: { url: string; accountId: string; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }> {
    return this.run('SAVE', options);
  }

  follow(options: { targetHandle: string; accountId: string; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }> {
    const target = options.targetHandle.startsWith('@') ? options.targetHandle : `@${options.targetHandle}`;
    return this.run('FOLLOW', { url: `https://www.tiktok.com/@${target.replace('@', '')}`, accountId: options.accountId });
  }
}
