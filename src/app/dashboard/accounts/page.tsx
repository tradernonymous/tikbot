'use client';

import React, { useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { getDevFixtures } from '@/fixtures';
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
} from 'lucide-react';
import { generateDeviceFingerprint } from '@/farm/fingerprint';

export default function AccountsPage() {
  const fixtures = getDevFixtures();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [inspectedAccount, setInspectedAccount] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPlatform, setNewPlatform] = useState<'TIKTOK' | 'DOUYIN'>('TIKTOK');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const filteredAccounts = fixtures.accounts.filter((acc) => {
    if (selectedStatus === 'ALL') return true;
    return acc.status === selectedStatus;
  });

  const handleInspect = (account: any) => {
    const fingerprint = generateDeviceFingerprint('DESKTOP', parseInt(account.id.replace(/\D/g, '') || '1', 10));
    const proxy = fixtures.proxies.find((p) => p.id === account.proxyId);
    setInspectedAccount({
      ...account,
      fingerprint,
      proxy,
    });
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return;

    setSuccessToast(`Account @${newUsername.replace('@', '')} registered and bound to healthy proxy.`);
    setShowAddModal(false);
    setNewUsername('');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Managed Farm Accounts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Accounts pool lifecycle, deterministic device fingerprints, sticky residential proxies, and velocity limit tracking.
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

      {/* Filter Tabs & Table Container */}
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">Handle / Username</th>
                <th className="py-3 px-4 font-medium">Platform</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Health Score</th>
                <th className="py-3 px-4 font-medium">Sticky Proxy</th>
                <th className="py-3 px-4 font-medium">Velocity Today</th>
                <th className="py-3 px-4 font-medium text-right">Fingerprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredAccounts.map((acc) => {
                const proxy = fixtures.proxies.find((p) => p.id === acc.proxyId);
                return (
                  <tr key={acc.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 font-bold">
                          {acc.username[0].toUpperCase()}
                        </div>
                        <span>@{acc.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{acc.platform}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={acc.status} />
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
                      <button
                        onClick={() => handleInspect(acc)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Fingerprint Modal */}
      {inspectedAccount && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hardware & Fingerprint Spec</h3>
                  <p className="text-[11px] text-slate-400 font-mono">@{inspectedAccount.username} • {inspectedAccount.id}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedAccount(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
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

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block">STICKY PROXY ROUTE:</span>
                  <span className="text-cyan-400">
                    {inspectedAccount.proxy ? `${inspectedAccount.proxy.host}:${inspectedAccount.proxy.port} (${inspectedAccount.proxy.country})` : 'Unbound'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">ENCRYPTION VAULT:</span>
                  <span className="text-emerald-400 font-bold">AES-256-GCM SECURE</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-800">
              <button
                onClick={() => setInspectedAccount(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close Spec
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Add Farm Account</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4 text-xs">
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

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Initial Status:</span>
                  <span className="text-amber-400">CREATED (Needs Warmup)</span>
                </div>
                <div className="flex justify-between">
                  <span>Proxy Assignment:</span>
                  <span className="text-cyan-400">Auto-Bind Sticky Residential</span>
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
          </div>
        </div>
      )}
    </div>
  );
}
