import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { ToastManager, ToastItem } from '../Toast';

describe('F1.5 Toast Layer Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('adds and auto-dismisses toast after 5s', () => {
    let currentToasts: ToastItem[] = [];
    const manager = new ToastManager((toasts) => {
      currentToasts = toasts;
    });

    manager.showToast({
      id: 't1',
      title: 'Action Succeeded',
      type: 'success',
      durationMs: 5000,
    });

    expect(currentToasts).toHaveLength(1);
    expect(currentToasts[0].title).toBe('Action Succeeded');

    // Advance 5s
    vi.advanceTimersByTime(5000);
    expect(currentToasts).toHaveLength(0);
  });

  it('dedupes toasts by key so duplicate collapses', () => {
    let currentToasts: ToastItem[] = [];
    const manager = new ToastManager((toasts) => {
      currentToasts = toasts;
    });

    manager.showToast({
      key: 'campaign:camp-1',
      title: 'Campaign 1 Approved',
      type: 'success',
    });

    manager.showToast({
      key: 'campaign:camp-1',
      title: 'Campaign 1 Approved Again',
      type: 'success',
    });

    expect(currentToasts).toHaveLength(1);
    expect(currentToasts[0].key).toBe('campaign:camp-1');
  });

  it('clears active timers on destroy / unmount leaving no dangling timers', () => {
    let currentToasts: ToastItem[] = [];
    const manager = new ToastManager((toasts) => {
      currentToasts = toasts;
    });

    manager.showToast({
      id: 't2',
      title: 'Warning issued',
      type: 'warn',
    });

    expect(vi.getTimerCount()).toBe(1);

    manager.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
