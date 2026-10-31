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
  Users,
  Shield,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useOperations } from '@/context/OperationsContext';
import { NotificationCenter } from '@/components/NotificationCenter';

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    killSwitchActive,
    toggleKillSwitch,
    notifications,
    clearNotifications,
    accounts,
    campaigns,
    researchedPosts,
  } = useOperations();

  const [loading, setLoading] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showQuickActions, setShowQuickActions] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = () => {
      fetch('/api/v1/notifications/counts')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.counts) {
            setUnreadCount(data.counts.total);
          }
        })
        .catch(() => {});
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

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

  async function handleToggleKillSwitch() {
    if (!killSwitchActive) {
      const confirmed = window.confirm(
        'EMERGENCY WARNING: Activating the Kill Switch will immediately pause all running campaigns, halt farm task progress, and freeze queue consumption. Proceed?'
      );
      if (!confirmed) return;
    }
    setLoading(true);
    try {
      await toggleKillSwitch();
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

  // Filter items in command palette
  const filteredAccounts = accounts.filter(
    (a) =>
      a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.actionType.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPosts = researchedPosts.filter(
    (p) =>
      p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorHandle.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 space-y-0.5 z-50 text-xs">
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
                <Link
                  href="/dashboard/accounts"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800/80 transition-colors border-t border-slate-800/60 pt-2"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Manage Farm Accounts</span>
                </Link>
              </div>
            )}
          </div>

          {/* Activity / Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((p) => !p)}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all relative"
              title="Notifications"
              aria-label="Notification Center"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span
                  aria-live="polite"
                  className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1.5 right-1.5"
                />
              )}
            </button>

            <NotificationCenter
              isOpen={showNotifications}
              onClose={() => {
                setShowNotifications(false);
                setUnreadCount(0);
              }}
            />
          </div>

          {/* Master Emergency Kill Switch */}
          <button
            onClick={handleToggleKillSwitch}
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
                placeholder="Search accounts (@user), campaigns, viral posts, or jump to tabs..."
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

            <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
              {/* Feature Shortcuts */}
              <div className="text-[10px] text-slate-500 font-mono uppercase px-2">Navigation Shortcuts</div>
              <div className="space-y-0.5">
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
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Farm Accounts Fleet & Proxies</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">/dashboard/accounts</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowSearchModal(false)}
                  className="flex items-center justify-between p-2 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>SMM Provider Settings & Balance</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">/dashboard/settings</span>
                </Link>
              </div>

              {/* Matched Accounts */}
              {searchQuery && filteredAccounts.length > 0 && (
                <>
                  <div className="text-[10px] text-slate-500 font-mono uppercase px-2 pt-2">Matching Accounts</div>
                  <div className="space-y-0.5">
                    {filteredAccounts.map((acc) => (
                      <Link
                        key={acc.id}
                        href="/dashboard/accounts"
                        onClick={() => setShowSearchModal(false)}
                        className="flex items-center justify-between p-2 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors"
                      >
                        <span className="flex items-center gap-2 font-mono text-cyan-400">
                          <span>@{acc.username}</span>
                          <span className="text-slate-400 text-[10px]">({acc.status})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Inspect &rarr;</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {/* Matched Campaigns */}
              {searchQuery && filteredCampaigns.length > 0 && (
                <>
                  <div className="text-[10px] text-slate-500 font-mono uppercase px-2 pt-2">Matching Campaigns</div>
                  <div className="space-y-0.5">
                    {filteredCampaigns.map((camp) => (
                      <Link
                        key={camp.id}
                        href="/dashboard/campaigns"
                        onClick={() => setShowSearchModal(false)}
                        className="flex items-center justify-between p-2 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors"
                      >
                        <span className="truncate max-w-[280px]">{camp.title}</span>
                        <span className="text-[10px] text-amber-400 font-mono uppercase">{camp.status}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
