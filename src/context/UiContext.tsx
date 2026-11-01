'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { broadcastSyncEvent, subscribeSyncEvents } from '@/sync/client-event-bus';

export interface UiContextType {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  drawerOpen: boolean;
  selectedEntity: any | null;
  openDrawer: (entity: any) => void;
  closeDrawer: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  splitViewOpen: boolean;
  splitViewUrl: string | null;
  splitWidthPercent: number;
  openSplitView: (url: string) => void;
  closeSplitView: () => void;
  setSplitWidth: (percent: number) => void;
}

const SPLIT_STORAGE_KEY = 'tikbot_split_view_config';

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({
  children,
  initialSplitState,
}: {
  children: ReactNode;
  initialSplitState?: { open: boolean; url: string; width?: number };
}) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Split View State (S2.5)
  const [splitViewOpen, setSplitViewOpen] = useState<boolean>(() => {
    if (initialSplitState) return initialSplitState.open;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SPLIT_STORAGE_KEY);
        if (saved) return JSON.parse(saved).open;
      } catch {}
    }
    return false;
  });

  const [splitViewUrl, setSplitViewUrl] = useState<string | null>(() => {
    if (initialSplitState) return initialSplitState.url;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SPLIT_STORAGE_KEY);
        if (saved) return JSON.parse(saved).url;
      } catch {}
    }
    return null;
  });

  const [splitWidthPercent, setSplitWidthPercent] = useState<number>(() => {
    if (initialSplitState?.width) return initialSplitState.width;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SPLIT_STORAGE_KEY);
        if (saved) return JSON.parse(saved).width || 50;
      } catch {}
    }
    return 50;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          SPLIT_STORAGE_KEY,
          JSON.stringify({ open: splitViewOpen, url: splitViewUrl, width: splitWidthPercent })
        );
      } catch {}
    }
  }, [splitViewOpen, splitViewUrl, splitWidthPercent]);

  // Sync split view across tabs
  useEffect(() => {
    const unsub = subscribeSyncEvents((ev) => {
      if (ev.type === 'SPLIT_VIEW_CHANGED' && ev.payload) {
        if (typeof ev.payload.open === 'boolean') setSplitViewOpen(ev.payload.open);
        if (ev.payload.url !== undefined) setSplitViewUrl(ev.payload.url);
      }
    });
    return unsub;
  }, []);

  const toggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen((prev) => !prev);
  }, []);

  const openDrawer = useCallback((entity: any) => {
    setSelectedEntity(entity);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedEntity(null);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const openSplitView = useCallback((url: string) => {
    setSplitViewUrl(url);
    setSplitViewOpen(true);
    broadcastSyncEvent({ type: 'SPLIT_VIEW_CHANGED', payload: { open: true, url } });
  }, []);

  const closeSplitView = useCallback(() => {
    setSplitViewOpen(false);
    setSplitViewUrl(null);
    broadcastSyncEvent({ type: 'SPLIT_VIEW_CHANGED', payload: { open: false, url: null } });
  }, []);

  const setSplitWidth = useCallback((percent: number) => {
    const clamped = Math.max(25, Math.min(75, percent));
    setSplitWidthPercent(clamped);
  }, []);

  const value = useMemo<UiContextType>(
    () => ({
      commandPaletteOpen,
      setCommandPaletteOpen,
      toggleCommandPalette,
      drawerOpen,
      selectedEntity,
      openDrawer,
      closeDrawer,
      sidebarCollapsed,
      toggleSidebar,
      splitViewOpen,
      splitViewUrl,
      splitWidthPercent,
      openSplitView,
      closeSplitView,
      setSplitWidth,
    }),
    [
      commandPaletteOpen,
      drawerOpen,
      selectedEntity,
      sidebarCollapsed,
      splitViewOpen,
      splitViewUrl,
      splitWidthPercent,
      toggleCommandPalette,
      openDrawer,
      closeDrawer,
      toggleSidebar,
      openSplitView,
      closeSplitView,
      setSplitWidth,
    ]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextType {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error('useUi must be used within a UiProvider');
  }
  return context;
}
