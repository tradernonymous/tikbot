import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import FarmAccountsPage from '../page';

describe('F1.7 Farm Accounts Page', () => {
  it('renders page header and tabs with accessible ARIA tablist', async () => {
    const searchParams = Promise.resolve({ tab: 'grid' });
    const page = await FarmAccountsPage({ searchParams });
    const html = renderToString(page);

    expect(html).toContain('Farm Accounts');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('Grid');
    expect(html).toContain('Tiers');
    expect(html).toContain('Creation Queue');
    expect(html).toContain('Bindings Matrix');
  });

  it('renders Bindings Matrix heat table when tab is bindings', async () => {
    const searchParams = Promise.resolve({ tab: 'bindings' });
    const page = await FarmAccountsPage({ searchParams });
    const html = renderToString(page);

    expect(html).toContain('Binding Matrix');
    expect(html).toContain('Proxy Subnet');
    expect(html).toContain('Persona Engine');
  });

  it('renders creation queue and provenance label', async () => {
    const searchParams = Promise.resolve({ tab: 'queue' });
    const page = await FarmAccountsPage({ searchParams });
    const html = renderToString(page);

    expect(html).toContain('Creation Pipeline Queue');
    expect(html).toContain('live');
  });
});
