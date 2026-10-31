import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  X,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export type NotificationTab = 'ALL' | 'APPROVAL' | 'INCIDENT' | 'RESEARCH' | 'SYSTEM';

export interface NotificationRecord {
  id: string;
  type: string;
  severity: string;
  title: string;
  body: string;
  href?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | Date | null;
  createdAt: string | Date;
}

export interface NotificationCounts {
  total: number;
  approvals: number;
  incidents: number;
  research: number;
  system: number;
}

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationRecord[];
  counts?: NotificationCounts;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications: initialNotifications,
  counts: initialCounts,
  onMarkRead,
  onMarkAllRead,
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>('ALL');
  const [items, setItems] = useState<NotificationRecord[]>(initialNotifications || []);
  const [counts, setCounts] = useState<NotificationCounts>(
    initialCounts || { total: 0, approvals: 0, incidents: 0, research: 0, system: 0 }
  );

  useEffect(() => {
    if (initialNotifications) {
      setItems(initialNotifications);
    }
  }, [initialNotifications]);

  useEffect(() => {
    if (initialCounts) {
      setCounts(initialCounts);
    }
  }, [initialCounts]);

  // Fetch when opened in dynamic mode
  useEffect(() => {
    if (!isOpen || initialNotifications) return;

    fetch(`/api/v1/notifications?filter=${activeTab}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.notifications)) {
          setItems(data.notifications);
        }
      })
      .catch(() => {});

    fetch('/api/v1/notifications/counts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.counts) {
          setCounts(data.counts);
        }
      })
      .catch(() => {});
  }, [isOpen, activeTab, initialNotifications]);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.type === activeTab;
  });

  const handleItemClick = async (notif: NotificationRecord) => {
    if (onMarkRead) {
      onMarkRead(notif.id);
    } else {
      await fetch(`/api/v1/notifications/${notif.id}/read`, { method: 'POST' }).catch(() => {});
    }
    setItems((prev) =>
      prev.map((i) => (i.id === notif.id ? { ...i, readAt: new Date().toISOString() } : i))
    );
    setCounts((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    onClose();
  };

  const handleReadAll = async () => {
    if (onMarkAllRead) {
      onMarkAllRead();
    } else {
      await fetch('/api/v1/notifications/read-all', { method: 'POST' }).catch(() => {});
    }
    setItems((prev) => prev.map((i) => ({ ...i, readAt: new Date().toISOString() })));
    setCounts({ total: 0, approvals: 0, incidents: 0, research: 0, system: 0 });
  };

  return (
    <div
      role="dialog"
      aria-label="Notification Center"
      className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col font-sans"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Notification Center</h3>
          <span
            aria-live="polite"
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold"
          >
            {counts.total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {counts.total > 0 && (
            <button
              onClick={handleReadAll}
              className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 font-medium"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close notifications panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 bg-slate-950/40 text-[11px] overflow-x-auto scrollbar-none font-medium">
        {(
          [
            { key: 'ALL', label: 'All', count: counts.total },
            { key: 'APPROVAL', label: 'Approvals', count: counts.approvals },
            { key: 'INCIDENT', label: 'Incidents', count: counts.incidents },
            { key: 'RESEARCH', label: 'Research', count: counts.research },
            { key: 'SYSTEM', label: 'System', count: counts.system },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 flex items-center gap-1.5 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-cyan-400 text-cyan-400 font-semibold bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Item List */}
      <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-mono">
            No notifications in this view
          </div>
        ) : (
          filteredItems.map((notif) => {
            const isUnread = !notif.readAt;
            const content = (
              <div
                className={`p-3 text-xs transition-colors hover:bg-slate-800/50 cursor-pointer ${
                  isUnread ? 'bg-cyan-950/15' : 'bg-transparent'
                }`}
                onClick={() => handleItemClick(notif)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {notif.severity === 'CRITICAL' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : notif.severity === 'WARNING' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : notif.severity === 'SUCCESS' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                    <span
                      className={`font-semibold tracking-tight ${
                        isUnread ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {notif.title}
                    </span>
                  </div>
                  {isUnread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1" />
                  )}
                </div>

                <p className="mt-1 text-[11px] text-slate-400 leading-relaxed pl-5">
                  {notif.body}
                </p>

                {notif.href && (
                  <div className="mt-2 pl-5 flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold">
                    <span>View Record &rarr;</span>
                  </div>
                )}
              </div>
            );

            return notif.href ? (
              <Link key={notif.id} href={notif.href} onClick={() => handleItemClick(notif)}>
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
