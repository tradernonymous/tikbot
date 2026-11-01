import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TopNavbar } from '../TopNavbar';
import { OperationsProvider } from '@/context/OperationsContext';
import { UiProvider } from '@/context/UiContext';
import { SessionContextProvider } from '@/context/SessionContext';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('TopNavbar with Phase 2 Synchronization & Navigation', () => {
  it('renders TopNavbar with split view button, carried chip container, and cheat sheet modal', () => {
    const html = renderToString(
      <UiProvider>
        <SessionContextProvider initialState={{ carriedSource: 'outlier', carriedMetadata: { title: 'Viral Test' } }}>
          <OperationsProvider>
            <TopNavbar />
          </OperationsProvider>
        </SessionContextProvider>
      </UiProvider>
    );

    expect(html).toContain('STRICT COMPLIANCE');
    expect(html).toContain('Carrying:');
    expect(html).toContain('Viral Test');
    expect(html).toContain('Open Split View');
    expect(html).toContain('Search accounts, jobs...');
  });
});
