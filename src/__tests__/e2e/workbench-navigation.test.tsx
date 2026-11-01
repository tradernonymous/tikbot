import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

let mockSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/dashboard',
}));

vi.mock('@/context/OperationsContext', () => ({
  useOperations: () => ({
    accounts: [],
    campaigns: [],
    farmTasks: [],
    publishJobs: [],
    researchedPosts: [],
  }),
}));

import { Sidebar } from '@/components/Sidebar';
import TrendsPage from '@/app/dashboard/trends/page';
import HooksPage from '@/app/dashboard/hooks/page';
import InboxPage from '@/app/dashboard/inbox/page';
import CompetitorsPage from '@/app/dashboard/competitors/page';
import CreatorsPage from '@/app/dashboard/creators/page';
import ReportsPage from '@/app/dashboard/reports/page';
import MediaPage from '@/app/dashboard/media/page';
import CalendarPage from '@/app/dashboard/calendar/page';
import ComposerPage from '@/app/dashboard/composer/page';
import LivePage from '@/app/dashboard/live/page';

describe('W1.12 URL State & Workbench Direct Navigation Audit', () => {
  it('Sidebar renders 1-click direct links to all 10 new workbench modules', () => {
    const html = renderToString(<Sidebar />);

    const expectedPaths = [
      '/dashboard/trends',
      '/dashboard/hooks',
      '/dashboard/competitors',
      '/dashboard/creators',
      '/dashboard/live',
      '/dashboard/calendar',
      '/dashboard/composer',
      '/dashboard/media',
      '/dashboard/inbox',
      '/dashboard/reports',
    ];

    for (const path of expectedPaths) {
      expect(html).toContain(`href="${path}"`);
    }
  });

  it('Trends: direct URL tab=sounds and region=UK retains parameters in initial render', () => {
    mockSearchParams = new URLSearchParams('tab=sounds&region=UK');
    const mockTrends = [
      {
        id: 's-1',
        type: 'SOUND',
        signalKey: 'uk-sound-viral',
        score: 87,
        velocity: 22,
        sampleSize: 15,
        region: 'UK',
        lifecyclePhase: 'RISING',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
    ];
    const html = renderToString(<TrendsPage initialTrends={mockTrends as any} />);
    expect(html).toContain('Lifecycle');
    expect(html).toContain('uk-sound-viral');
  });

  it('Hook Lab: direct URL tab=ab_tests opens AB Evaluator tab', () => {
    mockSearchParams = new URLSearchParams('tab=ab_tests');
    const html = renderToString(<HooksPage />);
    expect(html).toContain('Statistical A/B Hook Significance Evaluator');
  });

  it('Comment Inbox: direct URL tab=sent opens sent history tab', () => {
    mockSearchParams = new URLSearchParams('tab=sent');
    const html = renderToString(<InboxPage initialItems={[]} />);
    expect(html).toContain('No sent replies found');
  });

  it('Competitors: direct URL tab=outliers opens Outlier Feed', () => {
    mockSearchParams = new URLSearchParams('tab=outliers');
    const html = renderToString(<CompetitorsPage initialOutliers={[]} />);
    expect(html).toContain('No competitor outliers found');
  });

  it('Creators CRM: direct URL stage=live filters to active live partnerships', () => {
    mockSearchParams = new URLSearchParams('stage=live');
    const mockCreators = [
      {
        id: 'c-live',
        handle: 'verified_partner',
        platform: 'TIKTOK',
        followerCount: 500000,
        medianViews: 120000,
        stage: 'LIVE',
        vettingScore: 94,
        fitTier: 'HIGH',
      },
    ];
    const html = renderToString(<CreatorsPage initialCreators={mockCreators as any} />);
    expect(html).toContain('@verified_partner');
  });

  it('Reports: direct URL timeframe=7 configures 7-day view', () => {
    mockSearchParams = new URLSearchParams('timeframe=7');
    const html = renderToString(<ReportsPage />);
    expect(html).toContain('7-Day Telemetry Report');
  });

  it('Media Library: direct URL view=list configures list view', () => {
    mockSearchParams = new URLSearchParams('view=list');
    const html = renderToString(<MediaPage initialAssets={[]} />);
    expect(html).toContain('List View');
  });

  it('Calendar: direct URL view=month configures monthly schedule view', () => {
    mockSearchParams = new URLSearchParams('view=month');
    const html = renderToString(<CalendarPage initialJobs={[]} />);
    expect(html).toContain('Month');
  });

  it('Composer: direct URL pre-fills hook and platform params', () => {
    mockSearchParams = new URLSearchParams('platform=instagram_reels&hook=Why%2099%25%20Fail');
    const html = renderToString(<ComposerPage />);
    expect(html).toContain('Why 99% Fail');
  });

  it('Live Intel: direct URL pre-fills target input', () => {
    mockSearchParams = new URLSearchParams('target=streamer_live_77');
    const html = renderToString(<LivePage initialConnected={false} />);
    expect(html).toContain('streamer_live_77');
  });
});
