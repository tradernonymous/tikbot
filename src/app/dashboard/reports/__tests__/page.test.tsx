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

import ReportsPage from '../page';

describe('W1.6 Reports Page (/dashboard/reports)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('');
  });

  it('renders timeframe toggles: 7 Days, 30 Days, 90 Days', () => {
    const html = renderToString(<ReportsPage />);
    expect(html).toContain('7 Days');
    expect(html).toContain('30 Days');
    expect(html).toContain('90 Days');
  });

  it('honors timeframe query parameter from URL', () => {
    mockSearchParams = new URLSearchParams('timeframe=90');
    const html = renderToString(<ReportsPage />);
    expect(html).toContain('90-Day Telemetry Report');
  });

  it('renders report metrics with provenance chip and CSV export button', () => {
    const mockReport = {
      timeframeDays: 30,
      postCount: 15,
      totalViews: 450000,
      totalLikes: 35000,
      totalComments: 2100,
      totalShares: 850,
      averageEngagementRate: 0.084,
      posts: [],
    };

    const mockBreakdowns = {
      byHook: [
        { hookType: 'CONTRARIAN', postCount: 8, totalViews: 300000, averageEngagementRate: 0.092 },
      ],
      byLength: [],
    };

    const html = renderToString(<ReportsPage initialReport={mockReport as any} initialBreakdowns={mockBreakdowns as any} />);
    expect(html).toContain('450,000');
    expect(html).toContain('CONTRARIAN');
    expect(html).toContain('Export CSV');
    expect(html).toContain('data-provenance');
  });
});
