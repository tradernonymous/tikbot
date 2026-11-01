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

import ComposerPage from '../page';

describe('W1.9 Content Composer Page (/dashboard/composer)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('');
  });

  it('renders per-platform variant tabs: TikTok, Instagram Reels, YouTube Shorts', () => {
    const html = renderToString(<ComposerPage />);
    expect(html).toContain('TikTok');
    expect(html).toContain('Instagram Reels');
    expect(html).toContain('YouTube Shorts');
    expect(html).toContain('Content Composer');
  });

  it('prefills hook text from URL search params', () => {
    mockSearchParams = new URLSearchParams('hook=Stop%20doing%20this');
    const html = renderToString(<ComposerPage />);
    expect(html).toContain('Stop doing this');
  });

  it('renders sound attachment, cover frame picker, and hashtag suggestions', () => {
    const html = renderToString(<ComposerPage />);
    expect(html).toContain('Sound Attachment');
    expect(html).toContain('Cover Frame');
    expect(html).toContain('Trending Hashtags');
    expect(html).toContain('Schedule to Queue');
    expect(html).toContain('data-provenance');
  });
});
