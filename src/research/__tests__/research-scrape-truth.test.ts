import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeJobHandler, registerDefaultJobHandlers, setDouyinTikTokClient } from '../../worker';
import { DouyinTikTokClient } from '../download-api-client';

describe('R0.3 Truth Pass — Research Scrape Real Data Delegation', () => {
  beforeEach(() => {
    registerDefaultJobHandlers();
  });

  it('delegates research.scrape to DouyinTikTokClient and returns real scraped metrics on success', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          id: '7123456789012345678',
          desc: 'Viral productivity hacks #growth',
          statistics: {
            play_count: 854200,
            digg_count: 142300,
            comment_count: 3240,
            share_count: 12500,
          },
          author: {
            id: 'author_123',
            unique_id: 'topcreator',
            nickname: 'Top Creator',
          },
        },
      }),
    });

    const client = new DouyinTikTokClient({ fetcher: mockFetcher as any });
    setDouyinTikTokClient(client);

    const result = (await executeJobHandler('research.scrape', {
      target: 'https://www.tiktok.com/@topcreator/video/7123456789012345678',
    })) as any;

    expect(result.success).toBe(true);
    expect(result.postId).toBe('7123456789012345678');
    expect(result.metrics.views).toBe(854200);
    expect(result.metrics.likes).toBe(142300);
    expect(result.metrics.comments).toBe(3240);
    expect(result.metrics.shares).toBe(12500);
    expect(result.author.handle).toBe('topcreator');
  });

  it('throws when the underlying DouyinTikTokClient fails or returns an error', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const client = new DouyinTikTokClient({ fetcher: mockFetcher as any });
    setDouyinTikTokClient(client);

    await expect(
      executeJobHandler('research.scrape', {
        target: 'https://www.tiktok.com/@ghost/video/9999999999999999999',
      })
    ).rejects.toThrow(/Failed to fetch video data from Download API: 404/);
  });

  it('throws when research.scrape is called without target', async () => {
    await expect(executeJobHandler('research.scrape', {})).rejects.toThrow(
      'research.scrape requires target'
    );
  });
});
