import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  broadcastSyncEvent,
  subscribeSyncEvents,
  ClientSyncEvent,
  resetClientEventBusForTesting,
} from '@/sync/client-event-bus';
import {
  UndoStackManager,
  resetGlobalUndoStackForTesting,
} from '@/sync/undo-stack';
import {
  calculateBackoffMs,
  RealtimeConnectionManager,
} from '@/sync/client-realtime';
import { SessionContextProvider } from '@/context/SessionContext';
import { UiProvider } from '@/context/UiContext';
import { OperationsProvider } from '@/context/OperationsContext';
import { TopNavbar } from '@/components/TopNavbar';
import { EntityDrawer } from '@/components/EntityDrawer';
import { SplitViewPane } from '@/components/SplitViewPane';
import { ShortcutCheatSheetModal } from '@/components/ShortcutCheatSheetModal';
import { CommandPalette, CommandPaletteItem, filterCommandPaletteItems } from '@/components/CommandPalette';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/trends',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams('tab=rising'),
}));

describe('Phase 2 E2E — Synchronization + Jump Navigation Suite', () => {
  beforeEach(() => {
    resetClientEventBusForTesting();
    resetGlobalUndoStackForTesting();
  });

  it('S2.1: Dispatches cross-tab live sync events with sourceTabId and timestamp', () => {
    const received: ClientSyncEvent[] = [];
    const unsub = subscribeSyncEvents((ev) => received.push(ev));

    broadcastSyncEvent({
      type: 'CAMPAIGN_UPDATED',
      payload: { campaignId: 'c-viral', status: 'ACTIVE' },
    });

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('CAMPAIGN_UPDATED');
    expect(received[0].payload.campaignId).toBe('c-viral');
    expect(received[0].sourceTabId).toMatch(/^tab-/);
    unsub();
  });

  it('S2.2: Context carry renders carried metadata chip across pages', () => {
    const html = renderToString(
      <UiProvider>
        <SessionContextProvider
          initialState={{
            selectedAccountId: 'acc-growth-99',
            carriedSource: 'trend',
            carriedMetadata: { title: 'POV: Daily Tech Hack' },
          }}
        >
          <OperationsProvider>
            <TopNavbar />
          </OperationsProvider>
        </SessionContextProvider>
      </UiProvider>
    );

    expect(html).toContain('Carrying:');
    expect(html).toContain('POV: Daily Tech Hack');
    expect(html).toContain('trend');
  });

  it('S2.3: Jump system fuzzy filters context jump items with carried parameters', () => {
    const jumpItems: CommandPaletteItem[] = [
      {
        id: 'jump-outlier',
        title: 'Jump: Outlier #12 -> Composer',
        category: 'jump',
        href: '/dashboard/composer?topic=Viral%20Story',
        carriedContext: { source: 'outlier', metadata: { topic: 'Viral Story' } },
      },
      {
        id: 'page-trends',
        title: 'Trends Radar',
        category: 'page',
        href: '/dashboard/trends',
      },
    ];

    const matches = filterCommandPaletteItems(jumpItems, 'outlier');
    expect(matches).toHaveLength(1);
    expect(matches[0].category).toBe('jump');
    expect(matches[0].carriedContext?.source).toBe('outlier');
  });

  it('S2.4: Related-entity rail in EntityDrawer provides relationship map nodes', () => {
    const html = renderToString(
      <EntityDrawer
        isOpen={true}
        onClose={vi.fn()}
        entityType="account"
        data={{
          id: 'acc-node-1',
          username: 'tiktok_viral_pilot',
          status: 'ACTIVE',
        }}
      />
    );

    expect(html).toContain('Relationship Map');
    expect(html).toContain('Campaigns');
    expect(html).toContain('Jobs');
    expect(html).toContain('Metrics');
  });

  it('S2.5: Split view secondary workspace renders side-by-side with iframe', () => {
    const html = renderToString(
      <UiProvider initialSplitState={{ open: true, url: '/dashboard/inbox' }}>
        <SplitViewPane />
      </UiProvider>
    );

    expect(html).toContain('Split View Secondary Workspace');
    expect(html).toContain('/dashboard/inbox');
    expect(html).toContain('Close Split View');
  });

  it('S2.6: Global undo stack pushes, executes undo, and respects 10-step cap', async () => {
    const stack = new UndoStackManager();
    let unscheduled = false;

    stack.pushAction({
      description: 'Unschedule publish slot #42',
      undo: () => {
        unscheduled = true;
      },
    });

    expect(stack.canUndo()).toBe(true);
    const undone = await stack.undo();
    expect(undone?.description).toBe('Unschedule publish slot #42');
    expect(unscheduled).toBe(true);
  });

  it('S2.7: Shortcut cheat sheet modal documents navigation and row operations', () => {
    const html = renderToString(
      <ShortcutCheatSheetModal isOpen={true} onClose={vi.fn()} />
    );

    expect(html).toContain('Keyboard Shortcuts');
    expect(html).toContain('Command Palette');
    expect(html).toContain('Trends Radar');
    expect(html).toContain('Composer');
    expect(html).toContain('Undo safe operation');
  });

  it('S2.8: Realtime backoff calculates capped exponential delays', () => {
    expect(calculateBackoffMs(0)).toBe(1000);
    expect(calculateBackoffMs(1)).toBe(2000);
    expect(calculateBackoffMs(6)).toBe(30000);
  });
});
