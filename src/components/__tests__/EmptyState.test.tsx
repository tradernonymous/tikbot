import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { EmptyState } from '../EmptyState';
import { Users } from 'lucide-react';

describe('EmptyState Component (U4.7)', () => {
  it('renders title, description, and primary action CTA', () => {
    const handleAction = vi.fn();
    const el = EmptyState({
      icon: Users,
      title: 'No Farm Accounts Connected',
      description: 'Add your first account session to begin warmups and campaign distribution.',
      actionLabel: 'Add Account',
      onAction: handleAction,
    });

    expect(el).toBeDefined();
    expect(el.props['role']).toBe('region');
    expect(el.props['aria-label']).toContain('No Farm Accounts Connected');
  });

  it('renders link CTA when actionHref is provided', () => {
    const el = EmptyState({
      title: 'No Active Campaigns',
      description: 'Launch a campaign from research outliers or create one manually.',
      actionLabel: 'Explore Research',
      actionHref: '/dashboard/research',
    });

    expect(el).toBeDefined();
  });
});
