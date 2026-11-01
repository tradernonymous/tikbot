'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { broadcastSyncEvent, subscribeSyncEvents } from '@/sync/client-event-bus';

export type DateRange = '7d' | '30d' | '90d' | 'all';

export interface SessionState {
  selectedAccountId: string | null;
  selectedCampaignId: string | null;
  dateRange: DateRange;
  carriedSource: string | null;
  carriedMetadata: Record<string, any> | null;
}

export interface SessionContextType extends SessionState {
  setSelectedAccountId: (id: string | null) => void;
  setSelectedCampaignId: (id: string | null) => void;
  setDateRange: (range: DateRange) => void;
  setCarriedContext: (source: string, metadata?: Record<string, any>) => void;
  clearCarriedContext: () => void;
  clearAllContext: () => void;
}

const STORAGE_KEY = 'tikbot_carried_session_context';

const defaultState: SessionState = {
  selectedAccountId: null,
  selectedCampaignId: null,
  dateRange: '30d',
  carriedSource: null,
  carriedMetadata: null,
};

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionContextProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<SessionState>;
}) {
  const [state, setState] = useState<SessionState>(() => {
    if (initialState) {
      return { ...defaultState, ...initialState };
    }
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return { ...defaultState, ...JSON.parse(saved) };
        }
      } catch {}
    }
    return defaultState;
  });

  // Persist state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {}
    }
  }, [state]);

  // Listen for sync events from sister tabs
  useEffect(() => {
    const unsub = subscribeSyncEvents((event) => {
      if (event.type === 'CONTEXT_CHANGED' && event.payload) {
        setState((prev) => ({ ...prev, ...event.payload }));
      }
    });
    return unsub;
  }, []);

  const setSelectedAccountId = (id: string | null) => {
    setState((prev) => {
      const next = { ...prev, selectedAccountId: id };
      broadcastSyncEvent({ type: 'CONTEXT_CHANGED', payload: { selectedAccountId: id } });
      return next;
    });
  };

  const setSelectedCampaignId = (id: string | null) => {
    setState((prev) => {
      const next = { ...prev, selectedCampaignId: id };
      broadcastSyncEvent({ type: 'CONTEXT_CHANGED', payload: { selectedCampaignId: id } });
      return next;
    });
  };

  const setDateRange = (dateRange: DateRange) => {
    setState((prev) => {
      const next = { ...prev, dateRange };
      broadcastSyncEvent({ type: 'CONTEXT_CHANGED', payload: { dateRange } });
      return next;
    });
  };

  const setCarriedContext = (source: string, metadata: Record<string, any> = {}) => {
    setState((prev) => {
      const next = { ...prev, carriedSource: source, carriedMetadata: metadata };
      broadcastSyncEvent({
        type: 'CONTEXT_CHANGED',
        payload: { carriedSource: source, carriedMetadata: metadata },
      });
      return next;
    });
  };

  const clearCarriedContext = () => {
    setState((prev) => {
      const next = { ...prev, carriedSource: null, carriedMetadata: null };
      broadcastSyncEvent({
        type: 'CONTEXT_CHANGED',
        payload: { carriedSource: null, carriedMetadata: null },
      });
      return next;
    });
  };

  const clearAllContext = () => {
    setState(() => {
      broadcastSyncEvent({ type: 'CONTEXT_CHANGED', payload: defaultState });
      return defaultState;
    });
  };

  return (
    <SessionContext.Provider
      value={{
        ...state,
        setSelectedAccountId,
        setSelectedCampaignId,
        setDateRange,
        setCarriedContext,
        clearCarriedContext,
        clearAllContext,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext(): SessionContextType {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    return {
      ...defaultState,
      setSelectedAccountId: () => {},
      setSelectedCampaignId: () => {},
      setDateRange: () => {},
      setCarriedContext: () => {},
      clearCarriedContext: () => {},
      clearAllContext: () => {},
    };
  }
  return ctx;
}
