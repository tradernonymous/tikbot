import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SessionContextProvider, useSessionContext, SessionState } from '../SessionContext';
import { ContextCarriedChip } from '@/components/ContextCarriedChip';

describe('S2.2 Context Carry SessionContext & Chip', () => {
  beforeEach(() => {
    // Clean mock storage if needed
  });

  it('renders ContextCarriedChip with carried metadata and account details', () => {
    const initialState: Partial<SessionState> = {
      selectedAccountId: 'acc-viral-101',
      dateRange: '7d',
      carriedSource: 'outlier',
      carriedMetadata: {
        title: 'Stop scrolling and try this',
        authorHandle: 'trendmaster',
      },
    };

    const html = renderToString(
      <SessionContextProvider initialState={initialState}>
        <ContextCarriedChip />
      </SessionContextProvider>
    );

    expect(html).toContain('Carrying:');
    expect(html).toContain('Stop scrolling and try this');
    expect(html).toContain('outlier');
    expect(html).toContain('Clear carried context');
  });

  it('renders nothing when no context is carried', () => {
    const html = renderToString(
      <SessionContextProvider initialState={{ carriedSource: null, selectedAccountId: null }}>
        <ContextCarriedChip />
      </SessionContextProvider>
    );

    expect(html).not.toContain('Carrying:');
  });
});
