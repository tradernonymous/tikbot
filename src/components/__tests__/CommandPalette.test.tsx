import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CommandPalette, filterCommandPaletteItems, CommandPaletteItem } from '../CommandPalette';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('F1.9 Command Palette v2', () => {
  const sampleItems: CommandPaletteItem[] = [
    { id: 'act-1', title: 'Approve pending campaigns', category: 'action', href: '/dashboard/campaigns' },
    { id: 'act-2', title: 'Approve publishing slots', category: 'action', href: '/dashboard/publishing' },
    { id: 'act-3', title: 'Emergency Kill Switch', category: 'action', href: '/dashboard/compliance' },
    { id: 'page-1', title: 'Engagement Campaigns', category: 'page', href: '/dashboard/campaigns' },
    { id: 'acc-1', title: '@growth_alpha', subtitle: 'ACTIVE', category: 'entity', href: '/dashboard/accounts?focus=acc-1' },
  ];

  it('filters items correctly: typing "appr" surfaces approval actions', () => {
    const results = filterCommandPaletteItems(sampleItems, 'appr');
    expect(results.length).toBe(2);
    expect(results[0].title).toContain('Approve pending campaigns');
    expect(results[1].title).toContain('Approve publishing slots');
  });

  it('filters items correctly: typing "growth" surfaces matching entity', () => {
    const results = filterCommandPaletteItems(sampleItems, 'growth');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('@growth_alpha');
  });

  it('renders command palette with role="listbox" and role="option"', () => {
    const html = renderToString(
      <CommandPalette
        isOpen={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        items={sampleItems}
        searchQuery="appr"
        onSearchChange={vi.fn()}
        selectedIndex={0}
      />
    );

    expect(html).toContain('role="listbox"');
    expect(html).toContain('role="option"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('Approve pending campaigns');
  });
});
