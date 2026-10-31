import { describe, it, expect, vi } from 'vitest';
import { PythonSidecarBridge } from '../sidecar-bridge';

describe('Python Sidecar Bridge Client', () => {
  it('extracts author feed via sidecar endpoint', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        username: 'creator_test',
        items: [
          {
            id: 'v1',
            desc: 'Hook breakdown',
            createTime: 1700000000,
            playCount: 100000,
            diggCount: 5000,
            commentCount: 200,
            shareCount: 150,
            author: 'creator_test',
          },
        ],
      }),
    });

    const bridge = new PythonSidecarBridge({
      baseUrl: 'http://sidecar.railway.internal:8000',
      internalSecret: 'secret-token-123',
      fetcher: mockFetcher,
    });

    const feed = await bridge.extractCreatorFeed('creator_test', 10);
    expect(feed.status).toBe('success');
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].id).toBe('v1');

    // Assert internal secret header was passed
    expect(mockFetcher).toHaveBeenCalledWith(
      'http://sidecar.railway.internal:8000/api/v1/extract-feed',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-internal-secret': 'secret-token-123',
        }),
      })
    );
  });

  it('transcribes video audio via sidecar', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        transcript: 'This video hook went viral.',
        durationSeconds: 15.2,
        segments: [],
      }),
    });

    const bridge = new PythonSidecarBridge({
      fetcher: mockFetcher,
    });

    const res = await bridge.transcribeMedia('https://storage.tikbot.local/v1.mp4');
    expect(res.transcript).toBe('This video hook went viral.');
    expect(res.durationSeconds).toBe(15.2);
  });

  it('throws error when sidecar responds with HTTP failure', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const bridge = new PythonSidecarBridge({ fetcher: mockFetcher });
    await expect(bridge.extractCreatorFeed('test', 5)).rejects.toThrow(/Internal Server Error/);
  });
});
