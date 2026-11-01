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
    accounts: [{ id: 'acc-1', username: 'tiktok_main' }],
    campaigns: [],
    farmTasks: [],
    publishJobs: [],
  }),
}));

import CalendarPage from '../page';

describe('W1.8 Calendar Page (/dashboard/calendar)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('');
  });

  it('renders Month, Week, and Day view toggles', () => {
    const html = renderToString(<CalendarPage />);
    expect(html).toContain('Month');
    expect(html).toContain('Week');
    expect(html).toContain('Day');
    expect(html).toContain('Publishing Calendar');
  });

  it('honors view query parameter from URL', () => {
    mockSearchParams = new URLSearchParams('view=day');
    const html = renderToString(<CalendarPage />);
    expect(html).toContain('Day View');
  });

  it('renders recurring queue slots and best-time heatmap overlay', () => {
    const html = renderToString(<CalendarPage />);
    expect(html).toContain('Morning FYP Boost');
    expect(html).toContain('Peak FYP Velocity');
    expect(html).toContain('data-provenance');
  });

  it('renders empty state when no scheduled jobs match with CTA', () => {
    const html = renderToString(<CalendarPage initialJobs={[]} />);
    expect(html).toContain('No publishing jobs scheduled');
  });

  it('renders conflict warning banner when scheduling overlaps detected', () => {
    const mockConflicts = [
      {
        jobAId: 'j-1',
        jobBId: 'j-2',
        accountUsername: 'tiktok_main',
        message: 'Publishing conflict: 2 videos scheduled 15 mins apart for @tiktok_main',
      },
    ];

    const html = renderToString(<CalendarPage initialConflicts={mockConflicts} />);
    expect(html).toContain('Publishing conflict');
    expect(html).toContain('@tiktok_main');
  });
});
