'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  UserCheck,
  Users,
  Search,
  Plus,
  ArrowRight,
  Sparkles,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Metric } from '@/components/Metric';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { PipelineStage } from '@/app/api/v1/intelligence/creators/route';

export interface CreatorCRMRecord {
  id: string;
  handle: string;
  platform: string;
  followerCount: number;
  medianViews: number;
  stage: PipelineStage;
  vettingScore: number;
  fitTier: 'HIGH' | 'MEDIUM' | 'LOW';
  seededPostsCount?: number;
  estimatedRoi?: string | null;
}

export interface CreatorsPageProps {
  initialCreators?: CreatorCRMRecord[];
}

const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'PROSPECT', label: 'Prospect', color: 'border-slate-700 bg-slate-900/60 text-slate-300' },
  { key: 'CONTACTED', label: 'Contacted', color: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
  { key: 'NEGOTIATING', label: 'Negotiating', color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  { key: 'LIVE', label: 'Live', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  { key: 'DEAD', label: 'Dead', color: 'border-rose-500/30 bg-rose-500/10 text-rose-400' },
];

export default function CreatorsPage({ initialCreators }: CreatorsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlStage = searchParams ? searchParams.get('stage') : null;
  const urlSearch = searchParams ? searchParams.get('search') : null;

  const validStageKeys = STAGES.map((s) => s.key);
  const resolvedStage =
    urlStage && validStageKeys.includes(urlStage.toUpperCase() as PipelineStage)
      ? (urlStage.toUpperCase() as PipelineStage)
      : 'ALL';

  const [selectedStage, setSelectedStage] = useState<string>(resolvedStage);
  const [searchFilter, setSearchFilter] = useState<string>(urlSearch || '');
  const [creators, setCreators] = useState<CreatorCRMRecord[]>(initialCreators || []);
  const [loading, setLoading] = useState<boolean>(!initialCreators);
  const [newHandle, setNewHandle] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  useEffect(() => {
    if (initialCreators) return;

    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (selectedStage !== 'ALL') {
      params.set('stage', selectedStage);
    }

    fetch(`/api/v1/intelligence/creators?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.creators)) {
          setCreators(data.creators);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStage, initialCreators]);

  const updateUrl = (stage: string, search: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (stage !== 'ALL') {
      params.set('stage', stage.toLowerCase());
    } else {
      params.delete('stage');
    }
    if (search.trim()) {
      params.set('search', search.trim());
    } else {
      params.delete('search');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleStageFilterChange = (st: string) => {
    setSelectedStage(st);
    updateUrl(st, searchFilter);
  };

  const handleSearchChange = (q: string) => {
    setSearchFilter(q);
    updateUrl(selectedStage, q);
  };

  const handleMoveStage = async (creatorId: string, nextStage: PipelineStage) => {
    try {
      const res = await fetch('/api/v1/intelligence/creators', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ creatorId, stage: nextStage }),
      });
      const data = await res.json();
      if (data.success) {
        setCreators((prev) =>
          prev.map((c) => (c.id === creatorId ? { ...c, stage: nextStage } : c))
        );
      }
    } catch {}
  };

  const handleAddCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/v1/intelligence/creators', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ handle: newHandle.trim(), stage: 'PROSPECT' }),
      });
      const data = await res.json();
      if (data.success && data.creator) {
        setCreators((prev) => [data.creator, ...prev]);
        setNewHandle('');
      }
    } catch {} finally {
      setIsAdding(false);
    }
  };

  const filteredCreators = creators.filter((c) => {
    if (searchFilter && !c.handle.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    if (selectedStage !== 'ALL' && c.stage !== selectedStage) {
      return false;
    }
    return true;
  });

  return (
    <SectionErrorBoundary sectionName="Creators CRM">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">Creators CRM &amp; Pipeline</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Kanban creator workflow, OSINT engagement vetting scores, and seeded content ROI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Provenance: LIVE (DB)
            </span>
          </div>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleAddCreator} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              placeholder="Add creator handle e.g. @ugc_creator"
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isAdding}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search creators..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedStage}
              onChange={(e) => handleStageFilterChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Stages</option>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredCreators.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No creators in CRM pipeline"
            description="Add creator identities to monitor their engagement authenticity and manage outreach stages."
            actionLabel="Add Prospect Creator"
            onAction={() => setNewHandle('top_influencer')}
          />
        ) : (
          /* Kanban Board */
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {STAGES.map((col) => {
              const colCreators = filteredCreators.filter((c) => c.stage === col.key);

              return (
                <div
                  key={col.key}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col min-w-[240px] space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="font-semibold text-xs text-white">{col.label}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${col.color}`}>
                      {colCreators.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {colCreators.map((creator) => (
                      <div
                        key={creator.id}
                        className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2.5 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white text-xs">{`@${creator.handle}`}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {creator.followerCount.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <Metric
                            label="Vetting Score"
                            value={creator.vettingScore}
                            provenance="live"
                            unit="/100"
                          />
                          {creator.estimatedRoi && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                              {creator.estimatedRoi} ROI
                            </span>
                          )}
                        </div>

                        {/* Stage Selector */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
                          <select
                            value={creator.stage}
                            onChange={(e) => handleMoveStage(creator.id, e.target.value as PipelineStage)}
                            className="bg-slate-950 border border-slate-800 text-[10px] rounded px-1.5 py-1 text-slate-300 focus:outline-none focus:border-emerald-500 w-full"
                          >
                            {STAGES.map((s) => (
                              <option key={s.key} value={s.key}>
                                Move to: {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionErrorBoundary>
  );
}
