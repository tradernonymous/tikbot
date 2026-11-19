import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StealthFarmDriver } from '../interaction-driver';
import type { ViewRunResult } from '../stealth-runner';

vi.mock('@/farm/stealth-runner', () => ({
  runStealthViewSession: vi.fn(),
}));

import { runStealthViewSession } from '@/farm/stealth-runner';

const mockRunStealthViewSession = runStealthViewSession as unknown as ReturnType<typeof vi.fn>;

const okResult: ViewRunResult = { successfulViews: 1, failedViews: 0, blockedViews: 0, totalDurationSeconds: 5, errors: [] };

describe('R3.3 — StealthFarmDriver (real stealth sessions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunStealthViewSession.mockResolvedValue(okResult);
  });

  it('like() runs a stealth session and returns a proof artifact', async () => {
    const driver = new StealthFarmDriver();
    const res = await driver.like({ url: 'https://www.tiktok.com/@a/video/v1', accountId: 'acc-1' });
    expect(mockRunStealthViewSession).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://www.tiktok.com/@a/video/v1' }));
    expect(res.success).toBe(true);
    expect(res.proof.action).toBe('LIKE');
    expect(res.proof.accountId).toBe('acc-1');
    expect(typeof res.proof.timestamp).toBe('string');
  });

  it('comment() returns a COMMENT proof with targetUrl and timestamp', async () => {
    const driver = new StealthFarmDriver();
    const res = await driver.comment({ url: 'https://www.tiktok.com/@a/video/v2', accountId: 'acc-2', text: 'hi' });
    expect(res.success).toBe(true);
    expect(res.proof.action).toBe('COMMENT');
    expect(res.proof.targetUrl).toBe('https://www.tiktok.com/@a/video/v2');
  });

  it('fails honestly when the stealth session reports no views', async () => {
    mockRunStealthViewSession.mockResolvedValue({ ...okResult, successfulViews: 0, blockedViews: 1 });
    const driver = new StealthFarmDriver();
    const res = await driver.like({ url: 'https://www.tiktok.com/@a/video/v1', accountId: 'acc-1' });
    expect(res.success).toBe(false);
  });
});
