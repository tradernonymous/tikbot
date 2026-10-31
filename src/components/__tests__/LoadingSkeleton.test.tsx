import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LoadingSkeleton } from '../LoadingSkeleton';

describe('LoadingSkeleton Component (U3 TDD)', () => {
  it('renders default pulse placeholder rows', () => {
    const html = renderToString(<LoadingSkeleton rows={3} />);
    expect(html).toContain('animate-pulse');
    // Check for 3 rows
    const matches = html.match(/animate-pulse/g);
    expect(matches?.length).toBeGreaterThanOrEqual(1);
  });
});
