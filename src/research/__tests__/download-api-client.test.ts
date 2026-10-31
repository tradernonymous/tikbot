import { describe, it, expect, vi } from 'vitest';
import {
  DouyinTikTokClient,
  type VideoExtractionResponse,
} from '../download-api-client';

describe('Douyin / TikTok Download API Client', () => {
  it('extracts metadata and clean video stream from successful response', async () => {
    const mockApiResponse: VideoExtractionResponse = {
      status: 'success',
      data: {
        platform: 'tiktok',
        id: '71829102918',
        desc: 'Testing video caption #growth',
        video: {
          play_addr: {
            url_list: ['https://cdn.tiktok.com/clean_video.mp4'],
          },
          cover: {
            url_list: ['https://cdn.tiktok.com/cover.jpg'],
          },
        },
        author: {
          id: 'author-999',
          unique_id: 'tiktok_star',
          nickname: 'TikTok Star Official',
        },
        statistics: {
          play_count: 50000,
          digg_count: 8500,
          comment_count: 420,
          share_count: 120,
        },
      },
    };

    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const client = new DouyinTikTokClient({
      apiBaseUrl: 'http://self-hosted-api.local',
      fetcher: mockFetcher,
    });

    const result = await client.extractVideoData('https://www.tiktok.com/@tiktok_star/video/71829102918');

    expect(result.platform).toBe('TIKTOK');
    expect(result.postId).toBe('71829102918');
    expect(result.author.handle).toBe('tiktok_star');
    expect(result.playUrl).toBe('https://cdn.tiktok.com/clean_video.mp4');
    expect(result.stats.views).toBe(50000);
    expect(result.stats.likes).toBe(8500);
  });

  it('throws descriptive error when API returns error status', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Video Not Found',
    });

    const client = new DouyinTikTokClient({
      apiBaseUrl: 'http://self-hosted-api.local',
      fetcher: mockFetcher,
    });

    await expect(
      client.extractVideoData('https://www.tiktok.com/@user/video/999999')
    ).rejects.toThrow(/Video Not Found/);
  });

  it('throws when payload has failed status', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'failed', message: 'Rate limit exceeded on provider' }),
    });

    const client = new DouyinTikTokClient({
      fetcher: mockFetcher,
    });

    await expect(
      client.extractVideoData('https://www.tiktok.com/@user/video/123456')
    ).rejects.toThrow(/Rate limit exceeded/);
  });
});
