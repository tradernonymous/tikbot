'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Split,
  Layers,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Lightbulb,
} from 'lucide-react';
import { Metric } from '@/components/Metric';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { generateHookVariants, evaluateABHookTest, HookVariant, ABEvaluationResult } from '@/intelligence/hook-lab';

export interface HookRecord {
  id: string;
  pattern: string;
  textTemplate: string;
  retentionProxyScore: number;
  usageCount: number;
  createdAt: string;
}

export interface HooksPageProps {
  initialHooks?: HookRecord[];
}

export default function HooksPage({ initialHooks }: HooksPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTab = searchParams ? searchParams.get('tab') : null;
  const urlPattern = searchParams ? searchParams.get('pattern') : null;
  const urlSearch = searchParams ? searchParams.get('search') : null;

  const validTabs = ['LIBRARY', 'VARIANTS', 'AB_TESTS'] as const;
  type TabType = (typeof validTabs)[number];

  const resolvedTab: TabType =
    urlTab && validTabs.includes(urlTab.toUpperCase() as TabType)
      ? (urlTab.toUpperCase() as TabType)
      : 'LIBRARY';

  const [activeTab, setActiveTab] = useState<TabType>(resolvedTab);
  const [selectedPattern, setSelectedPattern] = useState<string>(urlPattern || 'ALL');
  const [searchFilter, setSearchFilter] = useState<string>(urlSearch || '');
  const [hooks, setHooks] = useState<HookRecord[]>(initialHooks || []);
  const [loading, setLoading] = useState<boolean>(!initialHooks);

  // Variant generator state
  const [baseTopic, setBaseTopic] = useState<string>('scale to 10k followers');
  const [generatedVariants, setGeneratedVariants] = useState<HookVariant[]>([]);

  // A/B test state
  const [viewsA, setViewsA] = useState<number>(3000);
  const [retentionA, setRetentionA] = useState<number>(0.25);
  const [viewsB, setViewsB] = useState<number>(3500);
  const [retentionB, setRetentionB] = useState<number>(0.38);
  const [abResult, setAbResult] = useState<ABEvaluationResult | null>(null);

  useEffect(() => {
    if (initialHooks) {
      setHooks(initialHooks);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams({ limit: '50' });
    if (selectedPattern !== 'ALL') {
      params.set('pattern', selectedPattern);
    }

    fetch(`/api/v1/intelligence/hooks?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.hooks)) {
          setHooks(data.hooks);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPattern, initialHooks]);

  const updateUrl = (tab: TabType, pattern: string, search: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('tab', tab.toLowerCase());
    if (pattern !== 'ALL') {
      params.set('pattern', pattern);
    } else {
      params.delete('pattern');
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
    updateUrl(tab, selectedPattern, searchFilter);
  };

  const handlePatternChange = (pat: string) => {
    setSelectedPattern(pat);
    updateUrl(activeTab, pat, searchFilter);
  };

  const handleSearchChange = (q: string) => {
    setSearchFilter(q);
    updateUrl(activeTab, selectedPattern, q);
  };

  const handleGenerate = () => {
    if (!baseTopic.trim()) return;
    const variants = generateHookVariants(baseTopic);
    setGeneratedVariants(variants);
  };

  const handleEvaluateAB = () => {
    const res = evaluateABHookTest(
      { id: 'Variant A', views: viewsA, retentionRate: retentionA },
      { id: 'Variant B', views: viewsB, retentionRate: retentionB }
    );
    setAbResult(res);
  };

  const filteredHooks = hooks.filter((h) => {
    if (searchFilter && !h.textTemplate.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    if (selectedPattern !== 'ALL' && h.pattern !== selectedPattern) {
      return false;
    }
    return true;
  });

  const PATTERN_COLORS: Record<string, string> = {
    CONTRARIAN: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    QUESTION: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    POV: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    DEMO: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    NEGATIVE_CONSTRAINT: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    RESULT_STORY: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };

  const columns: ColumnDef<HookRecord>[] = [
    {
      key: 'pattern',
      header: 'Pattern Tag',
      render: (item) => {
        const color = PATTERN_COLORS[item.pattern] || 'bg-slate-800 border-slate-700 text-slate-300';
        return (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${color}`}>
            {item.pattern}
          </span>
        );
      },
    },
    {
      key: 'textTemplate',
      header: 'Hook Template',
      render: (item) => (
        <span className="font-medium text-white text-xs">{item.textTemplate}</span>
      ),
    },
    {
      key: 'retentionProxyScore',
      header: 'Retention Score',
      render: (item) => (
        <Metric
          value={item.retentionProxyScore.toFixed(1)}
          provenance="live"
          unit="/100"
        />
      ),
    },
    {
      key: 'usageCount',
      header: 'Posts Linked',
      render: (item) => (
        <span className="text-xs font-mono text-slate-300">
          {`${item.usageCount.toLocaleString()} posts`}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item) => (
        <Link
          href={`/dashboard/composer?hook=${encodeURIComponent(item.textTemplate)}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/40 text-xs font-medium transition-colors"
        >
          <span>Use in Composer</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <SectionErrorBoundary sectionName="Hook Lab">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">Hook Lab</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Test, generate, and evaluate psychological hook variants with retention lift statistics.
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
          <nav className="flex space-x-1" aria-label="Hook lab sub-tabs">
            <button
              onClick={() => handleTabChange('LIBRARY')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'LIBRARY'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Library</span>
            </button>
            <button
              onClick={() => handleTabChange('VARIANTS')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'VARIANTS'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>Variants</span>
            </button>
            <button
              onClick={() => handleTabChange('AB_TESTS')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'AB_TESTS'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Split className="w-4 h-4" />
              <span>A/B Tests</span>
            </button>
          </nav>

          {activeTab === 'LIBRARY' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search templates..."
                  className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={selectedPattern}
                onChange={(e) => handlePatternChange(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Patterns</option>
                <option value="CONTRARIAN">Contrarian</option>
                <option value="QUESTION">Question</option>
                <option value="POV">POV</option>
                <option value="DEMO">Demo</option>
                <option value="NEGATIVE_CONSTRAINT">Negative Constraint</option>
                <option value="RESULT_STORY">Result Story</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Library */}
        {activeTab === 'LIBRARY' && (
          filteredHooks.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No hook patterns found"
              description="No saved hook templates match the filter. Generate or record proven opening hooks."
              actionLabel="Generate Variants"
              onAction={() => handleTabChange('VARIANTS')}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredHooks}
              keyExtractor={(item) => item.id}
            />
          )
        )}

        {/* Tab 2: Variants Generator */}
        {activeTab === 'VARIANTS' && (
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Generate Psychological Hook Variants</h2>
              <p className="text-xs text-slate-400">
                Input your content topic or premise. Hook Lab applies proven contrarian, question, constraint, and story frameworks.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={baseTopic}
                  onChange={(e) => setBaseTopic(e.target.value)}
                  placeholder="e.g. how to fix low views on TikTok"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Variants</span>
                </button>
              </div>
            </div>

            {generatedVariants.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedVariants.map((v, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${PATTERN_COLORS[v.type] || 'bg-slate-800 text-slate-300'}`}>
                          {v.type}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium">&ldquo;{v.text}&rdquo;</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(v.text)}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                      <Link
                        href={`/dashboard/composer?hook=${encodeURIComponent(v.text)}`}
                        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
                      >
                        <span>Use in Composer</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: A/B Tests */}
        {activeTab === 'AB_TESTS' && (
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Statistical A/B Hook Significance Evaluator</h2>
              <p className="text-xs text-slate-400">
                Compare viewer retention between test variants. Minimum 1,000 views per variant and &ge;15% retention lift required for significance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-cyan-400 font-mono uppercase">Variant A</h3>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono block mb-1">Views</label>
                    <input
                      type="number"
                      value={viewsA}
                      onChange={(e) => setViewsA(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono block mb-1">Average Retention Rate (0.0 - 1.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={retentionA}
                      onChange={(e) => setRetentionA(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-amber-400 font-mono uppercase">Variant B</h3>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono block mb-1">Views</label>
                    <input
                      type="number"
                      value={viewsB}
                      onChange={(e) => setViewsB(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono block mb-1">Average Retention Rate (0.0 - 1.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={retentionB}
                      onChange={(e) => setRetentionB(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEvaluateAB}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Evaluate A/B Significance</span>
              </button>
            </div>

            {abResult && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  {abResult.isSignificant ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  )}
                  <h3 className="text-sm font-semibold text-white">
                    {abResult.isSignificant
                      ? `Winner Detected: ${abResult.winnerId} (+${abResult.liftPercentage}% lift)`
                      : 'Sample Inconclusive: More views required to achieve statistical confidence.'}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span>Lift: {abResult.liftPercentage}%</span>
                  <span>
                    Significant:{' '}
                    <span className={abResult.isSignificant ? 'text-emerald-400' : 'text-amber-400'}>
                      {abResult.isSignificant ? 'YES' : 'NO'}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionErrorBoundary>
  );
}
