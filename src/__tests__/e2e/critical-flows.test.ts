import { describe, it, expect, beforeEach } from 'vitest';
import { KillSwitchManager } from '../../security/kill-switch';
import { CampaignManager } from '../../engagement/campaign';
import { AccountLifecycleManager } from '../../farm/account-lifecycle';
import { AccountRateLimiter } from '../../farm/rate-limiter';
import { ActionOrchestrator } from '../../engagement/orchestrator';
import { ContentPublisher } from '../../content/publisher';
import { detectOutliers } from '../../intelligence/outliers';
import { encryptSecret, decryptSecret } from '../../security/crypto';

describe('E2E Critical Flows — Master System Verification', () => {
  let killSwitch: KillSwitchManager;
  const masterKey = '0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    killSwitch = new KillSwitchManager();
  });

  it('Critical Flow 1: Global Kill Switch halts all operational dispatch immediately', async () => {
    const rateLimiter = new AccountRateLimiter();
    const orchestrator = new ActionOrchestrator({ rateLimiter, killSwitch });
    const publisher = new ContentPublisher({ killSwitch });

    // Step 1: Normal operations succeed
    const normalDispatch = orchestrator.dispatchAction({
      accountId: 'farm-node-1',
      actionType: 'LIKE',
      targetUrl: 'https://tiktok.com/@creator/video/1',
      timestamp: new Date('2026-10-31T12:00:00Z'),
    });
    expect(normalDispatch.allowed).toBe(true);

    // Step 2: Emergency kill switch activated
    killSwitch.setKillSwitch(true, 'Critical security breach suspected', 'operator-admin');
    expect(killSwitch.isActive()).toBe(true);

    // Step 3: Orchestrator immediately blocks engagement dispatch
    expect(() => {
      orchestrator.dispatchAction({
        accountId: 'farm-node-1',
        actionType: 'LIKE',
        targetUrl: 'https://tiktok.com/@creator/video/1',
        timestamp: new Date('2026-10-31T12:00:00Z'),
      });
    }).toThrow(/Operational Kill Switch is ACTIVE/);

    // Step 4: Publisher immediately blocks video publishing
    await expect(
      publisher.publishVideo({
        accountId: 'farm-node-1',
        mediaPath: '/tmp/vid.mp4',
        caption: 'Should fail',
        hasValidSession: true,
      })
    ).rejects.toThrow(/Operational Kill Switch is ACTIVE/);
  });

  it('Critical Flow 2: Account creation, session encryption, and warmup lifecycle', () => {
    // Step 1: Create account in CREATED state
    const lifecycle = new AccountLifecycleManager('acc-e2e-1', 'CREATED');
    expect(lifecycle.getState()).toBe('CREATED');

    // Step 2: Store session cookies in AES-256-GCM cipher vault
    const sessionCookie = 'sessionid=992838484; tt_chain_token=xyz123';
    const encryptedCookie = encryptSecret(sessionCookie, masterKey);
    expect(encryptedCookie).not.toContain('sessionid');

    // Step 3: Transition to WARMING
    lifecycle.transitionTo('WARMING', 'Commenced 7-day warmup sequence');
    expect(lifecycle.getState()).toBe('WARMING');

    // Step 4: Transition to ACTIVE once warmup is complete
    lifecycle.transitionTo('ACTIVE', 'Completed warmup routine with 0 challenges');
    expect(lifecycle.getState()).toBe('ACTIVE');

    // Step 5: Decrypt session to verify integrity
    const decryptedCookie = decryptSecret(encryptedCookie, masterKey);
    expect(decryptedCookie).toBe(sessionCookie);
  });

  it('Critical Flow 3: Campaign manual approval gate prevents unauthorized execution', () => {
    // Step 1: Create campaign in PENDING_APPROVAL
    const campaign = new CampaignManager({
      id: 'camp-101',
      title: 'Q4 Viral Engagement Boost',
      targetUrl: 'https://tiktok.com/@brand/video/555',
      actionType: 'LIKE',
      targetCount: 100,
    }, 'PENDING_APPROVAL');

    expect(campaign.getStatus()).toBe('PENDING_APPROVAL');

    // Step 2: Verify execution attempt before approval fails
    expect(() => campaign.startExecution()).toThrow(
      /Explicit manual approval required/
    );

    // Step 3: Operator approves campaign
    campaign.approve('operator-master', 'Target URL and velocity caps verified');
    expect(campaign.getStatus()).toBe('APPROVED');

    // Step 4: Execution succeeds post-approval
    campaign.startExecution();
    expect(campaign.getStatus()).toBe('RUNNING');
  });

  it('Critical Flow 4: Rate limit velocity guardrails protect accounts from bans', () => {
    const rateLimiter = new AccountRateLimiter();
    const orchestrator = new ActionOrchestrator({ rateLimiter });
    const fixedTime = new Date('2026-10-31T14:00:00Z');

    // Comment cap is 3/hour
    for (let i = 0; i < 3; i++) {
      const res = orchestrator.dispatchAction({
        accountId: 'farm-node-guarded',
        actionType: 'COMMENT',
        targetUrl: 'https://tiktok.com/@target/video/1',
        timestamp: fixedTime,
      });
      expect(res.allowed).toBe(true);
    }

    // 4th comment in the same hour triggers rejection
    expect(() => {
      orchestrator.dispatchAction({
        accountId: 'farm-node-guarded',
        actionType: 'COMMENT',
        targetUrl: 'https://tiktok.com/@target/video/1',
        timestamp: fixedTime,
      });
    }).toThrow(/Hourly cap exceeded for COMMENT/);
  });

  it('Critical Flow 5: Research outlier intelligence detects breakout content', () => {
    const posts = [
      { id: 'p1', views: 1000, likes: 50, comments: 5, shares: 2 },
      { id: 'p2', views: 1200, likes: 60, comments: 6, shares: 3 },
      { id: 'p3', views: 800, likes: 40, comments: 4, shares: 1 },
      // Outlier post with high viral engagement rate
      { id: 'p-viral', views: 5000, likes: 3000, comments: 800, shares: 500 },
    ];

    const results = detectOutliers(posts, 1.5);
    const viralOutlier = results.find((r) => r.id === 'p-viral');

    expect(viralOutlier).toBeDefined();
    expect(viralOutlier?.isOutlier).toBe(true);
    expect(viralOutlier?.outlierMultiplier).toBeGreaterThan(1.5);
  });
});
