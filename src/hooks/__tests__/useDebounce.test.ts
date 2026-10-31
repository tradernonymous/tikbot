import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../useDebounce';
import { createAbortableRequest } from '@/lib/abortable-fetch';

describe('Performance Utils: Debounce & Abortable Fetch (P5.4)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces function execution by 250ms default', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced('a');
    debounced('ab');
    debounced('abc');

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(249);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('abc');
  });

  it('aborts prior in-flight request when a new request is triggered', () => {
    const manager = createAbortableRequest();

    const signal1 = manager.nextSignal();
    expect(signal1.aborted).toBe(false);

    const signal2 = manager.nextSignal();
    expect(signal1.aborted).toBe(true);
    expect(signal2.aborted).toBe(false);
  });
});
