import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

let mockSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/context/OperationsContext', () => ({
  useOperations: () => ({
    accounts: [],
    campaigns: [],
    farmTasks: [],
    publishJobs: [],
  }),
}));

import LivePage from '../page';

describe('W1.10 Live Intel Page (/dashboard/live)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('');
  });

  it('renders blank state when no live broadcast target is connected (no fake numbers)', () => {
    const html = renderToString(<LivePage initialConnected={false} initialTracker={null} />);
    expect(html).toContain('No live broadcast target connected');
    expect(html).toContain('Connect Live Target');
  });

  it('honors target query parameter from URL', () => {
    mockSearchParams = new URLSearchParams('target=streamer_top');
    const html = renderToString(<LivePage initialConnected={false} />);
    expect(html).toContain('streamer_top');
  });

  it('renders live viewer telemetry, peak viewers, gifts counter and captured questions when connected', () => {
    const mockTracker = {
      targetHandle: 'streamer_pro',
      currentViewers: 2450,
      peakViewers: 3100,
      totalGiftsCount: 142,
      viewerTimeSeries: [
        { timestamp: '18:00:00', count: 1800 },
        { timestamp: '18:05:00', count: 2450 },
      ],
      capturedQuestions: [
        { author: 'fan_123', text: 'Where did you get the hoodie?', timestamp: '18:04:12' },
      ],
    };

    const html = renderToString(<LivePage initialConnected={true} initialTracker={mockTracker as any} />);
    expect(html).toContain('@streamer_pro');
    expect(html).toContain('2,450');
    expect(html).toContain('3,100');
    expect(html).toContain('Where did you get the hoodie?');
    expect(html).toContain('Route to Inbox');
    expect(html).toContain('data-provenance');
  });
});
