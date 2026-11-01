import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateDiscoveryPath,
  type DiscoveryPathType,
} from '../discovery-paths';
import {
  simulateWatchSession,
  type WatchSessionProfile,
} from '../watch-behavior';
import {
  determineEngagementAction,
  type EngagementConfig,
} from '../engagement-mix';
import {
  CommentQualityPool,
  isCommentDuplicateOrTooSimilar,
} from '../comment-pool';
import { generateVelocityCurve } from '../velocity-curve';
import {
  ClusterBreakerSolver,
  type AccountActionCandidate,
} from '../cluster-breaker';
import {
  PlausibilitySimulator,
  type BoostPlanSpecification,
} from '../guardrails/plausibility-simulator';
import {
  SafetyRulesEngine,
} from '../guardrails/rules-engine';

describe('F4.2 Discovery Path Diversity', () => {
  it('generates diverse discovery paths matching organic referral split (majority search/profile)', () => {
    const paths: DiscoveryPathType[] = [];
    for (let i = 0; i < 100; i++) {
      paths.push(generateDiscoveryPath(`acc-${i}`, 'creator_handle', '#trend'));
    }

    const searchProfileCount = paths.filter((p) => p.type === 'SEARCH_CREATOR_PROFILE').length;
    const searchTagCount = paths.filter((p) => p.type === 'SEARCH_HASHTAG_SOUND').length;
    const directCount = paths.filter((p) => p.type === 'DIRECT_WATCH').length;

    expect(searchProfileCount).toBeGreaterThanOrEqual(35);
    expect(searchTagCount).toBeGreaterThanOrEqual(25);
    expect(directCount).toBeLessThan(30);
    expect(paths.every((p) => Boolean(p.entryUrl))).toBe(true);
  });
});

describe('F4.3 Watch Behavior Engine', () => {
  it('simulates organic human watch duration with completion and rewatch signals', () => {
    const videoDuration = 30.0;
    const session = simulateWatchSession('acc-1', videoDuration);

    expect(session.watchDurationSeconds).toBeGreaterThanOrEqual(videoDuration * 0.5);
    if (session.watchType === 'COMPLETION') {
      expect(session.watchDurationSeconds).toBeGreaterThanOrEqual(videoDuration);
    }
    if (session.watchType === 'REWATCH') {
      expect(session.watchDurationSeconds).toBeGreaterThanOrEqual(videoDuration * 1.8);
      expect(session.loopCount).toBe(2);
    }
  });
});

describe('F4.4 Engagement Mix Ratios', () => {
  it('produces probabilistic engagement where only a realistic fraction engages', () => {
    const config: EngagementConfig = {
      likeProbability: 0.12, // 12%
      commentProbability: 0.04, // 4%
      shareProbability: 0.02, // 2%
      saveProbability: 0.05, // 5%
    };

    let liked = 0;
    let commented = 0;
    let didNothing = 0;

    for (let i = 0; i < 200; i++) {
      const actions = determineEngagementAction(`acc-${i}`, config);
      if (actions.shouldLike) liked++;
      if (actions.shouldComment) commented++;
      if (!actions.shouldLike && !actions.shouldComment && !actions.shouldShare && !actions.shouldSave) {
        didNothing++;
      }
    }

    // Must never be 100% engagement
    expect(didNothing).toBeGreaterThan(100);
    expect(liked).toBeGreaterThan(5);
  });
});

describe('F4.5 Comment Quality Pool & Similarity Check', () => {
  it('detects duplicate or near-identical comments', () => {
    const c1 = 'This AI tool is absolutely incredible!';
    const c2 = 'This AI tool is absolutely incredible';
    const c3 = 'What prompt did you use for the 3D renders?';

    expect(isCommentDuplicateOrTooSimilar(c1, c2)).toBe(true);
    expect(isCommentDuplicateOrTooSimilar(c1, c3)).toBe(false);
  });

  it('generates varied in-niche comments with questions and uniqueness enforcement', () => {
    const pool = new CommentQualityPool({
      nicheKeywords: ['ai', 'growth', 'automation'],
    });

    const comment1 = pool.generateUniqueComment('post-123', 'acc-1');
    const comment2 = pool.generateUniqueComment('post-123', 'acc-2');

    expect(comment1).not.toBe(comment2);
    expect(isCommentDuplicateOrTooSimilar(comment1, comment2)).toBe(false);
  });
});

describe('F4.6 Velocity Curve Scheduler', () => {
  it('distributes target views along a smooth curve without flat bursts', () => {
    const schedule = generateVelocityCurve({
      totalTargetViews: 600,
      durationHours: 6,
      peakHourIndex: 2,
    });

    expect(schedule.hourlySlots.length).toBe(6);
    const sum = schedule.hourlySlots.reduce((a, b) => a + b, 0);
    expect(sum).toBe(600);

    // Peak hour has more volume than initial hour
    expect(schedule.hourlySlots[2]).toBeGreaterThan(schedule.hourlySlots[0]);
    expect(schedule.hourlySlots[2]).toBeGreaterThan(schedule.hourlySlots[5]);
  });
});

describe('F4.7 Cluster Breaker Solver', () => {
  it('rejects accounts sharing proxy subnet or fingerprint family inside the same window', () => {
    const solver = new ClusterBreakerSolver({
      windowMinutes: 60,
    });

    const acc1: AccountActionCandidate = {
      accountId: 'acc-1',
      proxySubnet: '192.168.10.0/24',
      fingerprintFamily: 'CAMOUFOX_MALI',
      creationBatchId: 'batch-jan-1',
    };

    const acc2SameSubnet: AccountActionCandidate = {
      accountId: 'acc-2',
      proxySubnet: '192.168.10.0/24', // Collides
      fingerprintFamily: 'BROWSER_OXIDE_APPLE',
      creationBatchId: 'batch-jan-2',
    };

    solver.recordAction('target-post-1', acc1);

    const check1 = solver.canPerformAction('target-post-1', acc2SameSubnet);
    expect(check1.allowed).toBe(false);
    expect(check1.reason).toContain('subnet collision');
  });
});

describe('F6.1 & F6.2 Safety Rules Engine & Plausibility Simulator', () => {
  it('rules engine includes documented TikTok guideline references', () => {
    const rules = SafetyRulesEngine.getActiveRules();
    expect(rules.length).toBeGreaterThanOrEqual(4);
    expect(rules.every((r) => r.docRef.includes('TikTok'))).toBe(true);
  });

  it('simulator scores plausibility: GREEN for natural distribution, RED for instant flat burst', () => {
    const simulator = new PlausibilitySimulator();

    const naturalPlan: BoostPlanSpecification = {
      targetPostUrl: 'https://tiktok.com/@growth/video/99',
      totalTargetViews: 500,
      windowHours: 8,
      instantBurst: false,
      likeRatio: 0.10,
      commentRatio: 0.03,
      directUrlFraction: 0.15,
    };

    const naturalScore = simulator.simulatePlan(naturalPlan);
    expect(naturalScore.rating).toBe('GREEN');
    expect(naturalScore.score).toBeGreaterThanOrEqual(80);

    const botSpikePlan: BoostPlanSpecification = {
      targetPostUrl: 'https://tiktok.com/@growth/video/99',
      totalTargetViews: 10000,
      windowHours: 1, // 10k in 1 hour
      instantBurst: true, // flat burst tell
      likeRatio: 0.90, // 90% like ratio is impossible
      commentRatio: 0.50,
      directUrlFraction: 1.0, // naked url only
    };

    const spikeScore = simulator.simulatePlan(botSpikePlan);
    expect(spikeScore.rating).toBe('RED');
    expect(spikeScore.blockLaunch).toBe(true);
    expect(spikeScore.violations.length).toBeGreaterThanOrEqual(2);
  });
});

import { FarmBanCircuitExtender } from '../guardrails/ban-circuit-ext';

describe('F6.3 Ban-Signal Circuit Wiring', () => {
  it('trips global circuit breaker when cohort-wide reach canary breaches 30%', () => {
    const extender = new FarmBanCircuitExtender({ cascadeThresholdRatio: 0.3 });

    const healthyCohort = extender.evaluateCohortCanary({
      cohortId: 'cohort-1',
      totalMembers: 10,
      membersBreachedReachCanary: 1, // 10% < 30%
      reachDropRatio: 0.1,
    });
    expect(healthyCohort.tripGlobalCircuitBreaker).toBe(false);

    const breachedCohort = extender.evaluateCohortCanary({
      cohortId: 'cohort-2',
      totalMembers: 10,
      membersBreachedReachCanary: 4, // 40% >= 30%
      reachDropRatio: 0.4,
    });
    expect(breachedCohort.tripGlobalCircuitBreaker).toBe(true);
    expect(breachedCohort.quarantineCascadeThrottled).toBe(true);
    expect(breachedCohort.reason).toContain('Cohort-wide reach canary breach');
  });
});
