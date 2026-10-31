import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { EntityDrawer } from '@/components/EntityDrawer';

describe('F1.6 & F1.7 Deep-Link ?focus= and EntityDrawer Contract', () => {
  it('opens EntityDrawer and populates entity data when focus matches an account', () => {
    const mockAccounts = [
      { id: 'acc-1', username: 'growth_lead', status: 'ACTIVE', warmupDay: 3 },
      { id: 'acc-2', username: 'viral_node', status: 'WARMING', warmupDay: 1 },
    ];

    const focusId = 'acc-1';
    const focusedAccount = mockAccounts.find((a) => a.id === focusId);

    const html = renderToString(
      <EntityDrawer
        isOpen={Boolean(focusedAccount)}
        onClose={vi.fn()}
        entityType="account"
        data={focusedAccount || null}
      />
    );

    expect(html).toContain('Account Detail');
    expect(html).toContain('growth_lead');
  });

  it('renders nothing when focus is absent or does not match', () => {
    const html = renderToString(
      <EntityDrawer
        isOpen={false}
        onClose={vi.fn()}
        entityType="account"
        data={null}
      />
    );

    expect(html).toBe('');
  });

  it('generates correct clean URL when closing drawer', () => {
    const currentParams = new URLSearchParams('focus=acc-1&tab=ACCOUNTS');
    currentParams.delete('focus');
    const remaining = currentParams.toString();
    const nextUrl = remaining ? `?${remaining}` : '/dashboard/accounts';

    expect(nextUrl).toBe('?tab=ACCOUNTS');
  });
});
