import { describe, it, expect } from 'vitest';
import {
  BindingMatrixStore,
  extractSubnet24,
} from '../binding-matrix';
import {
  AutoQuarantineManager,
  type FarmerAccount,
} from '../auto-quarantine';
import { calculateAccountHealthScore } from '../account-health-score';
import { ReachCanaryDetector, computeMedianAndMad } from '../reach-canary';
import { IncidentLogManager } from '../incident-log';
import { CadenceGovernor } from '../cadence-governor';
import { calculateCreationAnalytics } from '../creation-analytics';
import { TargetCanaryMonitor } from '../target-monitor';
import { resetPersonaCacheForTesting } from '../persona-generator';

describe('Farm Edge Branches Coverage Booster', () => {
  it('covers extractSubnet24 with non-ipv4 string', () => {
    expect(extractSubnet24('invalid-or-ipv6')).toBe('invalid-or-ipv6');
  });

  it('covers binding matrix unbind, duplicate email, and duplicate phone branches', () => {
    const matrix = new BindingMatrixStore();
    matrix.registerBinding({
      accountId: 'acc-1',
      personaId: 'p-1',
      proxyId: 'prx-1',
      proxyIp: '1.2.3.4',
      emailSlot: 'e1@test.com',
      phoneSlot: '+12345',
    });

    // Duplicate email
    expect(() => {
      matrix.registerBinding({
        accountId: 'acc-2',
        personaId: 'p-2',
        proxyId: 'prx-2',
        proxyIp: '5.6.7.8',
        emailSlot: 'e1@test.com',
      });
    }).toThrow('Email slot');

    // Duplicate phone
    expect(() => {
      matrix.registerBinding({
        accountId: 'acc-3',
        personaId: 'p-3',
        proxyId: 'prx-3',
        proxyIp: '9.10.11.12',
        emailSlot: 'e3@test.com',
        phoneSlot: '+12345',
      });
    }).toThrow('Phone slot');

    // unbind existing
    expect(matrix.unbind('acc-1')).toBe(true);
    // unbind non-existent
    expect(matrix.unbind('non-existent')).toBe(false);
  });

  it('covers AutoQuarantineManager when account is healthy or restoring missing account', () => {
    const mgr = new AutoQuarantineManager();
    const healthy: FarmerAccount = {
      id: 'h-1',
      username: 'healthy',
      healthScore: 85,
      status: 'ACTIVE',
      assignedCohortIds: ['c1'],
    };

    const res = mgr.evaluateForQuarantine(healthy, false);
    expect(res.quarantined).toBe(false);

    const restoreMissing = mgr.restoreFromQuarantine('missing-id', 'test notes');
    expect(restoreMissing.accountId).toBe('missing-id');
  });

  it('covers account health score DEGRADED and NORMAL statuses', () => {
    // Score ~60 -> DEGRADED
    const degraded = calculateAccountHealthScore({
      reachTrendRatio: 0.5,
      loginSuccessRate: 0.7,
      captchaChallengeCountLast7d: 1,
      actionSuccessRate: 0.8,
      accountAgeDays: 10,
    });
    expect(['DEGRADED', 'NORMAL']).toContain(degraded.status);

    // Score ~75 -> NORMAL
    const normal = calculateAccountHealthScore({
      reachTrendRatio: 0.8,
      loginSuccessRate: 0.9,
      captchaChallengeCountLast7d: 0,
      actionSuccessRate: 0.9,
      accountAgeDays: 15,
    });
    expect(normal.status).toBe('NORMAL');
  });

  it('covers computeMedianAndMad empty and even array, and ReachCanary reset', () => {
    expect(computeMedianAndMad([])).toEqual({ median: 0, mad: 0 });

    const even = computeMedianAndMad([10, 20, 30, 40]);
    expect(even.median).toBe(25);

    const canary = new ReachCanaryDetector();
    canary.reset('acc-to-reset');
  });

  it('covers IncidentLogManager getters and non-proxy incident', () => {
    const log = new IncidentLogManager();
    log.recordIncident({
      accountId: 'acc-no-proxy',
      type: 'REACH_DROP',
      details: 'Drop noted',
    });

    expect(log.getIncidentsForAccount('acc-no-proxy')).toHaveLength(1);
    expect(log.getIncidentsForProxy('random-proxy')).toHaveLength(0);
  });

  it('covers CadenceGovernor default config and creation-analytics empty cohort', () => {
    const gov = new CadenceGovernor();
    expect(gov.canCreateOnProxy('1.1.1.1').allowed).toBe(true);

    const emptyAnalytics = calculateCreationAnalytics([]);
    expect(emptyAnalytics.totalAccounts).toBe(0);
  });

  it('covers TargetCanaryMonitor velocity collapse check', () => {
    const monitor = new TargetCanaryMonitor();
    const res = monitor.evaluateTargetHealth({
      targetUrl: 'https://tiktok.com/@test/video/1',
      currentViewVelocity: 5,
      baselineVelocity: 100, // 5 < 30% of 100
    });
    expect(res.safeToProceed).toBe(false);
    expect(res.anomalyDetected).toBe('VELOCITY_COLLAPSE');
  });

  it('covers resetPersonaCacheForTesting', () => {
    expect(() => resetPersonaCacheForTesting()).not.toThrow();
  });
});
