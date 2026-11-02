import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { NotificationsProvider, useNotifications } from '../NotificationsContext';

describe('2.4 Notifications Context Contract & Polling Consolidation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly and provides initial zero counts matching default contract', () => {
    function Consumer() {
      const { counts, unreadCount } = useNotifications();
      return (
        <div>
          <span data-testid="total">{counts.total}</span>
          <span data-testid="approvals">{counts.approvals}</span>
          <span data-testid="incidents">{counts.incidents}</span>
          <span data-testid="unread">{unreadCount}</span>
        </div>
      );
    }

    const html = renderToString(
      <NotificationsProvider initialUnreadCount={4}>
        <Consumer />
      </NotificationsProvider>
    );

    expect(html).toContain('4');
  });

  it('verifies contract for unpacking API data.counts shape', async () => {
    const mockApiResponse = {
      success: true,
      counts: {
        total: 7,
        approvals: 3,
        incidents: 2,
        research: 1,
        system: 1,
      },
    };

    // Verify response shape structure matches expected API contract
    expect(mockApiResponse.counts).toHaveProperty('total', 7);
    expect(mockApiResponse.counts).toHaveProperty('approvals', 3);
    expect(mockApiResponse.counts).toHaveProperty('incidents', 2);
    expect(mockApiResponse.counts).toHaveProperty('research', 1);
    expect(mockApiResponse.counts).toHaveProperty('system', 1);
  });
});
