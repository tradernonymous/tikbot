import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SplitViewPane } from '../SplitViewPane';
import { UiProvider } from '@/context/UiContext';

describe('S2.5 Split View Pane Component', () => {
  it('renders nothing when split view is closed', () => {
    const html = renderToString(
      <UiProvider>
        <SplitViewPane />
      </UiProvider>
    );

    expect(html).not.toContain('Split View Secondary Workspace');
  });

  it('renders split view container with iframe and header when open', () => {
    const html = renderToString(
      <UiProvider initialSplitState={{ open: true, url: '/dashboard/composer', width: 50 }}>
        <SplitViewPane />
      </UiProvider>
    );

    expect(html).toContain('role="complementary"');
    expect(html).toContain('Split View Secondary Workspace');
    expect(html).toContain('/dashboard/composer');
    expect(html).toContain('iframe');
    expect(html).toContain('Close Split View');
  });
});
