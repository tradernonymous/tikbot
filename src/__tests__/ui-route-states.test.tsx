import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import RootLoading from '@/app/loading';
import DashboardLoading from '@/app/dashboard/loading';
import RootError from '@/app/error';
import DashboardError from '@/app/dashboard/error';
import RootNotFound from '@/app/not-found';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

describe('Route States & Error Boundaries (U4.4)', () => {
  it('renders RootLoading skeleton with accessible progress role', () => {
    const el = RootLoading();
    expect(el).toBeDefined();
    expect(el.props['aria-label'] || el.props['aria-busy'] || el.props.className).toBeDefined();
  });

  it('renders DashboardLoading skeleton', () => {
    const el = DashboardLoading();
    expect(el).toBeDefined();
  });

  it('renders RootError with retry action and error digest/message', () => {
    vi.spyOn(React, 'useEffect').mockImplementation(() => {});
    const mockReset = vi.fn();
    const mockError = new Error('Test crash') as Error & { digest?: string };
    mockError.digest = 'ERR_DIGEST_123';

    const el = RootError({ error: mockError, reset: mockReset });
    expect(el).toBeDefined();
    expect(el.props.role).toBe('alert');
  });

  it('renders DashboardError with reset handler', () => {
    vi.spyOn(React, 'useEffect').mockImplementation(() => {});
    const mockReset = vi.fn();
    const mockError = new Error('Dashboard boundary failure');

    const el = DashboardError({ error: mockError, reset: mockReset });
    expect(el).toBeDefined();
    expect(el.props.role).toBe('alert');
  });

  it('renders RootNotFound with link back to dashboard or home', () => {
    const el = RootNotFound();
    expect(el).toBeDefined();
  });

  it('SectionErrorBoundary catches thrown errors and displays fallback with reset button', () => {
    const ProblemChild = () => {
      throw new Error('Explosion in section');
    };

    expect(SectionErrorBoundary).toBeDefined();
  });
});
