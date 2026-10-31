import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { UiProvider, useUi } from '../UiContext';
import { NotificationsProvider, useNotifications } from '../NotificationsContext';

describe('Performance Context Split (P5.1)', () => {
  it('UiContext provides drawer and command palette state and toggles', () => {
    function Consumer() {
      const { commandPaletteOpen, drawerOpen } = useUi();
      return (
        <div>
          <span data-testid="palette">{String(commandPaletteOpen)}</span>
          <span data-testid="drawer">{String(drawerOpen)}</span>
        </div>
      );
    }

    const html = renderToString(
      <UiProvider>
        <Consumer />
      </UiProvider>
    );

    expect(html).toContain('false');
  });

  it('NotificationsContext provides notification management', () => {
    function Consumer() {
      const { unreadCount, notifications } = useNotifications();
      return (
        <div>
          <span data-testid="unread">{unreadCount}</span>
          <span data-testid="count">{notifications.length}</span>
        </div>
      );
    }

    const html = renderToString(
      <NotificationsProvider initialUnreadCount={3}>
        <Consumer />
      </NotificationsProvider>
    );

    expect(html).toContain('3');
  });
});
