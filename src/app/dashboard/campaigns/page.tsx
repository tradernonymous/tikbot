'use client';

import React, { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { useOperations, GovernedCampaign } from '@/context/OperationsContext';
import { EngagementRiskScorer } from '@/engagement/risk-scorer';
import { generateRelatableComment, CommentPersona } from '@/engagement/comment-bank';
import {
  Flame,
  Plus,
  ShieldCheck,
  Check,
  X,
  Radio,
  MessageSquare,
  AlertTriangle,
  Play,
  Heart,
  Eye,
  CheckCircle2,
  Pause,
  RotateCw,
  Sparkles,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CampaignsPage() {
  const searchParams = useSearchParams();
  const {
    campaigns,
    createCampaign,
    approveCampaign,
    rejectCampaign,
    pauseCampaign,
    resumeCampaign,
    accounts,
    proxies,
    killSwitchActive,
  } = useOperations();

  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'COMMENT_BANK'>('CAMPAIGNS');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [newActionType, setNewActionType] = useState<'LIKE' | 'COMMENT' | 'SAVE' | 'VIEW' | 'LIVE_VIEW'>('LIKE');
  const [newTargetCount, setNewTargetCount] = useState(100);
  const [newDurationHours, setNewDurationHours] = useState(4);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comment Bank Studio State
  const [persona, setPersona] = useState<CommentPersona>('ENTHUSIAST');
  const [commentContext, setCommentContext] = useState('viral hook framework');
  const [generatedComment, setGeneratedComment] = useState('');

  // Handle URL search params on mount (from research or publishing)
  useEffect(() => {
    const urlParam = searchParams.get('targetUrl');
    const actionParam = searchParams.get('actionType');
    if (urlParam) {
      setNewTargetUrl(decodeURIComponent(urlParam));
      setShowCreateModal(true);
    }
    if (actionParam && ['LIKE', 'COMMENT', 'SAVE', 'VIEW', 'LIVE_VIEW'].includes(actionParam)) {
      setNewActionType(actionParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    const comment = generateRelatableComment({ persona, context: commentContext });
    setGeneratedComment(comment);
  }, [persona, commentContext]);

  const filteredCampaigns = campaigns.filter((camp) => {
    if (selectedActionFilter === 'ALL') return true;
    return camp.actionType === selectedActionFilter;
  });

  const handleApprove = (id: string) => {
    approveCampaign(id);
    setToastMessage(`Campaign approved. Queued for automated dispatch.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReject = (id: string) => {
    rejectCampaign(id);
    setToastMessage(`Campaign rejected and archived.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Pre-flight Risk Assessment using real domain scorer
  const riskScorer = new EngagementRiskScorer();
  const preflightRisk = riskScorer.assessCampaign({
    totalActions: newTargetCount,
    targetDurationHours: newDurationHours,
    accountStates: accounts.map((a) => a.status),
    proxiesAssigned: proxies.length,
    hasManualApproval: false, // will require manual signoff
  });

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTargetUrl) return;

    createCampaign({
      title: newTitle,
      targetUrl: newTargetUrl,
      actionType: newActionType,
      targetCount: newTargetCount,
    });

    setToastMessage(`Campaign "${newTitle}" created and submitted for operator approval.`);
    setShowCreateModal(false);
    setNewTitle('');
    setNewTargetUrl('');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Engagement Campaigns</h2>
          <p className="text-xs text-slate-400 mt-1">
            Governed boost campaigns (Likes, Comments, Saves, Shares, Live Views) with mandatory manual approval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/panel"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-500/30 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Launch Live Boost</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-Tabs: Campaigns vs Comment Bank */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('CAMPAIGNS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'CAMPAIGNS'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Active Campaigns ({campaigns.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('COMMENT_BANK')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'COMMENT_BANK'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Relatable Comment Bank Studio</span>
        </button>
      </div>

      {/* Tab 1: Campaigns Table */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="space-y-4">
          {/* Compliance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Compliance Gate: ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Manual approval mandatory before automation dispatch. 100% of actions respect hourly & daily caps.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs mb-1">
                <MessageSquare className="w-4 h-4" />
                <span>AI Persona Injection</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Relatable niche templates with randomized human jitter (2m - 5m) to evade spam detection.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Global Kill Switch Status</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {killSwitchActive ? (
                  <span className="text-rose-400 font-bold">ALL CAMPAIGNS FROZEN BY KILL SWITCH</span>
                ) : (
                  <span>Armable from top bar to immediately freeze all active runs.</span>
                )}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {['ALL', 'LIKE', 'COMMENT', 'SAVE', 'VIEW', 'LIVE_VIEW'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedActionFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      selectedActionFilter === filter
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {filteredCampaigns.length} CAMPAIGNS REGISTERED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-mono text-[11px]">
                    <th className="py-3 px-4 font-medium">Campaign Title</th>
                    <th className="py-3 px-4 font-medium">Target URL</th>
                    <th className="py-3 px-4 font-medium">Action</th>
                    <th className="py-3 px-4 font-medium">Progress</th>
                    <th className="py-3 px-4 font-medium">Risk Tier</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Approval & Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredCampaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                        {camp.title}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-cyan-400/90 max-w-[200px] truncate">
                        <a href={camp.targetUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {camp.targetUrl}
                        </a>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-cyan-400">{camp.actionType}</td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span>{camp.executedCount} / {camp.targetCount}</span>
                          <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${Math.min(100, (camp.executedCount / camp.targetCount) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            camp.riskTier === 'LOW'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : camp.riskTier === 'MEDIUM'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                          }`}
                        >
                          {camp.riskTier || 'LOW'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={camp.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {camp.status === 'PENDING_APPROVAL' ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => handleApprove(camp.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold transition-all"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(camp.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-semibold transition-all"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : camp.status === 'RUNNING' ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => pauseCampaign(camp.id)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-[10px] font-mono flex items-center gap-1"
                            >
                              <Pause className="w-3 h-3" />
                              <span>Pause</span>
                            </button>
                          </div>
                        ) : camp.status === 'PAUSED' ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => resumeCampaign(camp.id)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-[10px] font-mono flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              <span>Resume</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400">AUTHORIZED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Comment Bank Studio */}
      {activeTab === 'COMMENT_BANK' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">AI Relatable Comment Generator</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">HUMANIZED CONVERSATIONAL TEMPLATES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Target Persona</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ENTHUSIAST', 'INQUIRER', 'CONVERTED_SKEPTIC', 'SUPPORTER'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPersona(p)}
                      className={`py-2 px-3 rounded-lg text-left font-mono text-[11px] border transition-colors ${
                        persona === p
                          ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 font-semibold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Video Topic / Niche Context</label>
                <input
                  type="text"
                  value={commentContext}
                  onChange={(e) => setCommentContext(e.target.value)}
                  placeholder="e.g., retention hooks, crypto, fitness routines..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={() => setGeneratedComment(generateRelatableComment({ persona, context: commentContext }))}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
              >
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Re-generate Variation</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-cyan-400 font-mono block mb-2">PREVIEW HUMANIZED COMMENT:</span>
                <p className="text-white text-sm italic font-sans leading-relaxed">&ldquo;{generatedComment}&rdquo;</p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">PERSONA: {persona}</span>
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setNewActionType('COMMENT');
                    setNewTitle(`Seed Relatable ${persona} Discussion`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Launch Campaign with This &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Create Governed Campaign</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Q4 Product Launch Engagement"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Target TikTok URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.tiktok.com/@username/video/..."
                  value={newTargetUrl}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Action Type</label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="LIKE">Likes</option>
                    <option value="COMMENT">Comments</option>
                    <option value="SAVE">Saves</option>
                    <option value="VIEW">Retention Views</option>
                    <option value="LIVE_VIEW">Live Viewers</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Actions</label>
                  <input
                    type="number"
                    min={5}
                    max={1000}
                    value={newTargetCount}
                    onChange={(e) => setNewTargetCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={newDurationHours}
                    onChange={(e) => setNewDurationHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Pre-flight Risk Assessment Box */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2 text-[11px] font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pre-flight Risk Score:</span>
                  <span
                    className={
                      preflightRisk.riskTier === 'LOW'
                        ? 'text-emerald-400 font-bold'
                        : preflightRisk.riskTier === 'MEDIUM'
                        ? 'text-amber-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {preflightRisk.riskScore}/100 ({preflightRisk.riskTier} RISK)
                  </span>
                </div>

                {preflightRisk.recommendations.length > 0 && (
                  <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                    <span className="text-slate-300 block font-semibold">Recommendations:</span>
                    {preflightRisk.recommendations.map((rec, i) => (
                      <p key={i} className="text-amber-300/90">&bull; {rec}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit for Operator Sign-Off</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}