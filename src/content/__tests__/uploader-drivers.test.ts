import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  OfficialDriver,
  BrowserDriver,
  MockDriver,
} from '../drivers';
import { ContentPublisher } from '../publisher';

describe('Publish Uploader Drivers (R3.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OfficialDriver (TikTok Content Posting API)', () => {
    it('queries creator info, inits post, and polls status, marking unaudited app as SELF_ONLY', async () => {
      const mockFetch = vi.fn();
      // 1. Creator info query -> unaudited / restricted
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            creator_avatar_url: 'https://example.com/avatar.jpg',
            creator_username: 'official_creator',
            creator_nickname: 'Creator',
            privacy_level_options: ['SELF_ONLY'], // unaudited app restricted to private
          },
          error: { code: 'ok', message: '' },
        }),
      });

      // 2. Video publish init -> returns publish_id
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            publish_id: 'pub_official_12345',
            upload_url: 'https://open-upload.tiktok.com/video',
          },
          error: { code: 'ok', message: '' },
        }),
      });

      // 3. Status poll -> status fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            status: 'PUBLISH_COMPLETE',
            fail_reason: '',
            publicaly_available_post_id: ['v_7891011'],
          },
          error: { code: 'ok', message: '' },
        }),
      });

      const driver = new OfficialDriver({
        accessToken: 'act_token_valid_123',
        fetchClient: mockFetch,
      });

      const publisher = new ContentPublisher({ uploaderDriver: driver.upload });
      const result = await publisher.publishVideo({
        accountId: 'acc-official',
        mediaPath: 'https://storage.railway.app/media/vid.mp4',
        caption: 'Test official publish #fyp',
        hasValidSession: true,
      });

      expect(result.success).toBe(true);
      expect(result.publishId).toBe('pub_official_12345');
      expect(result.driverType).toBe('OFFICIAL');
      expect(result.privacyLevel).toBe('SELF_ONLY');
      expect(result.publishedVideoId).toBe('v_7891011');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('throws error when TikTok API returns non-ok response', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const driver = new OfficialDriver({
        accessToken: 'expired_token',
        fetchClient: mockFetch,
      });

      const publisher = new ContentPublisher({ uploaderDriver: driver.upload });
      await expect(
        publisher.publishVideo({
          accountId: 'acc-official',
          mediaPath: 'https://storage.railway.app/media/vid.mp4',
          caption: 'Fail publish',
          hasValidSession: true,
        })
      ).rejects.toThrow(/TikTok API error/i);
    });
  });

  describe('BrowserDriver (Session Vault / Studio)', () => {
    it('uses session vault cookies to upload via browser', async () => {
      const mockBrowserSession = vi.fn().mockResolvedValue({
        publishedVideoId: 'v_browser_999',
        url: 'https://tiktok.com/@creator/video/v_browser_999',
      });

      const driver = new BrowserDriver({
        browserSessionRunner: mockBrowserSession,
      });

      const publisher = new ContentPublisher({ uploaderDriver: driver.upload });
      const result = await publisher.publishVideo({
        accountId: 'acc-browser-1',
        mediaPath: '/tmp/render.mp4',
        caption: 'Uploaded via browser',
        hasValidSession: true,
      });

      expect(result.success).toBe(true);
      expect(result.publishedVideoId).toBe('v_browser_999');
      expect(result.driverType).toBe('BROWSER');
      expect(mockBrowserSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('MockDriver (Dev-only guard)', () => {
    it('returns mocked publish result in dev/test environment', async () => {
      const driver = new MockDriver();
      const publisher = new ContentPublisher({ uploaderDriver: driver.upload });

      const result = await publisher.publishVideo({
        accountId: 'acc-mock',
        mediaPath: 'https://test.com/vid.mp4',
        caption: 'Mock dev test',
        hasValidSession: true,
      });

      expect(result.success).toBe(true);
      expect(result.driverType).toBe('MOCK');
      expect(result.publishedVideoId).toMatch(/^mock_vid_/);
    });

    it('throws when NODE_ENV is production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      try {
        const driver = new MockDriver();
        const publisher = new ContentPublisher({ uploaderDriver: driver.upload });

        await expect(
          publisher.publishVideo({
            accountId: 'acc-mock',
            mediaPath: 'https://test.com/vid.mp4',
            caption: 'Prod attempt with mock',
            hasValidSession: true,
          })
        ).rejects.toThrow(/MockDriver is strictly prohibited in production/i);
      } finally {
        vi.unstubAllEnvs();
      }
    });
  });
});
