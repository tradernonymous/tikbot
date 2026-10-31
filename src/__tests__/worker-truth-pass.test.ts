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

  it('rejects farm.like with HandlerNotConfiguredError by default', async () => {
    await expect(
      executeJobHandler('farm.like', { url: 'https://tiktok.com/@creator/video/1' })
    ).rejects.toThrow(HandlerNotConfiguredError);
  });

  it('rejects farm.comment with HandlerNotConfiguredError by default', async () => {
    await expect(
      executeJobHandler('farm.comment', { url: 'https://tiktok.com/@creator/video/1', comment: 'nice' })
    ).rejects.toThrow(HandlerNotConfiguredError);
  });

  it('rejects farm.live with HandlerNotConfiguredError by default', async () => {
    await expect(
      executeJobHandler('farm.live', { streamUrl: 'https://tiktok.com/@creator/live' })
    ).rejects.toThrow(HandlerNotConfiguredError);
  });

  it('has no default success:true path for farm actions without an injected driver', async () => {
    for (const jobType of ['farm.like', 'farm.comment', 'farm.live']) {
      await expect(executeJobHandler(jobType, { url: 'https://tiktok.com/@u/v/1' })).rejects.toThrow(
        HandlerNotConfiguredError
      );
    }
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
