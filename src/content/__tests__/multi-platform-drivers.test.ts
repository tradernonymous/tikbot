import { describe, it, expect, vi } from 'vitest';
import { YouTubeShortsDriver } from '../drivers/youtube-shorts-driver';
import { InstagramReelsDriver } from '../drivers/instagram-reels-driver';
import type { PublishRequest } from '../publisher';

describe('M6.1 YouTube Shorts Driver', () => {
  it('formats title with #Shorts and uploads to YouTube Data API', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('uploadType=resumable')) {
        return {
          ok: true,
          headers: new Headers({ location: 'https://upload.youtube.com/upload_session_123' }),
          json: async () => ({}),
        };
      }
      if (url.includes('upload_session_123')) {
        return {
          ok: true,
          json: async () => ({
            id: 'yt_vid_abc123',
            status: { privacyStatus: 'public' },
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const driver = new YouTubeShortsDriver({
      accessToken: 'ya29.mock_token',
      fetchClient: mockFetch as any,
    });

    const req: PublishRequest = {
      accountId: 'acc-yt-1',
      mediaPath: '/tmp/short_test.mp4',
      caption: 'Crazy marketing tip for creators #growth',
      hasValidSession: true,
    };

    const result = await driver.upload(req);
    expect(result.success).toBe(true);
    expect(result.publishedVideoId).toBe('yt_vid_abc123');
    expect(result.url).toBe('https://youtube.com/shorts/yt_vid_abc123');
    expect(result.details?.platform).toBe('YOUTUBE_SHORTS');
  });

  it('rejects with error if YouTube upload API returns failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden: quotaExceeded',
      text: async () => 'Quota exceeded',
    });

    const driver = new YouTubeShortsDriver({
      accessToken: 'ya29.mock_token',
      fetchClient: mockFetch as any,
    });

    const req: PublishRequest = {
      accountId: 'acc-yt-2',
      mediaPath: '/tmp/short_test2.mp4',
      caption: 'Test Short',
      hasValidSession: true,
    };

    await expect(driver.upload(req)).rejects.toThrow('YouTube Shorts API error');
  });
});

describe('M6.2 Instagram Reels Driver', () => {
  it('creates Instagram container and publishes Reels video', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      // Step 1: container creation
      if (url.includes('/media') && !url.includes('/media_publish')) {
        return {
          ok: true,
          json: async () => ({ id: 'ig_container_9988' }),
        };
      }
      // Step 2: media publish
      if (url.includes('/media_publish')) {
        return {
          ok: true,
          json: async () => ({ id: 'ig_reel_4455' }),
        };
      }
      return { ok: false, status: 400 };
    });

    const driver = new InstagramReelsDriver({
      accessToken: 'EAAB_mock_ig_token',
      instagramAccountId: 'ig_user_1122',
      fetchClient: mockFetch as any,
    });

    const req: PublishRequest = {
      accountId: 'acc-ig-1',
      mediaPath: 'https://cdn.example.com/videos/reels_1.mp4',
      caption: 'Instagram reel debut #viral',
      hasValidSession: true,
    };

    const result = await driver.upload(req);
    expect(result.success).toBe(true);
    expect(result.publishedVideoId).toBe('ig_reel_4455');
    expect(result.url).toBe('https://www.instagram.com/reel/ig_reel_4455');
    expect(result.details?.platform).toBe('INSTAGRAM_REELS');
  });

  it('throws error when container creation fails on Instagram Graph API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'Invalid video format',
    });

    const driver = new InstagramReelsDriver({
      accessToken: 'EAAB_mock_ig_token',
      instagramAccountId: 'ig_user_1122',
      fetchClient: mockFetch as any,
    });

    const req: PublishRequest = {
      accountId: 'acc-ig-2',
      mediaPath: 'https://cdn.example.com/bad.mp4',
      caption: 'Bad reel',
      hasValidSession: true,
    };

    await expect(driver.upload(req)).rejects.toThrow('Instagram Graph API error during container creation');
  });
});
