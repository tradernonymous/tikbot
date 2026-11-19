import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getDownloadApiRequestLog, clearDownloadApiRequestLog } from '../download-api-v5';

async function getV5Client(): Promise<any> {
  const mod: any = await import('../download-api-v5');
  const names = Object.keys(mod);
  const fn = Object.values(mod).find(
    (v: any) => typeof v === 'function' && v?.prototype?.extractVideoData && /5/.test(v.name || '')
  );
  if (!fn) throw new Error(`no v5 class; module exports: ${names.join(', ')}`);
  return fn;
}

describe('R2.8 — Download API v5 adapter (Phase 2)', () => {
  beforeEach(() => {
    clearDownloadApiRequestLog();
  });

  it('retries on 429 then returns data when a retry succeeds', async () => {
    let calls = 0;
    const fetcher = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error('Failed to fetch video data from Download API: 429 Too Many Requests');
      }
      return {
        ok: true,
        json: async () => ({
          status: 'success',
          data: {
            id: 'v1',
            desc: 'hello',
            author: { id: 'u1', unique_id: 'topcreator', nickname: 'Top' },
            statistics: { play_count: 100, digg_count: 10, comment_count: 2, share_count: 1 },
            video: {
              play_addr: { url_list: ['https://p.cdn/v.mp4'] },
              cover: { url_list: ['https://p.cdn/c.jpg'] },
            },
          },
        }),
      } as any;
    });
    const V5 = await getV5Client();
    const client = new V5({ apiBaseUrl: 'http://api.test', fetcher, retryBaseMs: 1 });
    const data = await client.extractVideoData('https://www.tiktok.com/@topcreator/video/v1');
    expect(data.stats.views).toBe(100);
    expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('records request log entries with health tiers on failures', async () => {
    const fetcher = vi.fn(async () => new Response('', { status: 429 }));
    const V5 = await getV5Client();
    const client = new V5({ apiBaseUrl: 'http://api.test', fetcher, retryBaseMs: 1 });
    await expect(client.extractVideoData('https://www.tiktok.com/@a/video/v1')).rejects.toThrow();
    const log = getDownloadApiRequestLog();
    expect(log.length).toBeGreaterThan(0);
    expect(log.some((e) => e.status === 429)).toBe(true);
  });
});
