import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { NotificationCenter } from '../NotificationCenter';

describe('NotificationCenter Component (F1.4)', () => {
  it('renders Notification Center with tabs for All, Approvals, Incidents, Research, System', () => {
    const html = renderToString(
      <NotificationCenter
        isOpen={true}
        onClose={vi.fn()}
        notifications={[
          {
            id: 'n1',
            type: 'APPROVAL',
            severity: 'INFO',
            title: 'Campaign Pending',
            body: 'Q4 Needs approval',
            href: '/dashboard/campaigns?focus=camp-1',
            readAt: null,
            createdAt: new Date().toISOString(),
          },
        ]}
        counts={{ total: 1, approvals: 1, incidents: 0, research: 0, system: 0 }}
      />
    );

    expect(html).toContain('Notification Center');
    expect(html).toContain('All');
    expect(html).toContain('Approvals');
    expect(html).toContain('Incidents');
    expect(html).toContain('Research');
    expect(html).toContain('System');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('/dashboard/campaigns?focus=camp-1');
  });

  it('renders empty state when there are no notifications in selected tab', () => {
    const html = renderToString(
      <NotificationCenter
        isOpen={true}
        onClose={vi.fn()}
        notifications={[]}
        counts={{ total: 0, approvals: 0, incidents: 0, research: 0, system: 0 }}
      />
    );

    expect(html).toContain('No notifications in this view');
  });
});
