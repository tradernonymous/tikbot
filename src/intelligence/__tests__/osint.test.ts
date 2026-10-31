import { describe, it, expect, vi } from 'vitest';
import {
  discoverCrossPlatformHandles,
  defaultPlatformProbeFetcher,
  type PlatformProbeFetcher,
} from '../osint';

describe('Cross-Platform OSINT Username Discovery', () => {
  it('probes multiple social networks and returns matched profiles', async () => {
    const mockFetcher: PlatformProbeFetcher = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('tiktok.com/@charli')) {
        return { exists: true, status: 200, title: 'Charli on TikTok' };
      }
      if (url.includes('instagram.com/charli')) {
        return { exists: true, status: 200, title: 'Charli Instagram' };
      }
      return { exists: false, status: 404 };
    });

    const results = await discoverCrossPlatformHandles('charli', {
      fetcher: mockFetcher,
      platforms: ['TIKTOK', 'INSTAGRAM', 'X', 'YOUTUBE'],
    });

    expect(results).toHaveLength(4);

    const tiktok = results.find((r) => r.platform === 'TIKTOK');
    expect(tiktok?.found).toBe(true);
    expect(tiktok?.url).toBe('https://www.tiktok.com/@charli');
    expect(tiktok?.confidence).toBeGreaterThanOrEqual(90);

    const xPlatform = results.find((r) => r.platform === 'X');
    expect(xPlatform?.found).toBe(false);
  });

  describe('defaultPlatformProbeFetcher (P7 TDD)', () => {
    it('returns exists: true when server returns 200 with HTML title', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        text: async () => '<html><head><title>Charli Profile (@charli)</title></head><body>Welcome</body></html>',
      });

      const res = await defaultPlatformProbeFetcher('https://example.com/@charli', 5000, mockFetch as any);
      expect(res.exists).toBe(true);
      expect(res.status).toBe(200);
      expect(res.title).toBe('Charli Profile (@charli)');
    });

    it('returns exists: false on HTTP 404', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 404,
        text: async () => 'Not Found',
      });

      const res = await defaultPlatformProbeFetcher('https://example.com/@notexist', 5000, mockFetch as any);
      expect(res.exists).toBe(false);
      expect(res.status).toBe(404);
    });

    it('returns exists: false on soft 404 pages containing not found indicators', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        text: async () => '<html><body><p>User not found or account doesn\'t exist</p></body></html>',
      });

      const res = await defaultPlatformProbeFetcher('https://example.com/@missing', 5000, mockFetch as any);
      expect(res.exists).toBe(false);
      expect(res.status).toBe(404);
    });

    it('handles network timeout or connection rejection safely', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));

      const res = await defaultPlatformProbeFetcher('https://unreachable.local/@test', 5000, mockFetch as any);
      expect(res.exists).toBe(false);
      expect(res.status).toBe(0);
    });
  });
});
