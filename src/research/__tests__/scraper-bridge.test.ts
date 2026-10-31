import { describe, it, expect, vi } from 'vitest';
import {
  TiktokScraperBridge,
  type ScraperOptions,
} from '../scraper-bridge';

describe('Tiktok-Scraper Node Bridge', () => {
  it('scrapes profile posts with proxy support and normalizes output', async () => {
    const mockFeedFn = vi.fn().mockResolvedValue([
      {
        id: '71000000001',
        text: 'Top 3 marketing secrets for organic reach #marketing',
        createTime: 1690000000,
        authorMeta: {
          name: 'marketingleader',
          nickName: 'Marketing Leader',
        },
        playCount: 250000,
        diggCount: 18000,
        commentCount: 450,
        shareCount: 920,
        videoUrl: 'https://cdn.tiktok.com/vid1.mp4',
      },
    ]);

    const bridge = new TiktokScraperBridge({
      fetcher: mockFeedFn,
    });

    const posts = await bridge.scrapeUserPosts('marketingleader', {
      number: 10,
      proxy: 'http://proxy.io:8080',
    });

    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe('71000000001');
    expect(posts[0].authorHandle).toBe('marketingleader');
    expect(posts[0].viewCount).toBe(250000);
    expect(posts[0].likeCount).toBe(18000);
  });

  it('scrapes hashtag feeds successfully', async () => {
    const mockFeedFn = vi.fn().mockResolvedValue([
      {
        id: '71000000002',
        text: 'AI automation tips #saasgrowth',
        authorMeta: { name: 'tech_founder' },
        playCount: 120000,
        diggCount: 8500,
        commentCount: 300,
        shareCount: 400,
      },
    ]);

    const bridge = new TiktokScraperBridge({ fetcher: mockFeedFn });
    const posts = await bridge.scrapeHashtag('saasgrowth', { number: 5 });

    expect(posts).toHaveLength(1);
    expect(posts[0].authorHandle).toBe('tech_founder');
  });

  it('handles scraper errors with descriptive feedback', async () => {
    const mockFeedFn = vi.fn().mockRejectedValue(new Error('Rate limit or captcha checkpoint detected'));
    const bridge = new TiktokScraperBridge({ fetcher: mockFeedFn });

    await expect(bridge.scrapeUserPosts('blocked_user')).rejects.toThrow(/Rate limit/);
  });
});
