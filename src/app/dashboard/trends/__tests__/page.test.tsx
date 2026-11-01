import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

let mockSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/context/OperationsContext', () => ({
  useOperations: () => ({
    accounts: [],
    campaigns: [],
    farmTasks: [],
    publishJobs: [],
  }),
}));

import TrendsPage from '../page';

describe('W1.1 Trends Page (/dashboard/trends)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('');
  });

  it('renders all four tabs: Hashtags, Sounds, Rising, Map', () => {
    const html = renderToString(<TrendsPage />);
    expect(html).toContain('Hashtags');
    expect(html).toContain('Sounds');
    expect(html).toContain('Rising');
    expect(html).toContain('Map');
  });

  it('honors initial tab query parameter from URL', () => {
    mockSearchParams = new URLSearchParams('tab=sounds');
    const mockTrends = [
      {
        id: 's-1',
        type: 'SOUND',
        signalKey: 'sound-retro',
        score: 80,
        velocity: 15,
        sampleSize: 40,
        region: 'US',
        lifecyclePhase: 'RISING',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
    ];
    const html = renderToString(<TrendsPage initialTrends={mockTrends as any} />);
    expect(html).toContain('Lifecycle');
    expect(html).toContain('RISING');
  });

  it('renders empty state when no trends exist with CTA', () => {
    const html = renderToString(<TrendsPage initialTrends={[]} />);
    expect(html).toContain('No trend signals found');
  });

  it('renders table rows with provenance chip and Use in Composer link', () => {
    const mockTrends = [
      {
        id: 't-1',
        type: 'HASHTAG',
        signalKey: 'growthhack',
        score: 88,
        velocity: 25,
        sampleSize: 120,
        region: 'US',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: 't-2',
        type: 'SOUND',
        signalKey: 'viral-beat',
        score: 95,
        velocity: 42,
        sampleSize: 350,
        region: 'US',
        lifecyclePhase: 'RISING',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
    ];

    const html = renderToString(<TrendsPage initialTrends={mockTrends as any} />);
    expect(html).toContain('#growthhack');
    expect(html).toContain('Use in Composer');
    expect(html).toContain('data-provenance');
  });
});
