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

import CreatorsPage from '../page';

describe('W1.5 Creators CRM Page (/dashboard/creators)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('');
  });

  it('renders all 5 Kanban pipeline stages: Prospect, Contacted, Negotiating, Live, Dead', () => {
    const html = renderToString(<CreatorsPage />);
    expect(html).toContain('Prospect');
    expect(html).toContain('Contacted');
    expect(html).toContain('Negotiating');
    expect(html).toContain('Live');
    expect(html).toContain('Dead');
  });

  it('honors initial stage filter query parameter from URL', () => {
    mockSearchParams = new URLSearchParams('stage=live');
    const html = renderToString(<CreatorsPage />);
    expect(html).toContain('Live');
  });

  it('renders empty state when no creators in CRM with CTA', () => {
    const html = renderToString(<CreatorsPage initialCreators={[]} />);
    expect(html).toContain('No creators in CRM pipeline');
  });

  it('renders creator card with handle, vetting score, and seeded content metrics', () => {
    const mockCreators = [
      {
        id: 'c-1',
        handle: 'creator_top',
        platform: 'TIKTOK',
        followerCount: 220000,
        medianViews: 55000,
        stage: 'LIVE',
        vettingScore: 89,
        fitTier: 'HIGH',
        seededPostsCount: 4,
        estimatedRoi: '4.2x',
      },
    ];

    const html = renderToString(<CreatorsPage initialCreators={mockCreators as any} />);
    expect(html).toContain('@creator_top');
    expect(html).toContain('89');
    expect(html).toContain('4.2x');
    expect(html).toContain('data-provenance');
  });
});
