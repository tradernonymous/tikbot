import { describe, it, expect, vi } from 'vitest';
import {
  discoverCrossPlatformHandles,
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
});
