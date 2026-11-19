import { describe, it, expect, beforeEach } from 'vitest';
import {
  jobHandlerRegistry,
  registerJobHandler,
  registerDefaultJobHandlers,
  executeJobHandler,
  HandlerNotConfiguredError,
} from '../worker';

describe('R0.1 Truth Pass — Worker Handler Configuration', () => {
  beforeEach(() => {
    registerDefaultJobHandlers();
  });

  it('registers real farm handlers by default (no fake success path)', () => {
    // R0.1 + R3.2: farm.like/comment/live/share/save/follow/fyp_push are real
    // drivers (StealthFarmDriver) — never a no-op success:true handler.
    for (const jobType of ['farm.like', 'farm.comment', 'farm.live', 'farm.share', 'farm.save', 'farm.follow', 'farm.fyp_push']) {
      expect(jobHandlerRegistry.has(jobType)).toBe(true);
    }
    expect(jobHandlerRegistry.has('farm.view')).toBe(true);
  });

  it('allows registering a real driver which executes successfully', async () => {
    const realLikeDriver = async (payload: Record<string, unknown>) => {
      return { executed: true, target: payload.url, actionId: 'act-123' };
    };
    registerJobHandler('farm.like', realLikeDriver);

    const result = (await executeJobHandler('farm.like', { url: 'https://tiktok.com/@creator/video/1' })) as any;
    expect(result.executed).toBe(true);
    expect(result.actionId).toBe('act-123');
  });
});
