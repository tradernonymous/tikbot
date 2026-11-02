'use client';

import React, { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { AccessibleModal } from '@/components/AccessibleModal';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EntityDrawer } from '@/components/EntityDrawer';
import { useOperations, FarmAccount, StickyProxy } from '@/context/OperationsContext';
import { generateDeviceFingerprint } from '@/farm/fingerprint';
import { AccountState } from '@/farm/account-lifecycle';
import { WarmupEngine } from '@/farm/warmup-routine';
import {
  Users,
  Plus,
  Shield,
  CheckCircle,
  RefreshCw,
  Cpu,
  Monitor,
  Globe,
  Lock,
  X,
  Play,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Activity,
  Zap,
  Trash2,
  Key,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AccountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = searchParams ? searchParams.get('focus') : null;
  const {
    accounts,
    proxies,
    addAccount,
    updateAccountCookies,
    removeAccount,
    advanceWarmupDay,
    transitionAccountStatus,
    bindProxyToAccount,
    testProxyLatency,
  } = useOperations();

  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'PROXIES'>('ACCOUNTS');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [inspectedAccount, setInspectedAccount] = useState<any | null>(null);
  const [drawerAccount, setDrawerAccount] = useState<FarmAccount | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPlatform, setNewPlatform] = useState<'TIKTOK' | 'DOUYIN'>('TIKTOK');
  const [newCookiesJson, setNewCookiesJson] = useState<string>('');
  const [sessionModalAccount, setSessionModalAccount] = useState<FarmAccount | null>(null);
  const [sessionInput, setSessionInput] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (focusId) {
      const target = accounts.find((a) => a.id === focusId);
      if (target) {
        setDrawerAccount(target);
      }
    }
  }, [focusId, accounts]);

  const handleCloseDrawer = () => {
    setDrawerAccount(null);
    if (searchParams && searchParams.has('focus')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('focus');
      const remaining = params.toString();
      router.replace(remaining ? `?${remaining}` : window.location.pathname, { scroll: false });
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (selectedStatus === 'ALL') return true;
    return acc.status === selectedStatus;
  });

  const handleInspect = (account: FarmAccount) => {
    const fingerprint = generateDeviceFingerprint(
      'DESKTOP',
      parseInt(account.id.replace(/\D/g, '') || '1', 10)
    );
    const proxy = proxies.find((p) => p.id === account.proxyId);
    const warmupEngine = new WarmupEngine(account.id, account.warmupDay);
    const warmupPlan = warmupEngine.getCurrentDayPlan();

    setInspectedAccount({
      ...account,
      fingerprint,
      proxy,
      warmupPlan,
    });
  };

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return;

    addAccount(newUsername, newPlatform, newCookiesJson);
    setSuccessToast(
      `Account @${newUsername.replace('@', '')} registered (${newCookiesJson.trim() ? 'Cookies Attached' : 'Awaiting Session'}) & queued for Warmup Day 1.`
    );
    setShowAddModal(false);
    setNewUsername('');
    setNewCookiesJson('');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSaveCookiesModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionModalAccount) return;

    updateAccountCookies(sessionModalAccount.id, sessionInput);
    setSuccessToast(`Authenticated cookies encrypted & attached to @${sessionModalAccount.username}.`);
    setSessionModalAccount(null);
    setSessionInput('');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleRemoveAccount = (account: FarmAccount) => {
    const confirmed = window.confirm(`Are you sure you want to remove @${account.username} from the farm identity pool?`);
    if (confirmed) {
      removeAccount(account.id);
      setSuccessToast(`Account @${account.username} removed from farm fleet.`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  return (
    <SectionErrorBoundary sectionName="Farm Accounts & Proxies">
      <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Managed Farm Accounts & Proxies</h2>
          <p className="text-xs text-slate-400 mt-1">
            Accounts pool lifecycle, deterministic device fingerprints, sticky residential proxies, and 7-day warmup routines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* v3-F Farm Accounts Engine Cross-Link Banner */}
      <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-indigo-300">
          <span className="font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">v3-F Feature</span>
          <span>Looking for the new Device Persona Factory, Aging Tiers, and Subnet Matrix?</span>
        </div>
        <Link
          href="/dashboard/farm/accounts"
          className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 hover:underline shrink-0"
        >
          Open Farm Accounts Engine &rarr;
        </Link>
      </div>

      {/* Main Tabs (Accounts vs Proxies) */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('ACCOUNTS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'ACCOUNTS'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Farm Identities ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('PROXIES')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'PROXIES'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Sticky Proxy Pool ({proxies.length})</span>
        </button>
      </div>

      {/* Tab 1: Accounts Fleet */}
      {activeTab === 'ACCOUNTS' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {['ALL', 'ACTIVE', 'WARMING', 'COOLDOWN', 'RESTRICTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    selectedStatus === st
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {filteredAccounts.length} IDENTITIES DISPLAYED
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Accounts Match Filter"
                  description="No account nodes match the selected filter. Try changing status or register a new identity node."
                  actionText="Register Node"
                  onAction={() => setShowAddModal(true)}
                />
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
                  <tr className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px]">
                    <th className="py-3 px-4 font-medium">Handle / Username</th>
                    <th className="py-3 px-4 font-medium">Platform</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Warmup</th>
                    <th className="py-3 px-4 font-medium">Health</th>
                    <th className="py-3 px-4 font-medium">Sticky Proxy</th>
                    <th className="py-3 px-4 font-medium">Velocity Today</th>
                    <th className="py-3 px-4 font-medium text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredAccounts.map((acc) => {
                  const proxy = proxies.find((p) => p.id === acc.proxyId);
                  const isFocused = acc.id === focusId;
                  return (
                    <tr
                      key={acc.id}
                      onClick={() => {
                        setDrawerAccount(acc);
                        router.replace(`?focus=${acc.id}`, { scroll: false });
                      }}
                      className={`hover:bg-slate-800/20 transition-colors cursor-pointer ${
                        isFocused ? 'bg-cyan-950/40 ring-1 ring-cyan-500' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 font-bold shrink-0">
                            {acc.username[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold">@{acc.username}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {acc.hasCookies ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 font-mono">
                                  AUTH COOKIES
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-500 border border-slate-800 font-mono">
                                  NO SESSION
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{acc.platform}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={acc.status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {acc.status === 'WARMING' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-400">Day {acc.warmupDay}/7</span>
                            <button
                              onClick={() => advanceWarmupDay(acc.id)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] transition-colors"
                              title="Advance to next warmup schedule day"
                            >
                              +Day
                            </button>
                          </div>
                        ) : acc.status === 'ACTIVE' ? (
                          <span className="text-emerald-400">Graduated</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-emerald-400">
                          {acc.healthScore}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                        {proxy ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">
                              {proxy.country}
                            </span>
                            <span>{proxy.host}:{proxy.port}</span>
                          </div>
                        ) : (
                          <span className="text-amber-400">UNBOUND</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-300">
                        {acc.actionsToday} / {acc.dailyCap}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionModalAccount(acc);
                              setSessionInput('');
                            }}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-[11px] font-mono transition-colors"
                            title="Attach or edit authenticated session cookies"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspect(acc);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all"
                          >
                            Inspect Spec
                          </button>
                          {acc.status === 'ACTIVE' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                transitionAccountStatus(acc.id, 'COOLDOWN');
                              }}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-900/40 text-[10px] font-mono transition-colors"
                              title="Move to cooldown"
                            >
                              Cooldown
                            </button>
                          ) : acc.status === 'COOLDOWN' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                transitionAccountStatus(acc.id, 'ACTIVE');
                              }}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-900/40 text-[10px] font-mono transition-colors"
                              title="Reactivate node"
                            >
                              Reactivate
                            </button>
                          ) : null}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAccount(acc);
                            }}
                            className="p-1.5 rounded bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 border border-slate-800 text-[11px] transition-colors"
                            title="Remove account from farm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Sticky Proxy Pool */}
      {activeTab === 'PROXIES' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Residential Sticky Gateways</span>
            <span className="text-xs text-slate-400 font-mono">1:1 IDENTITY BINDING ENFORCED</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {proxies.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Proxies Configured"
                  description="No residential sticky proxy gateways are currently registered in the pool."
                />
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
                  <tr className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px]">
                    <th className="py-3 px-4 font-medium">Gateway Host</th>
                    <th className="py-3 px-4 font-medium">Protocol</th>
                    <th className="py-3 px-4 font-medium">Country / Geo</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Latency</th>
                    <th className="py-3 px-4 font-medium">Assigned Accounts</th>
                    <th className="py-3 px-4 font-medium text-right">Ping Probe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {proxies.map((proxy) => {
                    const assignedCount = accounts.filter((a) => a.proxyId === proxy.id).length;
                    return (
                      <tr key={proxy.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-white">
                          {proxy.host}:{proxy.port}
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-400">{proxy.protocol}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 font-bold mr-1.5 text-white">
                            {proxy.country}
                          </span>
                          {proxy.country === 'US' ? 'United States' : proxy.country === 'GB' ? 'United Kingdom' : 'Germany'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                              proxy.status === 'HEALTHY'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {proxy.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-300">
                          {proxy.latencyMs} ms
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-cyan-400">
                          {assignedCount} identities
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => testProxyLatency(proxy.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-[11px] font-mono transition-colors"
                          >
                            Ping &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Comprehensive Hardware & Fingerprint Spec Modal */}
      <AccessibleModal
        isOpen={!!inspectedAccount}
        onClose={() => setInspectedAccount(null)}
        title="Identity Spec & 7-Day Warmup"
        maxWidth="max-w-xl"
      >
        {inspectedAccount && (
          <div className="space-y-4">
            <p className="text-[11px] text-slate-400 font-mono -mt-2">
              @{inspectedAccount.username} • {inspectedAccount.id}
            </p>

            <div className="space-y-3 text-xs">
              {/* 7-Day Warmup Progress Card */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>7-Day Warmup Routine: Day {inspectedAccount.warmupDay} of 7</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {inspectedAccount.warmupPlan?.graduated ? 'GRADUATED' : 'IN PROGRESS'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px] pt-1">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">VIEWS</span>
                    <span className="text-white font-bold">{inspectedAccount.warmupPlan?.targetViews}</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">LIKES</span>
                    <span className="text-emerald-400 font-bold">{inspectedAccount.warmupPlan?.targetLikes}</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">FOLLOWS</span>
                    <span className="text-cyan-400 font-bold">{inspectedAccount.warmupPlan?.targetFollows}</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">COMMENTS</span>
                    <span className="text-purple-400 font-bold">{inspectedAccount.warmupPlan?.targetComments}</span>
                  </div>
                </div>

                {!inspectedAccount.warmupPlan?.graduated && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        advanceWarmupDay(inspectedAccount.id);
                        setInspectedAccount(null);
                      }}
                      className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold transition-all flex items-center gap-1"
                    >
                      <span>Complete Day {inspectedAccount.warmupDay} & Advance</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hardware Spec */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">USER AGENT</span>
                  <p className="font-mono text-slate-300 text-[11px] break-all">
                    {inspectedAccount.fingerprint?.userAgent}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">WEBGL RENDERER</span>
                  <p className="font-mono text-cyan-400 text-[11px]">
                    {inspectedAccount.fingerprint?.webglRenderer}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-400 block">VIEWPORT</span>
                    <span className="text-white">
                      {inspectedAccount.fingerprint?.viewport?.width} x {inspectedAccount.fingerprint?.viewport?.height}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">CANVAS NOISE SEED</span>
                    <span className="text-emerald-400">{inspectedAccount.fingerprint?.canvasNoiseSeed}</span>
                  </div>
                </div>
              </div>

              {/* Encryption & Proxy Route */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block">STICKY PROXY ROUTE:</span>
                  <span className="text-cyan-400">
                    {inspectedAccount.proxy
                      ? `${inspectedAccount.proxy.host}:${inspectedAccount.proxy.port} (${inspectedAccount.proxy.country})`
                      : 'Unbound'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">SESSION VAULT:</span>
                  <span className={inspectedAccount.hasCookies ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {inspectedAccount.hasCookies ? 'AES-256 ENCRYPTED (ACTIVE)' : 'NO COOKIES (GUEST ONLY)'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Authenticated Session:</span>
                <button
                  onClick={() => {
                    setSessionModalAccount(inspectedAccount);
                    setSessionInput('');
                    setInspectedAccount(null);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-[11px] font-mono flex items-center gap-1 transition-colors"
                >
                  <Key className="w-3 h-3" />
                  <span>{inspectedAccount.hasCookies ? 'Update Cookies' : 'Attach Cookies'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                onClick={() => {
                  router.push(`/dashboard/panel?targetUrl=https://www.tiktok.com/@${inspectedAccount.username}`);
                  setInspectedAccount(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Launch Farm Service for Node &rarr;</span>
              </button>
              <button
                onClick={() => setInspectedAccount(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close Spec
              </button>
            </div>
          </div>
        )}
      </AccessibleModal>

      {/* Attach / Edit Session Modal */}
      <AccessibleModal
        isOpen={!!sessionModalAccount}
        onClose={() => setSessionModalAccount(null)}
        title={`Attach Session Cookies to @${sessionModalAccount?.username || ''}`}
        maxWidth="max-w-lg"
      >
        {sessionModalAccount && (
          <div>
            <p className="text-[11px] text-slate-400 -mt-2 mb-4">
              Enables authenticated actions and bypassing age-gated posts
            </p>
            <form onSubmit={handleSaveCookiesModal} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Session Cookies JSON (from EditThisCookie, Cookie-Editor, or DevTools)
                </label>
                <textarea
                  rows={6}
                  placeholder={`[{"name":"sessionid","value":"...","domain":".tiktok.com"},...]`}
                  value={sessionInput}
                  onChange={(e) => setSessionInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Cookies are stored encrypted using AES-256-GCM. Paste valid JSON array containing <code className="text-cyan-400">sessionid</code> or <code className="text-cyan-400">sid_tt</code>.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSessionModalAccount(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Encrypt & Save Session</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </AccessibleModal>

      {/* Add Account Modal */}
      <AccessibleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Farm Account"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddAccountSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">Account Handle / Username</label>
            <input
              type="text"
              required
              placeholder="@username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Platform</label>
            <select
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="TIKTOK">TikTok Global</option>
              <option value="DOUYIN">Douyin (China)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Session Cookies JSON (Optional)</label>
            <textarea
              rows={3}
              placeholder={`[{"name":"sessionid","value":"..."},...] (Leave empty for unauthenticated identity)`}
              value={newCookiesJson}
              onChange={(e) => setNewCookiesJson(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Initial Status:</span>
              <span className="text-amber-400">CREATED (Needs Warmup)</span>
            </div>
            <div className="flex justify-between">
              <span>Proxy Assignment:</span>
              <span className="text-cyan-400">Auto-Bind Sticky Residential</span>
            </div>
            <div className="flex justify-between">
              <span>Session Encryption:</span>
              <span className="text-emerald-400">AES-256-GCM Vault</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Identity</span>
            </button>
          </div>
        </form>
      </AccessibleModal>

      <EntityDrawer
        isOpen={Boolean(drawerAccount)}
        onClose={handleCloseDrawer}
        entityType="account"
        data={drawerAccount}
      />
    </div>
  </SectionErrorBoundary>
  );
}