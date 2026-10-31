import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SectionErrorBoundary } from '../SectionErrorBoundary';

describe('SectionErrorBoundary Component (U4 TDD)', () => {
  it('renders children when no error occurs', () => {
    const html = renderToString(
      <SectionErrorBoundary sectionName="Accounts Fleet">
        <div>Normal Child Content</div>
      </SectionErrorBoundary>
    );

    expect(html).toContain('Normal Child Content');
  });

  it('renders fallback error banner with section name when error is provided', () => {
    const html = renderToString(
      <SectionErrorBoundary
        sectionName="Accounts Fleet"
        fallbackError={new Error('Database query failure')}
      >
        <div>Should Not Render</div>
      </SectionErrorBoundary>
    );

    expect(html).toContain('Accounts Fleet Error');
    expect(html).toContain('Database query failure');
    expect(html).toContain('Retry');
  });
});
