'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

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
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    }),
    [commandPaletteOpen, toggleCommandPalette, drawerOpen, selectedEntity, openDrawer, closeDrawer, sidebarCollapsed, toggleSidebar]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error('useUi must be used within a UiProvider');
  }
  return context;
}
