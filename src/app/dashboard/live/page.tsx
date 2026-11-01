'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Radio,
  Eye,
  Gift,
  HelpCircle,
  TrendingUp,
  Activity,
  ArrowRight,
  PowerOff,
  Plus,
  MessageSquare,
  Search,
} from 'lucide-react';
import { Metric } from '@/components/Metric';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { LiveRoomTracker } from '@/intelligence/live-intelligence';

export interface LivePageProps {
  initialConnected?: boolean;
  initialTracker?: LiveRoomTracker | null;
}

export default function LivePage({
  initialConnected,
  initialTracker,
}: LivePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTarget = searchParams ? searchParams.get('target') : null;
  const [targetInput, setTargetInput] = useState<string>(urlTarget || '');
  const [connected, setConnected] = useState<boolean>(initialConnected ?? false);
  const [tracker, setTracker] = useState<LiveRoomTracker | null>(initialTracker ?? null);
  const [loading, setLoading] = useState<boolean>(initialConnected === undefined);
  const [routedQuestionIdxs, setRoutedQuestionIdxs] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (initialConnected !== undefined && initialTracker !== undefined) return;

    let isMounted = true;
    setLoading(true);

    fetch('/api/v1/intelligence/live')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setConnected(data.connected);
          setTracker(data.tracker);
          if (data.tracker?.targetHandle && !targetInput) {
            setTargetInput(data.tracker.targetHandle);
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
  }, [initialConnected, initialTracker]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;

    try {
      const res = await fetch('/api/v1/intelligence/live', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          targetHandle: targetInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConnected(true);
        setTracker(data.tracker);
        const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
        params.set('target', targetInput.trim().replace(/^@/, ''));
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    } catch {}
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/v1/intelligence/live', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      const data = await res.json();
      if (data.success) {
        setConnected(false);
        setTracker(null);
        const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
        params.delete('target');
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    } catch {}
  };

  const handleRouteToInbox = async (q: { author: string; text: string }, idx: number) => {
    try {
      const res = await fetch('/api/v1/intelligence/inbox', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'escalate',
          authorHandle: q.author,
          text: q.text,
          category: 'QUESTION',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoutedQuestionIdxs((prev) => new Set(prev).add(idx));
      }
    } catch {}
  };

  return (
    <SectionErrorBoundary sectionName="Live Intelligence">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
              <h1 className="text-xl font-bold tracking-tight text-white">Live Intelligence Stream</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time concurrent viewers, chat question harvesting, and gift velocity telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] font-mono px-2 py-1 rounded border uppercase font-semibold ${
                connected
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {connected ? 'BROADCAST CONNECTED' : 'DISCONNECTED'}
            </span>

            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Provenance: LIVE (DB)
            </span>
          </div>
        </div>

        {/* Blank state if disconnected */}
        {!connected || !tracker ? (
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 max-w-lg space-y-4">
              <h2 className="text-sm font-semibold text-white">Connect Live Stream Target</h2>
              <p className="text-xs text-slate-400">
                Connect the live stream listener to ingest real-time viewer concurrency and audience questions.
              </p>

              <form onSubmit={handleConnect} className="flex gap-2">
                <input
                  type="text"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="e.g. streamer_pro"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
                >
                  Connect Live Target
                </button>
              </form>
            </div>

            <EmptyState
              icon={Radio}
              title="No live broadcast target connected"
              description="Real-time viewer charts and chat capture will stream once a target handle is connected above. No synthetic telemetry is displayed."
            />
          </div>
        ) : (
          /* Active Live Telemetry Dashboard */
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-sm font-bold text-white font-mono">{`@${tracker.targetHandle}`}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300">
                  LIVE NOW
                </span>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                <PowerOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Disconnect Stream</span>
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <Metric
                  label="Current Viewers"
                  value={tracker.currentViewers.toLocaleString()}
                  provenance="live"
                />
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <Metric
                  label="Peak Concurrent Viewers"
                  value={tracker.peakViewers.toLocaleString()}
                  provenance="live"
                />
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <Metric
                  label="Total Gifts Received"
                  value={tracker.totalGiftsCount.toLocaleString()}
                  provenance="live"
                />
              </div>
            </div>

            {/* Concurrent Viewers Time Series */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Viewer Concurrency Time Series</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {tracker.viewerTimeSeries.length} sample points
                </span>
              </div>

              {tracker.viewerTimeSeries.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Awaiting initial viewer snapshot telemetry from live connector...
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-2 h-32 pt-4 px-2 border-b border-slate-800">
                    {tracker.viewerTimeSeries.slice(-20).map((pt, idx) => {
                      const peak = Math.max(tracker.peakViewers, 1);
                      const heightPercent = Math.max(10, Math.round((pt.count / peak) * 100));

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 min-w-[28px]">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-cyan-500/40 hover:bg-cyan-500 border border-cyan-400/60 rounded-t transition-all"
                            title={`${pt.timestamp}: ${pt.count} viewers`}
                          />
                          <span className="text-[8px] font-mono text-slate-500 truncate w-full text-center">
                            {pt.timestamp.slice(-5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Question Harvester Feed */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Captured Live Chat Questions</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {tracker.capturedQuestions.length} questions harvested
                </span>
              </div>

              {tracker.capturedQuestions.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  No questions detected in live chat yet. Questions are detected and filtered in real-time.
                </p>
              ) : (
                <div className="space-y-3">
                  {tracker.capturedQuestions.map((q, idx) => {
                    const isRouted = routedQuestionIdxs.has(idx);

                    return (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">@{q.author}</span>
                            <span className="text-[10px] font-mono text-slate-500">{q.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-200">&ldquo;{q.text}&rdquo;</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRouteToInbox(q, idx)}
                          disabled={isRouted}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 shrink-0 transition-colors ${
                            isRouted
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-cyan-600/20 hover:bg-cyan-600/40 border-cyan-500/30 text-cyan-300'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{isRouted ? 'Routed to Inbox' : 'Route to Inbox'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionErrorBoundary>
  );
}
