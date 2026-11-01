import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Sidebar } from '../Sidebar';

// Mock operations context
vi.mock('@/context/OperationsContext', () => ({
  useOperations: () => ({
    campaigns: [],
    farmTasks: [],
    publishJobs: [],
    accounts: [],
    researchedPosts: [],
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('F1.8 Server-Backed Sidebar Badges', () => {
  it('renders sidebar navigation items correctly with server counts', () => {
    const counts = {
      total: 5,
      approvals: 2,
      incidents: 1,
      research: 2,
      system: 0,
    };

    const html = renderToString(<Sidebar serverCounts={counts} />);

    expect(html).toContain('Overview');
    expect(html).toContain('2 pending'); // Campaigns approvals badge
    expect(html).toContain('1 alerts');  // Incidents compliance badge
  });

  it('omits approval badge when server approval count is 0', () => {
    const counts = {
      total: 0,
      approvals: 0,
      incidents: 0,
      research: 0,
      system: 0,
    };

    const html = renderToString(<Sidebar serverCounts={counts} />);

    expect(html).not.toContain('pending');
    expect(html).toContain('Strict'); // Default compliance badge
  });

  it('W1.11 renders restructured navigation groups (Operate, Intelligence, Content, System)', () => {
    const counts = {
      total: 0,
      approvals: 0,
      incidents: 0,
      research: 0,
      system: 0,
    };

    const html = renderToString(<Sidebar serverCounts={counts} />);

    // Check group headers
    expect(html).toContain('Operate');
    expect(html).toContain('Intelligence');
    expect(html).toContain('Content');
    expect(html).toContain('System');

    // Check intelligence module links
    expect(html).toContain('href="/dashboard/trends"');
    expect(html).toContain('href="/dashboard/hooks"');
    expect(html).toContain('href="/dashboard/competitors"');
    expect(html).toContain('href="/dashboard/creators"');
    expect(html).toContain('href="/dashboard/live"');

    // Check content module links
    expect(html).toContain('href="/dashboard/calendar"');
    expect(html).toContain('href="/dashboard/composer"');
    expect(html).toContain('href="/dashboard/media"');
    expect(html).toContain('href="/dashboard/inbox"');

    // Check system reports link
    expect(html).toContain('href="/dashboard/reports"');
  });
});
