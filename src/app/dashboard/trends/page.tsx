'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  Hash,
  Music,
  Flame,
  Globe,
  Filter,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Metric } from '@/components/Metric';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, ColumnDef } from '@/components/DataTable';

export interface TrendRow {
  id: string;
  type: string;
  signalKey: string;
  score: number;
  velocity: number;
  sampleSize: number;
  region: string;
  lifecyclePhase?: 'EMERGING' | 'RISING' | 'PEAK' | 'DECLINING';
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface TrendsPageProps {
  initialTrends?: TrendRow[];
}

export default function TrendsPage({ initialTrends }: TrendsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTab = searchParams ? searchParams.get('tab') : null;
  const urlRegion = searchParams ? searchParams.get('region') : null;
  const urlSearch = searchParams ? searchParams.get('search') : null;

  const validTabs = ['HASHTAGS', 'SOUNDS', 'RISING', 'MAP'] as const;
  type TabType = (typeof validTabs)[number];

  const resolvedTab: TabType =
    urlTab && validTabs.includes(urlTab.toUpperCase() as TabType)
      ? (urlTab.toUpperCase() as TabType)
      : 'HASHTAGS';

  const [activeTab, setActiveTab] = useState<TabType>(resolvedTab);
  const [selectedRegion, setSelectedRegion] = useState<string>(urlRegion || 'ALL');
  const [searchFilter, setSearchFilter] = useState<string>(urlSearch || '');
  const [trends, setTrends] = useState<TrendRow[]>(initialTrends || []);
  const [loading, setLoading] = useState<boolean>(!initialTrends);

  useEffect(() => {
    if (initialTrends) {
      setTrends(initialTrends);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const typeParam =
      activeTab === 'HASHTAGS'
        ? 'HASHTAG'
        : activeTab === 'SOUNDS'
        ? 'SOUND'
        : activeTab === 'RISING'
        ? 'RISING'
        : 'ALL';

    const params = new URLSearchParams({
      type: typeParam,
      limit: '50',
    });
    if (selectedRegion !== 'ALL') {
      params.set('region', selectedRegion);
    }

    fetch(`/api/v1/intelligence/trends?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.trends)) {
          setTrends(data.trends);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedRegion, initialTrends]);

  const updateUrl = (tab: TabType, region: string, search: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('tab', tab.toLowerCase());
    if (region !== 'ALL') {
      params.set('region', region);
    } else {
      params.delete('region');
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
    updateUrl(tab, selectedRegion, searchFilter);
  };

  const handleRegionChange = (reg: string) => {
    setSelectedRegion(reg);
    updateUrl(activeTab, reg, searchFilter);
  };

  const handleSearchChange = (q: string) => {
    setSearchFilter(q);
    updateUrl(activeTab, selectedRegion, q);
  };

  const filteredTrends = trends.filter((t) => {
    if (searchFilter && !t.signalKey.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    if (activeTab === 'HASHTAGS' && t.type !== 'HASHTAG') return false;
    if (activeTab === 'SOUNDS' && t.type !== 'SOUND') return false;
    if (activeTab === 'RISING' && t.score < 70) return false;
    if (activeTab === 'MAP' && selectedRegion !== 'ALL' && t.region !== selectedRegion) return false;
    return true;
  });

  const columns: ColumnDef<TrendRow>[] = [
    {
      key: 'signalKey',
      header: activeTab === 'SOUNDS' ? 'Sound Title' : 'Keyword / Tag',
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.type === 'SOUND' ? (
            <Music className="w-4 h-4 text-purple-400 shrink-0" />
          ) : (
            <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span className="font-semibold text-white">
            {item.signalKey.startsWith('#') || item.type === 'SOUND'
              ? item.signalKey
              : `#${item.signalKey}`}
          </span>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Rising Score',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Metric
            value={item.score}
            provenance="live"
            unit="/100"
          />
        </div>
      ),
    },
    {
      key: 'velocity',
      header: 'Velocity',
      render: (item) => (
        <span className={`text-xs font-mono font-medium ${item.velocity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {item.velocity > 0 ? `+${item.velocity}%/h` : `${item.velocity}%/h`}
        </span>
      ),
    },
    {
      key: 'sampleSize',
      header: 'Sample Size',
      render: (item) => (
        <span className="text-xs font-mono text-slate-300">
          {item.sampleSize.toLocaleString()} posts
        </span>
      ),
    },
    {
      key: 'region',
      header: 'Region',
      render: (item) => (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300 uppercase">
          {item.region}
        </span>
      ),
    },
    ...(activeTab === 'SOUNDS'
      ? [
          {
            key: 'lifecyclePhase',
            header: 'Lifecycle',
            render: (item: TrendRow) => {
              const phase = item.lifecyclePhase || 'EMERGING';
              const styles = {
                EMERGING: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
                RISING: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                PEAK: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
                DECLINING: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
              };
              return (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${styles[phase]}`}>
                  {phase}
                </span>
              );
            },
          },
        ]
      : []),
    {
      key: 'actions',
      header: 'Action',
      render: (item) => {
        const cleanTag = item.signalKey.replace(/^#/, '');
        return (
          <Link
            href={`/dashboard/composer?source=trend&tag=${encodeURIComponent(cleanTag)}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/40 text-xs font-medium transition-colors"
          >
            <span>Use in Composer</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        );
      },
    },
  ];

  return (
    <SectionErrorBoundary sectionName="Trends Workbench">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">Trend Radar</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time hashtag and sound velocity signals scored from organic post telemetry.
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
          <nav className="flex space-x-1" aria-label="Trend sub-tabs">
            <button
              onClick={() => handleTabChange('HASHTAGS')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'HASHTAGS'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Hashtags</span>
            </button>
            <button
              onClick={() => handleTabChange('SOUNDS')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'SOUNDS'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Sounds</span>
            </button>
            <button
              onClick={() => handleTabChange('RISING')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'RISING'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Rising</span>
            </button>
            <button
              onClick={() => handleTabChange('MAP')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'MAP'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Map</span>
            </button>
          </nav>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search trends..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Regions</option>
              <option value="US">US</option>
              <option value="UK">UK</option>
              <option value="DE">DE</option>
              <option value="FR">FR</option>
            </select>
          </div>
        </div>

        {/* Content Table / Empty State */}
        {filteredTrends.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No trend signals found"
            description="No active trend signals matching the selected criteria. Signals update continuously as telemetry flows."
            actionLabel="View All Signals"
            onAction={() => {
              setSelectedRegion('ALL');
              setSearchFilter('');
              setActiveTab('HASHTAGS');
            }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredTrends}
            keyExtractor={(item) => item.id}
          />
        )}
      </div>
    </SectionErrorBoundary>
  );
}
