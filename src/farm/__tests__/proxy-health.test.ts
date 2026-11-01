import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProxyHealthScorer,
  type ProxyHealthRecord,
  type ProxyAssignment,
} from '../proxy-health';

describe('H5.2 Proxy Health Scoring & Pool Rebalancing', () => {
  let scorer: ProxyHealthScorer;

  beforeEach(() => {
    scorer = new ProxyHealthScorer({
      retirementScoreThreshold: 40,
      consecutiveFailureLimit: 5,
    });
  });

  it('computes high score for fast, reliable proxy with zero bans', () => {
    const record: ProxyHealthRecord = {
      proxyId: 'prx-1',
      totalRequests: 100,
      successfulRequests: 98,
      averageLatencyMs: 150,
      bansAssociated: 0,
      captchasAssociated: 1,
      consecutiveFailures: 0,
      status: 'ACTIVE',
    };

    const evaluation = scorer.evaluateProxy(record);
    expect(evaluation.score).toBeGreaterThanOrEqual(90);
    expect(evaluation.isHealthy).toBe(true);
    expect(evaluation.recommendRetirement).toBe(false);
  });

  it('computes low score and recommends retirement when latency is high and bans are associated', () => {
    const record: ProxyHealthRecord = {
      proxyId: 'prx-2',
      totalRequests: 50,
      successfulRequests: 25, // 50%
      averageLatencyMs: 2500, // very high
      bansAssociated: 2, // severe
      captchasAssociated: 6,
      consecutiveFailures: 3,
      status: 'ACTIVE',
    };

    const evaluation = scorer.evaluateProxy(record);
    expect(evaluation.score).toBeLessThan(40);
    expect(evaluation.isHealthy).toBe(false);
    expect(evaluation.recommendRetirement).toBe(true);
  });

  it('triggers immediate retirement when consecutive failure limit is breached', () => {
    const record: ProxyHealthRecord = {
      proxyId: 'prx-3',
      totalRequests: 30,
      successfulRequests: 24,
      averageLatencyMs: 200,
      bansAssociated: 0,
      captchasAssociated: 0,
      consecutiveFailures: 6, // > 5
      status: 'ACTIVE',
    };

    const evaluation = scorer.evaluateProxy(record);
    expect(evaluation.recommendRetirement).toBe(true);
    expect(evaluation.status).toBe('RETIRED');
  });

  it('rebalances account assignments from retired proxies to healthiest available proxies', () => {
    const proxies: ProxyHealthRecord[] = [
      {
        proxyId: 'bad-1',
        totalRequests: 20,
        successfulRequests: 5,
        averageLatencyMs: 3000,
        bansAssociated: 2,
        captchasAssociated: 5,
        consecutiveFailures: 6,
        status: 'ACTIVE',
      },
      {
        proxyId: 'good-1',
        totalRequests: 100,
        successfulRequests: 99,
        averageLatencyMs: 120,
        bansAssociated: 0,
        captchasAssociated: 0,
        consecutiveFailures: 0,
        status: 'ACTIVE',
      },
      {
        proxyId: 'good-2',
        totalRequests: 80,
        successfulRequests: 78,
        averageLatencyMs: 180,
        bansAssociated: 0,
        captchasAssociated: 0,
        consecutiveFailures: 0,
        status: 'ACTIVE',
      },
    ];

    const currentAssignments: ProxyAssignment[] = [
      { accountId: 'acc-1', proxyId: 'bad-1' },
      { accountId: 'acc-2', proxyId: 'good-1' },
    ];

    const rebalanceResult = scorer.rebalancePool(proxies, currentAssignments);
    expect(rebalanceResult.retiredProxyIds).toContain('bad-1');
    expect(rebalanceResult.reassigned.length).toBe(1);
    expect(rebalanceResult.reassigned[0].accountId).toBe('acc-1');
    expect(['good-1', 'good-2']).toContain(rebalanceResult.reassigned[0].newProxyId);
  });

  it('marks proxy as DEGRADED when score is moderate or failures exist', () => {
    const record: ProxyHealthRecord = {
      proxyId: 'prx-degraded',
      totalRequests: 20,
      successfulRequests: 15,
      averageLatencyMs: 800,
      bansAssociated: 0,
      captchasAssociated: 0,
      consecutiveFailures: 2,
      status: 'ACTIVE',
    };

    const evaluation = scorer.evaluateProxy(record);
    expect(evaluation.status).toBe('DEGRADED');
    expect(evaluation.isHealthy).toBe(false);
    expect(evaluation.recommendRetirement).toBe(false);
  });

  it('handles empty healthy pool gracefully during rebalance', () => {
    const proxies: ProxyHealthRecord[] = [
      {
        proxyId: 'bad-only',
        totalRequests: 10,
        successfulRequests: 1,
        averageLatencyMs: 4000,
        bansAssociated: 3,
        captchasAssociated: 2,
        consecutiveFailures: 10,
        status: 'ACTIVE',
      },
    ];
    const assignments: ProxyAssignment[] = [{ accountId: 'acc-1', proxyId: 'bad-only' }];
    const res = scorer.rebalancePool(proxies, assignments);
    expect(res.activePoolCount).toBe(0);
    expect(res.reassigned).toEqual([]);
    expect(res.retiredProxyIds).toEqual(['bad-only']);
  });
});
