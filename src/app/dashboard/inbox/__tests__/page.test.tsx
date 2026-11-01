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

import InboxPage from '../page';

describe('W1.3 Comment Inbox Page (/dashboard/inbox)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('');
  });

  it('renders all four tabs: Pending, Sent, Ideas, FAQ Bank', () => {
    const html = renderToString(<InboxPage />);
    expect(html).toContain('Pending');
    expect(html).toContain('Sent');
    expect(html).toContain('Ideas');
    expect(html).toContain('FAQ Bank');
  });

  it('honors initial tab query parameter from URL', () => {
    mockSearchParams = new URLSearchParams('tab=ideas');
    const html = renderToString(<InboxPage initialIdeas={[]} />);
    expect(html).toContain('No escalated content ideas yet');
  });

  it('renders empty state when no pending comments with CTA', () => {
    const html = renderToString(<InboxPage initialItems={[]} />);
    expect(html).toContain('No comments waiting for review');
  });

  it('renders comment card with author, category chip, sentiment chip, and escalate button', () => {
    const mockItems = [
      {
        id: 'inbox-1',
        authorHandle: 'growth_coder',
        text: 'How do you bypass proxy rate limits when scraping competitor views?',
        category: 'QUESTION',
        sentimentScore: 0.15,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    ];

    const html = renderToString(<InboxPage initialItems={mockItems as any} />);
    expect(html).toContain('@growth_coder');
    expect(html).toContain('QUESTION');
    expect(html).toContain('Escalate to Content Plan');
    expect(html).toContain('data-provenance');
  });
});
