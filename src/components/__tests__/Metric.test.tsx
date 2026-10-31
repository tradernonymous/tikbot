import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Metric } from '../Metric';

describe('Metric Component (U0.5)', () => {
  it('renders value and label correctly with live provenance', () => {
    const html = renderToString(<Metric label="Farm Nodes" value={42} provenance="live" />);
    expect(html).toContain('Farm Nodes');
    expect(html).toContain('42');
    expect(html).toContain('LIVE');
    expect(html).toContain('data-provenance="live"');
  });

  it('renders cached provenance chip correctly', () => {
    const html = renderToString(<Metric label="Daily Views" value="1.2M" provenance="cached" />);
    expect(html).toContain('Daily Views');
    expect(html).toContain('1.2M');
    expect(html).toContain('CACHED');
    expect(html).toContain('data-provenance="cached"');
  });

  it('renders unknown provenance chip and fallback dash when value is missing', () => {
    const html = renderToString(<Metric label="Ban Challenge Rate" value={null} provenance="unknown" />);
    expect(html).toContain('Ban Challenge Rate');
    expect(html).toContain('—');
    expect(html).toContain('UNKNOWN');
    expect(html).toContain('data-provenance="unknown"');
  });

  it('renders unit and subtext when provided', () => {
    const html = renderToString(
      <Metric
        label="Success Rate"
        value={98.5}
        unit="%"
        subtext="Aggregated over 24h"
        provenance="live"
      />
    );
    expect(html).toContain('98.5');
    expect(html).toContain('%');
    expect(html).toContain('Aggregated over 24h');
  });
});
