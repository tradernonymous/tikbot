'use client';

import React from 'react';
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

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Research Intelligence', href: '/dashboard/research', icon: Search },
  { name: 'Farm Accounts', href: '/dashboard/accounts', icon: Users },
  { name: 'Engagement Campaigns', href: '/dashboard/campaigns', icon: Flame },
  { name: 'Content & Publishing', href: '/dashboard/publishing', icon: Calendar },
  { name: 'Farm Services & Launch', href: '/dashboard/panel', icon: Layers },
  { name: 'Compliance & Audit', href: '/dashboard/compliance', icon: ShieldCheck },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
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
