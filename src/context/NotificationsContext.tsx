'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  href?: string;
  read?: boolean;
}

export interface NotificationCounts {
  total: number;
  approvals: number;
  incidents: number;
  research: number;
  system: number;
}

export interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  counts: NotificationCounts;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  clearNotifications: () => void;
  refreshNotifications: () => Promise<void>;
}

const defaultCounts: NotificationCounts = {
  total: 0,
  approvals: 0,
  incidents: 0,
  research: 0,
  system: 0,
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({
  children,
  initialUnreadCount = 0,
  initialNotifications = [],
}: {
  children: ReactNode;
  initialUnreadCount?: number;
  initialNotifications?: NotificationItem[];
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [counts, setCounts] = useState<NotificationCounts>({
    ...defaultCounts,
    total: initialUnreadCount,
  });

  const unreadCount = counts.total;

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/notifications/counts');
      if (res.ok) {
        const data = await res.json();
        if (data.counts && typeof data.counts.total === 'number') {
          setCounts({
            total: data.counts.total,
            approvals: data.counts.approvals || 0,
            incidents: data.counts.incidents || 0,
            research: data.counts.research || 0,
            system: data.counts.system || 0,
          });
        } else if (typeof data.unread === 'number') {
          setCounts((prev) => ({ ...prev, total: data.unread }));
        }
      }
    } catch {
      // Ignore background refresh failure
    }
  }, []);

  // Single-source the 15-second polling loop across all consumers (2.8, 3.1)
  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 15000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    let matchedType: string | undefined;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          matchedType = n.type;
          return { ...n, read: true };
        }
        return n;
      })
    );

    setCounts((prev) => {
      const nextTotal = Math.max(0, prev.total - 1);
      const isIncident = matchedType === 'CRITICAL' || matchedType === 'WARNING';
      return {
        ...prev,
        total: nextTotal,
        incidents: isIncident ? Math.max(0, prev.incidents - 1) : prev.incidents,
        approvals: matchedType === 'INFO' ? Math.max(0, prev.approvals - 1) : prev.approvals,
      };
    });

    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'POST' });
    } catch {
      // Optimistic update retained
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setCounts(defaultCounts);

    try {
      await fetch('/api/v1/notifications/read-all', { method: 'POST' });
    } catch {
      // Optimistic update retained
    }
  }, []);

  const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newItem, ...prev]);
    setCounts((prev) => ({ ...prev, total: prev.total + 1 }));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setCounts(defaultCounts);
  }, []);

  const value = useMemo<NotificationsContextType>(
    () => ({
      notifications,
      unreadCount,
      counts,
      markAsRead,
      markAllAsRead,
      addNotification,
      clearNotifications,
      refreshNotifications,
    }),
    [notifications, unreadCount, counts, markAsRead, markAllAsRead, addNotification, clearNotifications, refreshNotifications]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

const defaultNotificationsContext: NotificationsContextType = {
  notifications: [],
  unreadCount: 0,
  counts: defaultCounts,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  addNotification: () => {},
  clearNotifications: () => {},
  refreshNotifications: async () => {},
};

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    return defaultNotificationsContext;
  }
  return context;
}
