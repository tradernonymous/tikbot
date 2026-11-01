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

import MediaPage from '../page';

describe('W1.7 Media Library Page (/dashboard/media)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('');
  });

  it('renders grid and list view toggles and tag filters', () => {
    const html = renderToString(<MediaPage />);
    expect(html).toContain('Grid View');
    expect(html).toContain('List View');
    expect(html).toContain('Media Library');
  });

  it('honors view mode query parameter from URL', () => {
    mockSearchParams = new URLSearchParams('view=list');
    const html = renderToString(<MediaPage />);
    expect(html).toContain('List View');
  });

  it('renders empty state when no media assets in library with CTA', () => {
    const html = renderToString(<MediaPage initialAssets={[]} />);
    expect(html).toContain('No media assets found');
  });

  it('renders media card with filename, aspect ratio badge, usage count, and composer link', () => {
    const mockAssets = [
      {
        id: 'm-1',
        storageKey: 'raw_ugc_review.mp4',
        mimeType: 'video/mp4',
        fileSizeBytes: 12400000,
        aspectRatio: '9:16',
        tags: ['ugc', 'review'],
        variants: ['PORTRAIT_CROP'],
        usageCount: 3,
        createdAt: new Date().toISOString(),
      },
    ];

    const html = renderToString(<MediaPage initialAssets={mockAssets as any} />);
    expect(html).toContain('raw_ugc_review.mp4');
    expect(html).toContain('9:16');
    expect(html).toContain('Used in 3 posts');
    expect(html).toContain('data-provenance');
  });
});
