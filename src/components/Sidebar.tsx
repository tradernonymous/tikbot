'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Users,
  Flame,
  Calendar,
  Layers,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useOperations } from '@/context/OperationsContext';

export interface SidebarCounts {
  total: number;
  approvals: number;
  incidents: number;
  research: number;
  system: number;
}

export function Sidebar({ serverCounts }: { serverCounts?: SidebarCounts }) {
  const pathname = usePathname();
  const { campaigns, farmTasks, publishJobs, accounts, researchedPosts } = useOperations();
  const [counts, setCounts] = useState<SidebarCounts>(
    serverCounts || {
      total: 0,
      approvals: 0,
      incidents: 0,
      research: 0,
      system: 0,
    }
  );

  useEffect(() => {
    if (serverCounts) {
      setCounts(serverCounts);
      return;
    }
    const fetchCounts = () => {
      fetch('/api/v1/notifications/counts')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.counts) {
            setCounts(data.counts);
          }
        })
        .catch(() => {});
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [serverCounts]);

  const runningTasks = farmTasks.filter((t) => t.status === 'RUNNING').length;
  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE').length;

  const navigation = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: counts.total > 0 ? `${counts.total} alerts` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      name: 'Research Intelligence',
      href: '/dashboard/research',
      icon: Search,
      badge: counts.research > 0 ? `${counts.research} alerts` : undefined,
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      name: 'Farm Accounts',
      href: '/dashboard/accounts',
      icon: Users,
      badge: `${activeAccounts} live`,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      name: 'Engagement Campaigns',
      href: '/dashboard/campaigns',
      icon: Flame,
      badge: counts.approvals > 0 ? `${counts.approvals} pending` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      name: 'Content & Publishing',
      href: '/dashboard/publishing',
      icon: Calendar,
      badge: publishJobs.length > 0 ? `${publishJobs.length} slots` : undefined,
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    },
    {
      name: 'Farm Services & Launch',
      href: '/dashboard/panel',
      icon: Layers,
      badge: runningTasks > 0 ? `${runningTasks} active` : 'Ready',
      badgeColor: runningTasks > 0 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700',
    },
    {
      name: 'Compliance & Audit',
      href: '/dashboard/compliance',
      icon: ShieldCheck,
      badge: counts.incidents > 0 ? `${counts.incidents} alerts` : 'Strict',
      badgeColor: counts.incidents > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/70 flex flex-col shrink-0 min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
          TB
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white">tikbot</h1>
          <p className="text-[10px] text-cyan-400 font-mono">v1.0.0-operator</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 space-y-2">
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Operator</span>
            <span className="text-emerald-400 font-mono text-[10px]">AUTH_OK</span>
          </div>
          <p className="text-xs font-medium text-slate-200 truncate">admin@tikbot.local</p>
        </div>

        <button
          onClick={async () => {
            await fetch('/api/v1/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors text-center"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
