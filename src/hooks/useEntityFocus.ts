'use client';

import { useContext, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { UiContext } from '@/context/UiContext';
import type { UiContextType } from '@/context/UiContext';
import type { EntityDrawerType } from '@/components/EntityDrawer';

/** F1.6/F1.7: The `?focus=<id>` deep-link contract — open the shared EntityDrawer for the focused id. */
export function useEntityFocus(): string | null {
  // Tolerate pages rendered outside a router context (unit tests): hooks are
  // always called unconditionally; the try/catch handles a null dispatcher.
  let searchParams: ReturnType<typeof useSearchParams> | null;
  try {
    searchParams = useSearchParams();
  } catch {
    searchParams = null;
  }
  return searchParams ? searchParams.get('focus') : null;
}

export interface FocusableEntity {
  id?: string;
  entityId?: string;
}

// All internal hooks tolerate being called outside of render (some unit tests
// invoke page functions directly). Return fallbacks in that case.
function useUiSafe(): [UiContextType | undefined, { current: boolean }] {
  let ui: UiContextType | undefined;
  try {
    ui = useContext(UiContext);
  } catch {
    ui = undefined;
  }
  let ref: { current: boolean };
  try {
    ref = useRef(false);
  } catch {
    ref = { current: false };
  }
  return [ui, ref];
}

function useEffectTolerant(effect: () => void, deps: unknown[]): void {
  try {
    useEffect(effect, deps);
  } catch {
    // Outside a render context — nothing to register.
  }
}

export function useOpenFocusedEntity<T extends FocusableEntity>(
  entities: T[],
  type: EntityDrawerType,
  idField: 'id' | 'entityId' = 'id'
): void {
  const focus = useEntityFocus();
  const [ui, openFired] = useUiSafe();
  const openDrawer = ui?.openDrawer;

  useEffectTolerant(() => {
    if (openFired.current || !focus || !openDrawer) return;
    const target = entities.find((e) => e && e[idField] === focus);
    if (target) {
      openFired.current = true;
      openDrawer({ entityType: type, data: target });
    }
  }, [focus, openDrawer, entities]);
}
