import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsRegistry } from '../metrics';

describe('MetricsRegistry', () => {
  let metrics: MetricsRegistry;

  beforeEach(() => {
    metrics = new MetricsRegistry();
  });

  it('increments counters with labels', () => {
    metrics.incrementCounter('tikbot_actions_total', 1, { action: 'LIKE', status: 'SUCCESS' });
    metrics.incrementCounter('tikbot_actions_total', 2, { action: 'LIKE', status: 'SUCCESS' });
    metrics.incrementCounter('tikbot_actions_total', 1, { action: 'COMMENT', status: 'FAILED' });

    expect(metrics.getCounter('tikbot_actions_total', { action: 'LIKE', status: 'SUCCESS' })).toBe(3);
    expect(metrics.getCounter('tikbot_actions_total', { action: 'COMMENT', status: 'FAILED' })).toBe(1);
  });

  it('updates gauges and calculates ban rate percentage', () => {
    metrics.setGauge('tikbot_accounts_active', 45);
    metrics.setGauge('tikbot_accounts_banned', 5);
    metrics.setGauge('tikbot_queue_depth', 12);

    expect(metrics.getGauge('tikbot_accounts_active')).toBe(45);
    expect(metrics.getGauge('tikbot_queue_depth')).toBe(12);

    const banRate = metrics.calculateBanRate();
    // 5 / (45 + 5) = 10%
    expect(banRate).toBe(10);
  });

  it('renders metrics in standard Prometheus exposition format', () => {
    metrics.incrementCounter('tikbot_tasks_total', 5, { status: 'COMPLETED' });
    metrics.setGauge('tikbot_queue_depth', 7);

    const rendered = metrics.exportPrometheusMetrics();
    expect(rendered).toContain('tikbot_tasks_total{status="COMPLETED"} 5');
    expect(rendered).toContain('tikbot_queue_depth 7');
  });
});
