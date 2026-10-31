import React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { getDevFixtures } from '@/fixtures';
import { Users, Plus, Shield, CheckCircle, RefreshCw } from 'lucide-react';

export default function AccountsPage() {
  const fixtures = getDevFixtures();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Managed Platform Accounts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Accounts pool lifecycle, fingerprint pinning, sticky residential proxies, and velocity limit tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Account Pool Inventory</span>
          <span className="text-xs text-slate-400 font-mono">
            {fixtures.accounts.length} TOTAL MANAGED IDENTITIES
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
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {fixtures.accounts.map((acc) => {
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
                      <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all">
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
    </div>
  );
}
