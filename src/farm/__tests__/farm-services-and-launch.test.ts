import { describe, it, expect } from 'vitest';
import {
  getServiceCatalog,
  getServiceById,
  validateServiceEligibility,
  FarmServiceDef,
} from '../service-catalog';
import {
  createWizardState,
  validateWizardStep,
  serializeWizardToUrl,
  deserializeWizardFromUrl,
  buildOrderFromWizard,
} from '../launch-wizard';
import {
  createCohort,
  getCohorts,
  getCohortById,
  replenishCohortAccount,
  filterHealthyCohortAccounts,
} from '../cohort-manager';
import {
  enqueueOrder,
  pauseOrder,
  resumeOrder,
  abortOrder,
  getOrderStatus,
  retryFailedOrder,
  listOrders,
  clearOrders,
} from '../order-queue';

describe('Phase F5 — Service Catalog (F5.1)', () => {
  it('returns all 8 required farm services with caps and tiers', () => {
    const catalog = getServiceCatalog();
    expect(catalog).toHaveLength(8);
    const serviceIds = catalog.map((s) => s.id);
    expect(serviceIds).toContain('watch');
    expect(serviceIds).toContain('like');
    expect(serviceIds).toContain('comment');
    expect(serviceIds).toContain('share');
    expect(serviceIds).toContain('save');
    expect(serviceIds).toContain('follow');
    expect(serviceIds).toContain('live-boost');
    expect(serviceIds).toContain('FYP_PUSH');
  });

  it('validates tier eligibility and daily caps', () => {
    const watch = getServiceById('watch')!;
    expect(watch).toBeDefined();
    expect(watch.minTier).toBe('FRESH');

    const comment = getServiceById('comment')!;
    expect(comment.minTier).toBe('MATURE');

    // FRESH account cannot execute comment (requires MATURE)
    const freshCheck = validateServiceEligibility('comment', 'FRESH', 0, 50);
    expect(freshCheck.eligible).toBe(false);
    expect(freshCheck.reason).toContain('Tier');

    // MATURE account with cap reached
    const capCheck = validateServiceEligibility('comment', 'MATURE', 10, 50);
    expect(capCheck.eligible).toBe(false);
    expect(capCheck.reason).toContain('Daily cap');

    // Budget exceeded
    const budgetCheck = validateServiceEligibility('FYP_PUSH', 'PRIME', 0, 5);
    expect(budgetCheck.eligible).toBe(false);
    expect(budgetCheck.reason).toContain('Safety budget');

    // Unknown service
    const unknownCheck = validateServiceEligibility('nonexistent', 'PRIME', 0, 50);
    expect(unknownCheck.eligible).toBe(false);
    expect(unknownCheck.reason).toContain('not found');

    // Eligible PRIME
    const okCheck = validateServiceEligibility('FYP_PUSH', 'PRIME', 1, 20);
    expect(okCheck.eligible).toBe(true);
  });
});

describe('Phase F5 — Launch Wizard (F5.2)', () => {
  it('initializes default wizard state and validates steps', () => {
    const initial = createWizardState();
    expect(initial.step).toBe(1);
    expect(initial.target.canaryCheck).toBe('PENDING');

    // Step 1 fails without URL
    const step1Invalid = validateWizardStep(1, initial);
    expect(step1Invalid.valid).toBe(false);

    // Step 1 fails with missing handle
    initial.target.url = 'https://www.tiktok.com/@creator/video/1234567890';
    initial.target.handle = '';
    expect(validateWizardStep(1, initial).valid).toBe(false);

    // Step 1 fails with failed canary
    initial.target.handle = '@creator';
    initial.target.canaryCheck = 'FAILED';
    expect(validateWizardStep(1, initial).valid).toBe(false);

    // Step 1 valid
    initial.target.canaryCheck = 'PASSED';
    expect(validateWizardStep(1, initial).valid).toBe(true);

    // Step 2 validations
    initial.goal.viewCount = -5;
    expect(validateWizardStep(2, initial).valid).toBe(false);
    initial.goal.viewCount = 100;
    initial.goal.deliveryHours = 0;
    expect(validateWizardStep(2, initial).valid).toBe(false);
    initial.goal.deliveryHours = 4;
    expect(validateWizardStep(2, initial).valid).toBe(true);

    // Step 3 validations
    initial.cohort.niche = '';
    expect(validateWizardStep(3, initial).valid).toBe(false);
    initial.cohort.niche = 'tech';
    expect(validateWizardStep(3, initial).valid).toBe(true);

    // Step 4 validations
    initial.pacing.jitterPercent = 90;
    expect(validateWizardStep(4, initial).valid).toBe(false);
    initial.pacing.jitterPercent = 10;
    expect(validateWizardStep(4, initial).valid).toBe(true);

    // Step 5 validations
    initial.safety.clusterViolation = true;
    expect(validateWizardStep(5, initial).valid).toBe(false);
    initial.safety.clusterViolation = false;
    initial.safety.preflightScore = 40;
    expect(validateWizardStep(5, initial).valid).toBe(false);
    initial.safety.preflightScore = 85;
    expect(validateWizardStep(5, initial).valid).toBe(true);
    expect(validateWizardStep(6, initial).valid).toBe(true);
  });

  it('serializes and deserializes wizard state to URL query string', () => {
    const wizard = createWizardState();
    wizard.step = 3;
    wizard.target.url = 'https://www.tiktok.com/@chef/video/987654';
    wizard.target.handle = '@chef';
    wizard.goal.viewCount = 500;
    wizard.cohort.niche = 'cooking';

    const queryString = serializeWizardToUrl(wizard);
    expect(queryString).toContain('w_step=3');
    expect(queryString).toContain('w_niche=cooking');

    const restored = deserializeWizardFromUrl(queryString);
    expect(restored.step).toBe(3);
    expect(restored.target.handle).toBe('@chef');
    expect(restored.goal.viewCount).toBe(500);
    expect(restored.cohort.niche).toBe('cooking');

    // Deserialization edge cases
    const defaultRestored = deserializeWizardFromUrl('');
    expect(defaultRestored.step).toBe(1);
    const invalidStep = deserializeWizardFromUrl('w_step=99');
    expect(invalidStep.step).toBe(1);
  });

  it('builds a FarmBoostOrder payload from a completed wizard', () => {
    const wizard = createWizardState();
    wizard.target = { url: 'https://tiktok.com/@gamer/video/111', handle: '@gamer', canaryCheck: 'PASSED' };
    wizard.goal = { viewCount: 1000, likeCount: 200, commentCount: 30, shareCount: 50, deliveryHours: 6 };
    wizard.cohort = { id: 'cohort-1', niche: 'gaming', minTier: 'MATURE', availableCount: 25 };
    wizard.pacing = { curveType: 'GAUSSIAN', peakHourOffset: 2, jitterPercent: 15 };
    wizard.safety = { preflightScore: 88, clusterViolation: false, approved: true };

    const order = buildOrderFromWizard(wizard);
    expect(order.targetUrl).toBe(wizard.target.url);
    expect(order.targetHandle).toBe('@gamer');
    expect(order.targetReach).toBe(1000);
    expect(order.goalTier).toBe('MATURE');
    expect(order.status).toBe('PENDING');
  });
});

describe('Phase F5 — Cohort Manager (F5.3)', () => {
  it('creates and retrieves cohorts', () => {
    const cohort = createCohort({
      name: 'Tech-Prime-US',
      niche: 'technology',
      minTier: 'PRIME',
      accountIds: ['acc-1', 'acc-2', 'acc-3'],
    });

    expect(cohort.id).toBeDefined();
    expect(getCohortById(cohort.id)?.name).toBe('Tech-Prime-US');
    expect(getCohorts()).toContainEqual(expect.objectContaining({ id: cohort.id }));
  });

  it('replenishes quarantined accounts from available pool', () => {
    const cohort = createCohort({
      name: 'Crypto-Fresh',
      niche: 'crypto',
      minTier: 'FRESH',
      accountIds: ['acc-10', 'acc-11'],
    });

    const candidatePool = [
      { id: 'acc-12', niche: 'crypto', tier: 'FRESH', status: 'ACTIVE' },
      { id: 'acc-13', niche: 'beauty', tier: 'FRESH', status: 'ACTIVE' },
    ];

    const updated = replenishCohortAccount(cohort.id, 'acc-10', candidatePool);
    expect(updated.accountIds).not.toContain('acc-10');
    expect(updated.accountIds).toContain('acc-12');

    // Replenish when no candidate available
    const emptyPoolUpdated = replenishCohortAccount(cohort.id, 'acc-11', []);
    expect(emptyPoolUpdated.accountIds).not.toContain('acc-11');

    // Invalid cohort ID throws
    expect(() => replenishCohortAccount('nonexistent-cohort', 'acc-1', [])).toThrow();
  });

  it('filters healthy cohort accounts based on health threshold', () => {
    const healthMap = new Map([
      ['acc-1', 85],
      ['acc-2', 42], // Unhealthy (<50)
      ['acc-3', 70],
    ]);
    const healthy = filterHealthyCohortAccounts(['acc-1', 'acc-2', 'acc-3', 'acc-missing'], healthMap);
    expect(healthy).toEqual(['acc-1', 'acc-3', 'acc-missing']);
  });
});

describe('Phase F5 — Order Queue & Lifecycle (F5.4)', () => {
  it('enqueues, pauses, resumes, and aborts orders', () => {
    clearOrders();
    const order = enqueueOrder({
      targetUrl: 'https://tiktok.com/@dance/video/777',
      targetHandle: '@dance',
      goalTier: 'MATURE',
      targetReach: 500,
      plausibilityScore: 92,
    });

    expect(order.status).toBe('RUNNING');
    expect(getOrderStatus(order.id)?.status).toBe('RUNNING');

    pauseOrder(order.id);
    expect(getOrderStatus(order.id)?.status).toBe('PAUSED');

    resumeOrder(order.id);
    expect(getOrderStatus(order.id)?.status).toBe('RUNNING');

    abortOrder(order.id);
    expect(getOrderStatus(order.id)?.status).toBe('ABORTED');

    // Invalid order actions throw
    expect(() => pauseOrder('fake-order')).toThrow();
    expect(() => resumeOrder('fake-order')).toThrow();
    expect(() => abortOrder('fake-order')).toThrow();
    expect(() => retryFailedOrder('fake-order')).toThrow();
  });

  it('handles retry on failed order with backoff tracking', () => {
    clearOrders();
    const order = enqueueOrder({
      targetUrl: 'https://tiktok.com/@test/video/888',
      targetHandle: '@test',
      goalTier: 'JUNIOR',
      targetReach: 100,
      plausibilityScore: 80,
    });

    order.status = 'FAILED';
    order.lastError = 'Network timeout';

    const retried = retryFailedOrder(order.id);
    expect(retried.status).toBe('RUNNING');
    expect(retried.retryCount).toBe(1);
    expect(retried.lastError).toBeUndefined();
  });
});
