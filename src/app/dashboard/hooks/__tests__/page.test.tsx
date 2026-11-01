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

import HooksPage from '../page';

describe('W1.2 Hook Lab Page (/dashboard/hooks)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('');
  });

  it('renders all three tabs: Library, Variants, A/B Tests', () => {
    const html = renderToString(<HooksPage />);
    expect(html).toContain('Library');
    expect(html).toContain('Variants');
    expect(html).toContain('A/B Tests');
  });

  it('honors initial tab query parameter from URL', () => {
    mockSearchParams = new URLSearchParams('tab=variants');
    const html = renderToString(<HooksPage />);
    expect(html).toContain('Generate Variants');
  });

  it('renders empty state when no hooks in library with CTA', () => {
    const html = renderToString(<HooksPage initialHooks={[]} />);
    expect(html).toContain('No hook patterns found');
  });

  it('renders hook cards with pattern tag, retention proxy, and usage count', () => {
    const mockHooks = [
      {
        id: 'h-1',
        pattern: 'CONTRARIAN',
        textTemplate: 'Stop doing {activity} until you watch this video.',
        retentionProxyScore: 88.2,
        usageCount: 24,
        createdAt: new Date().toISOString(),
      },
    ];

    const html = renderToString(<HooksPage initialHooks={mockHooks as any} />);
    expect(html).toContain('CONTRARIAN');
    expect(html).toContain('Stop doing {activity}');
    expect(html).toContain('24 posts');
    expect(html).toContain('data-provenance');
  });
});
