import React from 'react';
import Link from 'next/link';
import { Metric } from '@/components/Metric';
import { EmptyState } from '@/components/EmptyState';

export const metadata = {
  title: 'Farm Accounts | TikBot',
  description: 'Farm accounts, binding matrix, aging tiers, and creation pipeline',
};

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    tier?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function FarmAccountsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTab = params.tab || 'grid';
  const tierFilter = params.tier || 'ALL';

  const tabs = [
    { id: 'grid', label: 'Grid' },
    { id: 'tiers', label: 'Tiers' },
    { id: 'queue', label: 'Creation Queue' },
    { id: 'bindings', label: 'Bindings Matrix' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Farm Accounts
          </h1>
          <p className="text-sm text-slate-400">
            Manage device personas, identity bindings, aging progression, and creation pipelines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/accounts"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            &larr; Standard Fleet
          </Link>
          <Link
            href="/dashboard/farm/services?tab=launch"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Launch Boost Run
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <nav
          className="flex space-x-6"
          role="tablist"
          aria-label="Farm Accounts Navigation"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/dashboard/farm/accounts?tab=${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === 'grid' && (
        <div id="tabpanel-grid" role="tabpanel" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter Tier:</span>
              {['ALL', 'FRESH', 'JUNIOR', 'MATURE', 'PRIME'].map((t) => (
                <Link
                  key={t}
                  href={`/dashboard/farm/accounts?tab=grid&tier=${t}`}
                  className={`text-xs px-2.5 py-1 rounded font-medium ${
                    tierFilter === t
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {t}
                </Link>
              ))}
            </div>
            <Metric label="Active Farmers" value="0" provenance="live" />
          </div>

          <EmptyState
            title="No Farm Accounts In This Tier"
            description="Use the creation pipeline queue to provision and warmup new account personas."
            actionLabel="Start Creation Pipeline"
            actionHref="/dashboard/farm/accounts?tab=queue"
          />
        </div>
      )}

      {activeTab === 'tiers' && (
        <div id="tabpanel-tiers" role="tabpanel" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">FRESH (0-3d)</span>
              <p className="text-xs text-slate-400">Passive feed warmup, scroll & dwell only. All active farm handlers strictly gated.</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">JUNIOR (3-14d)</span>
              <p className="text-xs text-slate-400">Light engagement: views, organic likes, and up to 3 follows daily.</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">MATURE (14-45d)</span>
              <p className="text-xs text-slate-400">Full interaction: comments with unique vocabulary, shares, saves.</p>
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">PRIME (45d+)</span>
              <p className="text-xs text-slate-400">Eligible for FYP_PUSH campaigns and high-weight organic signals.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div id="tabpanel-queue" role="tabpanel" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">Creation Pipeline Queue</h2>
            <Metric label="Queue Status" value="Idle" provenance="live" />
          </div>
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
            <p className="text-sm text-slate-400">No creation jobs currently running. Cadence governor active.</p>
          </div>
        </div>
      )}

      {activeTab === 'bindings' && (
        <div id="tabpanel-bindings" role="tabpanel" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">Binding Matrix & Subnet Heat Map</h2>
            <Metric label="Subnet Collisions" value="0" provenance="live" />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3">Account</th>
                  <th scope="col" className="px-4 py-3">Proxy Subnet</th>
                  <th scope="col" className="px-4 py-3">Persona Engine</th>
                  <th scope="col" className="px-4 py-3">Verification Asset</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No bindings registered. Personas are automatically linked upon creation.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
