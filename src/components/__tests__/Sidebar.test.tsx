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
});
