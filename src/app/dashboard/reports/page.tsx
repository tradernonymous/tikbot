'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  Music,
} from 'lucide-react';
import { Metric } from '@/components/Metric';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, ColumnDef } from '@/components/DataTable';

export interface PerformanceReport {
  timeframeDays: number;
  postCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
}

export interface HookBreakdown {
  hookType: string;
  postCount: number;
  totalViews: number;
  averageEngagementRate: number;
}

export interface LengthBreakdown {
  range: string;
  count: number;
  avgViews: number;
}

export interface ReportsPageProps {
  initialReport?: PerformanceReport;
  initialBreakdowns?: {
    byHook: HookBreakdown[];
    byLength: LengthBreakdown[];
  };
}

export default function ReportsPage({
  initialReport,
  initialBreakdowns,
}: ReportsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTimeframe = searchParams ? searchParams.get('timeframe') : null;
  const resolvedTimeframe =
    urlTimeframe === '7' || urlTimeframe === '90' ? urlTimeframe : '30';

  const [timeframe, setTimeframe] = useState<'7' | '30' | '90'>(resolvedTimeframe as any);
  const [report, setReport] = useState<PerformanceReport | null>(initialReport || null);
  const [breakdowns, setBreakdowns] = useState<{
    byHook: HookBreakdown[];
    byLength: LengthBreakdown[];
  }>(initialBreakdowns || { byHook: [], byLength: [] });
  const [loading, setLoading] = useState<boolean>(!initialReport);

  useEffect(() => {
    if (initialReport && initialBreakdowns) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/v1/intelligence/reports?timeframe=${timeframe}&format=json`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setReport(data.report);
          if (data.breakdowns) setBreakdowns(data.breakdowns);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [timeframe, initialReport, initialBreakdowns]);

  const handleTimeframeChange = (tf: '7' | '30' | '90') => {
    setTimeframe(tf);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('timeframe', tf);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const hookColumns: ColumnDef<HookBreakdown>[] = [
    {
      key: 'hookType',
      header: 'Opening Hook Framework',
      render: (item) => (
        <span className="font-semibold text-white text-xs">{item.hookType}</span>
      ),
    },
    {
      key: 'postCount',
      header: 'Sample Size',
      render: (item) => (
        <span className="text-xs font-mono text-slate-300">
          {`${item.postCount} posts`}
        </span>
      ),
    },
    {
      key: 'totalViews',
      header: 'Aggregate Views',
      render: (item) => (
        <Metric
          value={item.totalViews.toLocaleString()}
          provenance="live"
        />
      ),
    },
    {
      key: 'averageEngagementRate',
      header: 'Avg Engagement Rate',
      render: (item) => (
        <span className="text-xs font-mono font-medium text-emerald-400">
          {(item.averageEngagementRate * 100).toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <SectionErrorBoundary sectionName="Telemetry Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">{`${timeframe}-Day Telemetry Report`}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-day performance audit traceable to PostgreSQL MetricSample records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/api/v1/intelligence/reports?timeframe=${timeframe}&format=csv`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/40 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Provenance: LIVE (DB)
            </span>
          </div>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div className="flex space-x-1" role="tablist" aria-label="Timeframe selection">
            {(['7', '30', '90'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  timeframe === tf
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {`${tf} Days`}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-slate-400">
            {report ? `${report.postCount} posts analyzed` : 'Analyzing...'}
          </span>
        </div>

        {/* Summary Metric Cards */}
        {report && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <Metric
                label="Total Views"
                value={report.totalViews.toLocaleString()}
                provenance="live"
              />
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <Metric
                label="Total Likes"
                value={report.totalLikes.toLocaleString()}
                provenance="live"
              />
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <Metric
                label="Comments & Shares"
                value={(report.totalComments + report.totalShares).toLocaleString()}
                provenance="live"
              />
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <Metric
                label="Average Engagement"
                value={`${(report.averageEngagementRate * 100).toFixed(2)}%`}
                provenance="live"
              />
            </div>
          </div>
        )}

        {/* Hook Breakdown Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Breakdown by Opening Hook Type</h2>
          </div>

          {breakdowns.byHook.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No hook breakdown telemetry available"
              description="Analyze posts in Research or execute publishing jobs to accumulate comparative hook metrics."
            />
          ) : (
            <DataTable
              columns={hookColumns}
              data={breakdowns.byHook}
              keyExtractor={(item) => item.hookType}
            />
          )}
        </div>

        {/* Video Length Breakdown */}
        {breakdowns.byLength.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Breakdown by Video Length Tier</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {breakdowns.byLength.map((len) => (
                <div key={len.range} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">{len.range}</span>
                  <div className="text-sm font-bold text-white font-mono">{len.count} videos</div>
                  <div className="text-[11px] text-slate-400 font-mono">avg {len.avgViews.toLocaleString()} views</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionErrorBoundary>
  );
}
