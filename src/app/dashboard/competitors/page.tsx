'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Target,
  Flame,
  Lightbulb,
  Plus,
  Trash2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Metric } from '@/components/Metric';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, ColumnDef } from '@/components/DataTable';

export interface CompetitorTarget {
  id: string;
  targetHandle: string;
  platform: string;
  lastPolledAt?: string;
  creator?: {
    followerCount: number;
    medianViews: number;
    videoCount: number;
  };
}

export interface CompetitorOutlier {
  id: string;
  authorHandle: string;
  caption: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  outlierScore: number;
  medianBaseline?: number;
  hookType?: string;
  hookText?: string;
  whyItWorked?: {
    hookType: string;
    hookText: string;
    format: string;
    estimatedLengthSec: number;
    soundFactor: string;
  };
}

export interface CompetitorsPageProps {
  initialTargets?: CompetitorTarget[];
  initialOutliers?: CompetitorOutlier[];
}

export default function CompetitorsPage({
  initialTargets,
  initialOutliers,
}: CompetitorsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTab = searchParams ? searchParams.get('tab') : null;
  const urlHandle = searchParams ? searchParams.get('handle') : null;
  const urlSearch = searchParams ? searchParams.get('search') : null;

  const validTabs = ['WATCHLIST', 'OUTLIERS', 'WHY_IT_WORKED'] as const;
  type TabType = (typeof validTabs)[number];

  const resolvedTab: TabType =
    urlTab && validTabs.includes(urlTab.toUpperCase() as TabType)
      ? (urlTab.toUpperCase() as TabType)
      : 'WATCHLIST';

  const [activeTab, setActiveTab] = useState<TabType>(resolvedTab);
  const [selectedHandle, setSelectedHandle] = useState<string>(urlHandle || 'ALL');
  const [searchFilter, setSearchFilter] = useState<string>(urlSearch || '');
  const [targets, setTargets] = useState<CompetitorTarget[]>(initialTargets || []);
  const [outliers, setOutliers] = useState<CompetitorOutlier[]>(initialOutliers || []);
  const [loading, setLoading] = useState<boolean>(!initialTargets && !initialOutliers);
  const [newHandle, setNewHandle] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedOutlier, setSelectedOutlier] = useState<CompetitorOutlier | null>(
    initialOutliers && initialOutliers.length > 0 ? initialOutliers[0] : null
  );

  useEffect(() => {
    if (initialTargets && initialOutliers) return;

    let isMounted = true;
    setLoading(true);

    fetch('/api/v1/intelligence/competitors')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          if (Array.isArray(data.targets)) setTargets(data.targets);
          if (Array.isArray(data.outliers)) {
            setOutliers(data.outliers);
            if (data.outliers.length > 0 && !selectedOutlier) {
              setSelectedOutlier(data.outliers[0]);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialTargets, initialOutliers]);

  const updateUrl = (tab: TabType, handle: string, search: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('tab', tab.toLowerCase());
    if (handle !== 'ALL') {
      params.set('handle', handle);
    } else {
      params.delete('handle');
    }
    if (search.trim()) {
      params.set('search', search.trim());
    } else {
      params.delete('search');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    updateUrl(tab, selectedHandle, searchFilter);
  };

  const handleHandleFilterChange = (h: string) => {
    setSelectedHandle(h);
    updateUrl(activeTab, h, searchFilter);
  };

  const handleSearchChange = (q: string) => {
    setSearchFilter(q);
    updateUrl(activeTab, selectedHandle, q);
  };

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/v1/intelligence/competitors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'add', handle: newHandle.trim() }),
      });
      const data = await res.json();
      if (data.success && data.target) {
        setTargets((prev) => [data.target, ...prev]);
        setNewHandle('');
      }
    } catch {} finally {
      setIsAdding(false);
    }
  };

  const handleRemoveTarget = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/intelligence/competitors?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTargets((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {}
  };

  const handleIngest = async (handle: string) => {
    try {
      await fetch('/api/v1/intelligence/competitors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'ingest', handle }),
      });
    } catch {}
  };

  const filteredTargets = targets.filter((t) => {
    if (searchFilter && !t.targetHandle.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredOutliers = outliers.filter((o) => {
    if (selectedHandle !== 'ALL' && o.authorHandle !== selectedHandle) {
      return false;
    }
    if (searchFilter && !o.caption.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const targetColumns: ColumnDef<CompetitorTarget>[] = [
    {
      key: 'targetHandle',
      header: 'Competitor Handle',
      render: (item) => (
        <span className="font-semibold text-white text-xs">{`@${item.targetHandle}`}</span>
      ),
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (item) => (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300 uppercase">
          {item.platform}
        </span>
      ),
    },
    {
      key: 'followers',
      header: 'Followers',
      render: (item) => (
        <span className="text-xs font-mono text-slate-300">
          {item.creator?.followerCount
            ? item.creator.followerCount.toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'medianViews',
      header: 'Median Baseline Views',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Metric
            value={
              item.creator?.medianViews
                ? `${item.creator.medianViews.toLocaleString()} views`
                : '—'
            }
            provenance="live"
          />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedHandle(item.targetHandle);
              handleTabChange('OUTLIERS');
            }}
            className="px-2 py-1 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/40 text-xs font-medium"
          >
            View Outliers
          </button>
          <button
            type="button"
            onClick={() => handleIngest(item.targetHandle)}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
            title="Trigger RSSHub / Sidecar Sync"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleRemoveTarget(item.id)}
            className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
            title="Remove from watchlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <SectionErrorBoundary sectionName="Competitors Intelligence">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-rose-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">Competitor Intelligence</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Watchlist tracking, own-baseline outlier detection, and reverse-engineered success formulas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Provenance: LIVE (DB)
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-2">
          <nav className="flex space-x-1" aria-label="Competitor sub-tabs">
            <button
              onClick={() => handleTabChange('WATCHLIST')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'WATCHLIST'
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Watchlist</span>
            </button>
            <button
              onClick={() => handleTabChange('OUTLIERS')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'OUTLIERS'
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Outlier Feed</span>
            </button>
            <button
              onClick={() => handleTabChange('WHY_IT_WORKED')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'WHY_IT_WORKED'
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <span>Why It Worked</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search competitors..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Watchlist */}
        {activeTab === 'WATCHLIST' && (
          <div className="space-y-6">
            <form onSubmit={handleAddTarget} className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="Add competitor handle e.g. @rival_creator"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={isAdding}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Track</span>
              </button>
            </form>

            {filteredTargets.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No competitors being tracked"
                description="Add rival creator accounts to monitor their breakthrough outliers and dissect why their videos take off."
                actionLabel="Add Default Competitor"
                onAction={() => setNewHandle('viral_creator')}
              />
            ) : (
              <DataTable
                columns={targetColumns}
                data={filteredTargets}
                keyExtractor={(item) => item.id}
              />
            )}
          </div>
        )}

        {/* Tab 2: Outliers Feed */}
        {activeTab === 'OUTLIERS' && (
          filteredOutliers.length === 0 ? (
            <EmptyState
              icon={Flame}
              title="No competitor outliers found"
              description="No videos exceed the 1.5x baseline multiplier threshold for the tracked competitors."
              actionLabel="Manage Watchlist"
              onAction={() => handleTabChange('WATCHLIST')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOutliers.map((outlier) => (
                <div
                  key={outlier.id}
                  className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white text-xs">@{outlier.authorHandle}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-amber-500/10 text-amber-300 border-amber-500/30 font-bold">
                        {`${outlier.outlierScore.toFixed(1)}x Baseline`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3">&ldquo;{outlier.caption}&rdquo;</p>

                    <div className="mt-4 flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span>{outlier.viewCount.toLocaleString()} views</span>
                      <span>{outlier.likeCount.toLocaleString()} likes</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOutlier(outlier);
                        handleTabChange('WHY_IT_WORKED');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Why It Worked</span>
                    </button>

                    <Link
                      href={`/dashboard/composer?hook=${encodeURIComponent(outlier.hookText || outlier.caption)}`}
                      className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium"
                    >
                      <span>Adopt in Composer</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 3: Why It Worked */}
        {activeTab === 'WHY_IT_WORKED' && (
          selectedOutlier ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400">OUTLIER BREAKDOWN</span>
                  <h2 className="text-base font-bold text-white mt-1">@{selectedOutlier.authorHandle}</h2>
                  <p className="text-xs text-slate-300 mt-1 italic">&ldquo;{selectedOutlier.caption}&rdquo;</p>
                </div>
                <div className="flex items-center gap-2">
                  <Metric
                    label="Outlier Lift"
                    value={`${selectedOutlier.outlierScore.toFixed(1)}x`}
                    provenance="live"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">Opening Hook Structure</span>
                  <h4 className="text-xs font-semibold text-white">
                    {selectedOutlier.whyItWorked?.hookType || selectedOutlier.hookType || 'CONTRARIAN'}
                  </h4>
                  <p className="text-xs text-slate-300">
                    &ldquo;{selectedOutlier.whyItWorked?.hookText || selectedOutlier.hookText || 'Stop making this mistake'}&rdquo;
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold">Format &amp; Pacing</span>
                  <h4 className="text-xs font-semibold text-white">
                    {selectedOutlier.whyItWorked?.format || 'Fast-Paced POV'}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Estimated duration: {selectedOutlier.whyItWorked?.estimatedLengthSec || 22}s
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
                <Link
                  href={`/dashboard/composer?hook=${encodeURIComponent(selectedOutlier.hookText || selectedOutlier.caption)}`}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <span>Steal Hook Structure into Composer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Lightbulb}
              title="No outlier selected"
              description="Select a competitor outlier from the Outlier Feed to inspect its breakdown."
              actionLabel="Go to Outlier Feed"
              onAction={() => handleTabChange('OUTLIERS')}
            />
          )
        )}
      </div>
    </SectionErrorBoundary>
  );
}
