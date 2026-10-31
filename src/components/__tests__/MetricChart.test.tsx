import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MetricChart, MetricDataPoint } from '../MetricChart';

describe('MetricChart Component (U4.8)', () => {
  const sampleSeries: MetricDataPoint[] = [
    { timestamp: '2026-10-01T00:00:00.000Z', value: 1200, label: 'Oct 1' },
    { timestamp: '2026-10-02T00:00:00.000Z', value: 1850, label: 'Oct 2' },
    { timestamp: '2026-10-03T00:00:00.000Z', value: 3400, label: 'Oct 3' },
  ];

  it('renders series with provenance chip and accessible region', () => {
    const html = renderToString(
      <MetricChart
        title="Video View Velocity"
        series={sampleSeries}
        provenance="live"
        valueFormatter={(v) => `${v.toLocaleString()} views`}
      />
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Video View Velocity"');
    expect(html).toContain('Live');
    expect(html).toContain('Oct 1');
    expect(html).toContain('3,400 views');
  });

  it('does not fabricate data in production when series is empty', () => {
    const html = renderToString(
      <MetricChart
        title="Empty Metric"
        series={[]}
        provenance="unknown"
      />
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('Unknown');
    expect(html).toContain('No metric series available');
  });
});
