import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { EmptyState } from '../EmptyState';

describe('EmptyState Component (U2 TDD)', () => {
  it('renders title, description, and action button with link', () => {
    const html = renderToString(
      <EmptyState
        title="No Accounts Registered"
        description="Connect your first TikTok node to begin."
        actionText="Add Account"
        actionHref="/dashboard/accounts"
      />
    );

    expect(html).toContain('No Accounts Registered');
    expect(html).toContain('Connect your first TikTok node to begin.');
    expect(html).toContain('Add Account');
    expect(html).toContain('href="/dashboard/accounts"');
  });

  it('renders without action when not supplied', () => {
    const html = renderToString(
      <EmptyState
        title="No Logs Found"
        description="Audit logs will appear as operations execute."
      />
    );

    expect(html).toContain('No Logs Found');
    expect(html).toContain('Audit logs will appear as operations execute.');
  });
});
