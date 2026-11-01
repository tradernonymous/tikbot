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

import CompetitorsPage from '../page';

describe('W1.4 Competitors Page (/dashboard/competitors)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('');
  });

  it('renders all three tabs: Watchlist, Outliers, Why It Worked', () => {
    const html = renderToString(<CompetitorsPage />);
    expect(html).toContain('Watchlist');
    expect(html).toContain('Outlier Feed');
    expect(html).toContain('Why It Worked');
  });

  it('honors initial tab query parameter from URL', () => {
    mockSearchParams = new URLSearchParams('tab=outliers');
    const html = renderToString(<CompetitorsPage initialOutliers={[]} />);
    expect(html).toContain('No competitor outliers found');
  });

  it('renders empty state when no competitors on watchlist with CTA', () => {
    const html = renderToString(<CompetitorsPage initialTargets={[]} />);
    expect(html).toContain('No competitors being tracked');
  });

  it('renders competitor targets with handle, baseline, and outlier feed linkage', () => {
    const mockTargets = [
      {
        id: 't-1',
        targetHandle: 'rival_brand',
        platform: 'TIKTOK',
        creator: {
          followerCount: 150000,
          medianViews: 32000,
          videoCount: 45,
        },
      },
    ];

    const html = renderToString(<CompetitorsPage initialTargets={mockTargets as any} />);
    expect(html).toContain('@rival_brand');
    expect(html).toContain('32,000 views');
    expect(html).toContain('View Outliers');
    expect(html).toContain('data-provenance');
  });
});
