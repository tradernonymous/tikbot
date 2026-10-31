'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Power,
  CheckCircle,
  RefreshCw,
  Search,
  Bell,
  Plus,
  Radio,
  Flame,
  Calendar,
  Layers,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopNavbar() {
  const pathname = usePathname();
  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showQuickActions, setShowQuickActions] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowQuickActions(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetch('/api/v1/system/kill-switch')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.active === 'boolean') {
          setKillSwitchActive(data.active);
        }
      })
      .catch(() => {});
  }, []);

  async function toggleKillSwitch() {
    const nextState = !killSwitchActive;
    const reason = nextState
      ? 'Manual Operator Emergency Kill-Switch Activation from Navbar'
      : 'Operator Resumed Normal Operations from Navbar';

    if (nextState) {
      const confirmed = window.confirm(
        'EMERGENCY WARNING: Activating the Kill Switch will immediately abort all running browser sessions, pause active campaigns, and stop queue consumption. Proceed?'
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/system/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextState, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setKillSwitchActive(data.active);
      }
    } catch (err) {
      console.error('Failed to toggle kill switch', err);
    } finally {
      setLoading(false);
    }
  }

  const getBreadcrumb = () => {
    if (pathname.includes('/research')) return 'Research Intelligence';
    if (pathname.includes('/accounts')) return 'Farm Accounts';
    if (pathname.includes('/campaigns')) return 'Engagement Campaigns';
    if (pathname.includes('/publishing')) return 'Content & Publishing';
    if (pathname.includes('/panel')) return 'Farm Services & Launch';
    if (pathname.includes('/compliance')) return 'Compliance & Audit';
    if (pathname.includes('/settings')) return 'System Settings';
    return 'Operations Overview';
  };

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Left Section: Breadcrumb & Safe Mode Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Dashboard</span>
            <span className="text-slate-400">/</span>
            <span className="text-white font-semibold">{getBreadcrumb()}</span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {killSwitchActive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>KILL SWITCH ACTIVE</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>STRICT COMPLIANCE</span>
            </div>
          )}
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 text-xs hover:border-slate-700 hover:text-slate-200 transition-all w-64 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search accounts, jobs...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Section: Actions & Kill Switch */}
        <div className="flex items-center gap-3">
          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickActions((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quick Action</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {showQuickActions && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 space-y-0.5 z-50 text-xs">
                <Link
                  href="/dashboard/panel"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Launch Farm Service</span>
                </Link>
                <Link
                  href="/dashboard/campaigns"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Boost Campaign</span>
                </Link>
                <Link
                  href="/dashboard/publishing"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Schedule Post</span>
                </Link>
                <Link
                  href="/dashboard/research"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Analyze TikTok Video</span>
                </Link>
              </div>
            )}
          </div>

          {/* Activity / Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((p) => !p)}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all relative"
              title="Recent Activity"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1.5 right-1.5" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="font-semibold text-white">Live Worker Activity</span>
                  <span className="text-[10px] text-cyan-400 font-mono">AUTO-STREAM</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/60 text-[11px]">
                    <div className="flex items-center justify-between text-cyan-400 font-mono mb-0.5">
                      <span>VIEW_SESSION</span>
                      <span className="text-slate-400">Just now</span>
                    </div>
                    <p className="text-slate-300">Node acc_farm_03 completed 100% video retention session.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/60 text-[11px]">
                    <div className="flex items-center justify-between text-emerald-400 font-mono mb-0.5">
                      <span>STICKY_PROXY</span>
                      <span className="text-slate-400">2m ago</span>
                    </div>
                    <p className="text-slate-300">Health probe passed on US residential gateway (142ms).</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Master Emergency Kill Switch */}
          <button
            onClick={toggleKillSwitch}
            disabled={loading}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              killSwitchActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
            title="Emergency Global Automation Kill Switch"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Power className={`w-3.5 h-3.5 ${killSwitchActive ? 'text-white' : 'text-rose-400'}`} />
            )}
            <span className="hidden sm:inline">
              {killSwitchActive ? 'Resume Operations' : 'Emergency Kill Switch'}
            </span>
          </button>
        </div>
      </header>

      {/* Global Command Palette Modal (Cmd+K) */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Search className="w-4 h-4 text-cyan-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or jump to feature (e.g., 'research', 'accounts', 'boost', 'settings')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white text-xs placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <Link
                href="/dashboard/panel"
                onClick={() => setShowSearchModal(false)}
                className="flex items-center justify-between p-2 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Launch Farm Automation Services</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/dashboard/panel</span>
              </Link>
              <Link
                href="/dashboard/research"
                onClick={() => setShowSearchModal(false)}
                className="flex items-center justify-between p-2 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Analyze TikTok / Douyin Video</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/dashboard/research</span>
              </Link>
              <Link
                href="/dashboard/accounts"
                onClick={() => setShowSearchModal(false)}
                className="flex items-center justify-between p-2 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Inspect Account Fingerprints & Proxies</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/dashboard/accounts</span>
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setShowSearchModal(false)}
                className="flex items-center justify-between p-2 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>System Settings & Velocity Caps</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/dashboard/settings</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
