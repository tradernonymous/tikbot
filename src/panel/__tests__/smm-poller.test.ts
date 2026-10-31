import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  pollSingleSMMTask,
  pollAllSMMTasks,
  calculatePollerBackoff,
} from '../smm-poller';

describe('SMM Poller Engine (P10 TDD)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calculates exponential backoff on consecutive errors up to maximum', () => {
    expect(calculatePollerBackoff(0, 15000, 60000)).toBe(15000);
    expect(calculatePollerBackoff(1, 15000, 60000)).toBe(30000);
    expect(calculatePollerBackoff(2, 15000, 60000)).toBe(60000);
    expect(calculatePollerBackoff(5, 15000, 60000)).toBe(60000); // capped at maxMs
  });

  it('polls single SMM task and parses provider status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: {
          status: 'In progress',
          remains: 250,
          startCount: 100,
        },
      }),
    } as any);

    const result = await pollSingleSMMTask(
      { id: 'task-1', externalOrderId: 'ord-123' },
      mockFetch
    );

    expect(result.success).toBe(true);
    expect(result.taskId).toBe('task-1');
    expect(result.externalOrderId).toBe('ord-123');
    expect(result.rawStatus).toBe('In progress');
    expect(result.remains).toBe(250);
  });

  it('captures error telemetry when single SMM task poll fails', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Gateway Timeout'));

    const result = await pollSingleSMMTask(
      { id: 'task-2', externalOrderId: 'ord-err' },
      mockFetch
    );

    expect(result.success).toBe(false);
    expect(result.taskId).toBe('task-2');
    expect(result.error).toContain('Gateway Timeout');
  });

  it('polls multiple tasks concurrently using Promise.allSettled without blocking on individual failures', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url, init) => {
      const body = JSON.parse(init.body);
      if (body.orderId === 'ord-good') {
        return {
          json: async () => ({
            success: true,
            status: { status: 'Completed', remains: 0 },
          }),
        };
      }
      throw new Error('Network error on bad order');
    });

    const tasks = [
      { id: 't1', externalOrderId: 'ord-good' },
      { id: 't2', externalOrderId: 'ord-bad' },
    ];

    const results = await pollAllSMMTasks(tasks, mockFetch as any);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[0].rawStatus).toBe('Completed');
    expect(results[1].success).toBe(false);
    expect(results[1].error).toContain('Network error on bad order');
  });

  it('returns failure immediately if task has no externalOrderId', async () => {
    const res = await pollSingleSMMTask({ id: 't-no-order' });
    expect(res.success).toBe(false);
    expect(res.error).toBe('Missing externalOrderId');
  });

  it('handles provider returning unsuccessful response payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'Order not found in provider system',
      }),
    } as any);

    const res = await pollSingleSMMTask({ id: 't-err', externalOrderId: 'ord-notfound' }, mockFetch);
    expect(res.success).toBe(false);
    expect(res.error).toBe('Order not found in provider system');
  });
});
