import { describe, it, expect, beforeEach } from 'vitest';
import {
  AccountCreationPipeline,
  type CreationJob,
  type CreationStage,
} from '../creation-pipeline';
import { CadenceGovernor } from '../cadence-governor';
import {
  getAgingTier,
  isServiceAllowedForTier,
  type AgingTier,
} from '../aging-tiers';
import { calculateCreationAnalytics } from '../creation-analytics';

describe('F1.3 Account Creation Pipeline', () => {
  let pipeline: AccountCreationPipeline;

  beforeEach(() => {
    pipeline = new AccountCreationPipeline();
  });

  it('progresses through stages until AGING is reached', async () => {
    const job: CreationJob = {
      id: 'job-create-1',
      accountId: 'acc-new-1',
      stage: 'PERSONA_PROVISION',
      proxyIp: '104.28.1.5',
      attempts: 0,
      maxAttempts: 3,
    };

    const result = await pipeline.processJob(job);
    expect(result.stage).toBe('AGING');
    expect(result.status).toBe('COMPLETED');
    expect(result.completedAt).toBeDefined();
  });

  it('dead-letters with reason taxonomy when fatal failure occurs', async () => {
    const job: CreationJob = {
      id: 'job-create-fail',
      accountId: 'acc-bad',
      stage: 'SIGNUP_FLOW',
      proxyIp: '104.28.1.6',
      attempts: 3,
      maxAttempts: 3,
    };

    const result = await pipeline.failJob(job, 'IP_FLAGGED', 'Proxy IP blocked by Cloudflare');
    expect(result.status).toBe('DEAD_LETTER');
    expect(result.failureReason).toBe('IP_FLAGGED');
  });

  it('pauses for operator confirmation if phone verification spend is required without approval', async () => {
    const job: CreationJob = {
      id: 'job-phone-gated',
      accountId: 'acc-phone-req',
      stage: 'PHONE_VERIFY',
      proxyIp: '104.28.1.7',
      attempts: 0,
      maxAttempts: 3,
      requiresPaidSms: true,
      operatorConfirmedSpend: false,
    };

    const result = await pipeline.processJob(job);
    expect(result.status).toBe('WAITING_OPERATOR_APPROVAL');
    expect(result.stage).toBe('PHONE_VERIFY');
  });
});

describe('F1.4 Creation Cadence Governor', () => {
  let governor: CadenceGovernor;

  beforeEach(() => {
    governor = new CadenceGovernor({
      minIpCooldownHours: 24,
      dailyPoolLimit: 5,
    });
  });

  it('allows creation on fresh proxy IP', () => {
    const check = governor.canCreateOnProxy('198.51.100.1');
    expect(check.allowed).toBe(true);
  });

  it('rejects creation on same proxy IP before 24h cooldown expires', () => {
    governor.recordCreation('198.51.100.2');
    const check = governor.canCreateOnProxy('198.51.100.2');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('cooldown');
  });

  it('enforces daily pool creation ceiling', () => {
    for (let i = 0; i < 5; i++) {
      governor.recordCreation(`198.51.100.${10 + i}`);
    }

    const check = governor.canCreateOnProxy('198.51.100.99');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Daily pool limit');
  });
});

describe('F1.5 Aging Tiers & Service Gating', () => {
  it('correctly categorizes aging tiers by account age', () => {
    expect(getAgingTier(1)).toBe('FRESH');
    expect(getAgingTier(5)).toBe('JUNIOR');
    expect(getAgingTier(20)).toBe('MATURE');
    expect(getAgingTier(60)).toBe('PRIME');
  });

  it('enforces service permissions based on aging tier', () => {
    // FRESH: only passive view/scroll
    expect(isServiceAllowedForTier('FRESH', 'VIEW')).toBe(true);
    expect(isServiceAllowedForTier('FRESH', 'LIKE')).toBe(false);
    expect(isServiceAllowedForTier('FRESH', 'FYP_PUSH')).toBe(false);

    // JUNIOR: view, like, follow
    expect(isServiceAllowedForTier('JUNIOR', 'LIKE')).toBe(true);
    expect(isServiceAllowedForTier('JUNIOR', 'COMMENT')).toBe(false);

    // MATURE: comment, share
    expect(isServiceAllowedForTier('MATURE', 'COMMENT')).toBe(true);
    expect(isServiceAllowedForTier('MATURE', 'FYP_PUSH')).toBe(false);

    // PRIME: all services allowed including FYP_PUSH
    expect(isServiceAllowedForTier('PRIME', 'FYP_PUSH')).toBe(true);
    expect(isServiceAllowedForTier('PRIME', 'LIVE_BOOST')).toBe(true);
  });
});

describe('F1.6 Creation Analytics', () => {
  it('calculates cohort survival and stage conversion with live provenance', () => {
    const cohorts = [
      { id: 'acc-1', ageDays: 10, status: 'ACTIVE' },
      { id: 'acc-2', ageDays: 20, status: 'BANNED' },
      { id: 'acc-3', ageDays: 40, status: 'ACTIVE' },
    ];

    const analytics = calculateCreationAnalytics(cohorts);
    expect(analytics.totalAccounts).toBe(3);
    expect(analytics.survivalRate7d).toBeGreaterThan(0);
    expect(analytics.provenance).toBe('live');
  });
});
