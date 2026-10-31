import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import ResearchPage from '@/app/dashboard/research/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams('tab=voc&multiplier=3'),
}));

vi.mock('@/context/OperationsContext', () => ({
  useOperations: () => ({
    researchedPosts: [
      {
        id: 'post-1',
        platformPostId: '721839210',
        authorHandle: 'viral_creator',
        caption: 'How to scale to 10k views',
        viewCount: 150000,
        likeCount: 30000,
        commentCount: 400,
        outlierScore: 4.5,
        hookText: 'Stop making this mistake',
        hookType: 'CONTRARIAN',
      },
    ],
    addResearchedPost: vi.fn(),
  }),
}));

describe('F1.10 & F1.11 Research URL State and Cross-Entity Campaign Wiring', () => {
  it('renders VOC tab when URL searchParams has ?tab=voc', () => {
    const html = renderToString(<ResearchPage />);
    expect(html).toContain('Voice of Customer (VOC) Comment Intelligence');
  });

  it('renders "Run Campaign" prefilled cross-entity action for outlier post', () => {
    const html = renderToString(<ResearchPage />);
    expect(html).toContain('Run Campaign');
    expect(html).toContain('/dashboard/campaigns?targetUrl=');
  });
});
