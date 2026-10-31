import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StatCard } from '../StatCard';

describe('StatCard Component (U7, U8 TDD)', () => {
  it('renders title and numerical value', () => {
    const html = renderToString(<StatCard title="Total Accounts" value={42} />);
    expect(html).toContain('Total Accounts');
    expect(html).toContain('42');
  });

  it('renders em-dash when value is null or undefined (U7 honest unknown)', () => {
    const html = renderToString(<StatCard title="Estimated Reach" value={null} />);
    expect(html).toContain('—');
  });

  it('renders provenance badge when specified (U8)', () => {
    const htmlLive = renderToString(<StatCard title="Live Views" value="1.2M" provenance="live" />);
    expect(htmlLive).toContain('LIVE');

    const htmlCached = renderToString(<StatCard title="Cached Outliers" value="10" provenance="cached" />);
    expect(htmlCached).toContain('CACHED');

    const htmlSim = renderToString(<StatCard title="Simulated Tasks" value="0" provenance="simulated" />);
    expect(htmlSim).toContain('SIMULATED');
  });
});
