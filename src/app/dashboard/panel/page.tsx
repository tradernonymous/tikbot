'use client';

import React, { useState, useEffect } from 'react';
import { useOperations, ActiveFarmTask } from '@/context/OperationsContext';
import {
  Layers,
  Play,
  Eye,
  Heart,
  MessageSquare,
  Radio,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  AlertTriangle,
  RotateCw,
  Pause,
  Trash2,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useSearchParams } from 'next/navigation';

interface FarmService {
  id: string;
  name: string;
  type: 'VIEW' | 'LIKE' | 'COMMENT' | 'LIVE_VIEW';
  icon: typeof Eye;
  badge: string;
  poweredBy: string;
  description: string;
  dailyCapacity: string;
  delayRange: string;
  riskTier: 'LOW' | 'MEDIUM';
}

const FARM_SERVICES: FarmService[] = [
  {
    id: 'srv-views',
    name: 'High-Retention Video View Engine',
    type: 'VIEW',
    icon: Eye,
    badge: 'ALGORITHMIC DWELL',
    poweredBy: 'Douyin_TikTok_Download_API + Stealth Browser Runner',
    description:
      'Simulates natural viewing sessions with 60%–100% video completion, audio playback, and natural looping to trigger TikTok recommendation heuristics.',
    dailyCapacity: '4,000 views / day',
    delayRange: '15s – 45s jitter',
    riskTier: 'LOW',
  },
  {
    id: 'srv-likes',
    name: 'Targeted Humanized Likes & Saves',
    type: 'LIKE',
    icon: Heart,
    badge: 'WARMED NODES',
    poweredBy: 'AccountRateLimiter + AES-256 Session Vault',
    description:
      'Dispatches organic likes and saves from warmed farm accounts through dedicated sticky residential proxies with randomized behavioral delays.',
    dailyCapacity: '1,250 likes / day',
    delayRange: '45s – 120s jitter',
    riskTier: 'LOW',
  },
  {
    id: 'srv-comments',
    name: 'Relatable Niche Comment Injector',
    type: 'COMMENT',
    icon: MessageSquare,
    badge: 'AI TEMPLATES',
    poweredBy: 'Relatable Comment Bank + VOC Mining Engine',
    description:
      'Generates and injects highly relevant, human-like comments across fitness, tech, finance, and lifestyle niches without repetitive spam footprints.',
    dailyCapacity: '600 comments / day',
    delayRange: '120s – 300s jitter',
    riskTier: 'MEDIUM',
  },
  {
    id: 'srv-live',
    name: 'Live Stream Viewer & Chat Booster',
    type: 'LIVE_VIEW',
    icon: Radio,
    badge: 'CONCURRENT AUDIENCE',
    poweredBy: 'LiveBoostSessionManager + Staggered Dispatcher',
    description:
      'Staggers 5–50 farm accounts into your live broadcast with natural watch durations and periodic organic live chat interactions.',
    dailyCapacity: 'Up to 50 concurrent nodes',
    delayRange: 'Staggered 30s intervals',
    riskTier: 'MEDIUM',
  },
];

export default function FarmServicesPage() {
  const searchParams = useSearchParams();
  const {
    farmTasks,
    dispatchFarmTask,
    pauseTask,
    resumeTask,
    cancelTask,
    accounts,
    proxies,
    killSwitchActive,
  } = useOperations();

  const [selectedService, setSelectedService] = useState<FarmService | null>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [targetCount, setTargetCount] = useState<number>(50);
  const [commentNiche, setCommentNiche] = useState('TECH');
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // Check URL query parameters on mount (deep links from Research or Overview)
  useEffect(() => {
    const urlParam = searchParams.get('targetUrl');
    const serviceParam = searchParams.get('service');
    if (urlParam) {
      setTargetUrl(decodeURIComponent(urlParam));
      const match = FARM_SERVICES.find((s) => s.type === serviceParam) || FARM_SERVICES[0];
      setSelectedService(match);
    }
  }, [searchParams]);

  const activeAccountsCount = accounts.filter((a) => a.status === 'ACTIVE').length;

  const handleLaunchModal = (service: FarmService) => {
    setSelectedService(service);
    if (service.type === 'VIEW') setTargetCount(200);
    else if (service.type === 'LIKE') setTargetCount(50);
    else if (service.type === 'COMMENT') setTargetCount(15);
    else if (service.type === 'LIVE_VIEW') setTargetCount(20);
    if (!targetUrl) setTargetUrl('');
  };

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !targetUrl) return;

    dispatchFarmTask({
      serviceName: selectedService.name,
      serviceType: selectedService.type,
      targetUrl,
      targetCount,
      commentNiche,
    });

    setDispatchSuccess(`Successfully dispatched ${selectedService.name} (${targetCount} actions) to internal farm queue.`);
    setSelectedService(null);
    setTimeout(() => setDispatchSuccess(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Internal Farm Automation Services</h2>
          <p className="text-xs text-slate-400 mt-1">
            Self-hosted automation console powered by your internal TikTok accounts, sticky residential proxies, and scraper sidecars.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Operator Safe Mode: ACTIVE</span>
        </div>
      </div>

      {killSwitchActive && (
        <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-700/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Global Kill Switch is currently active. All task executions and worker session progress are paused.</span>
        </div>
      )}

      {dispatchSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dispatchSuccess}</span>
          </div>
          <button onClick={() => setDispatchSuccess(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Farm Fleet Operational Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Ready Farm Nodes</div>
            <div className="text-lg font-bold text-white font-mono">{activeAccountsCount} / {accounts.length} Nodes</div>
            <div className="text-[10px] text-emerald-400">Healthy & Warmed</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-800/50 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Sticky Proxy Pool</div>
            <div className="text-lg font-bold text-white font-mono">{proxies.length} Gateways</div>
            <div className="text-[10px] text-cyan-400">1:1 Dedicated Binding</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Daily Safe Capacity</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">5,850 Actions</div>
            <div className="text-[10px] text-slate-400">Hourly Anti-Bot Jitter Active</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-950/80 border border-purple-800/50 text-purple-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Tasks</div>
            <div className="text-lg font-bold text-white font-mono">{farmTasks.length} Monitored</div>
            <div className="text-[10px] text-purple-300">Live Worker Loop</div>
          </div>
        </div>
      </div>

      {/* Services Grid (Internal Operator Launchers) */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Available Farm Services & Launchers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FARM_SERVICES.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all backdrop-blur-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{srv.name}</h4>
                        <span className="text-[10px] text-cyan-400/90 font-mono">{srv.badge}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        srv.riskTier === 'LOW'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                          : 'bg-amber-950/60 text-amber-400 border-amber-800/50'
                      }`}
                    >
                      RISK: {srv.riskTier}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{srv.description}</p>

                  <div className="space-y-1.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono text-slate-400 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Module Driver:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[220px]">{srv.poweredBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pace / Delays:</span>
                      <span className="text-cyan-400 font-medium">{srv.delayRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fleet Capacity:</span>
                      <span className="text-emerald-400 font-medium">{srv.dailyCapacity}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400 font-mono">STATUS: OPERATIONAL</span>
                  <button
                    onClick={() => handleLaunchModal(srv)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Automation</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Tasks & Queue Monitor with Real Controls */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white">Active Farm Automation Tasks</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">{farmTasks.length} TASKS MONITORED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">Service</th>
                <th className="py-3 px-4 font-medium">Target URL</th>
                <th className="py-3 px-4 font-medium">Progress</th>
                <th className="py-3 px-4 font-medium">Nodes</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {farmTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                    {task.serviceName}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-cyan-400/90 max-w-[220px] truncate">
                    <a href={task.targetUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      <span className="truncate">{task.targetUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span>{task.executed} / {task.target}</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (task.executed / task.target) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">
                    {task.assignedNodes} nodes
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex gap-1.5">
                      {task.status === 'RUNNING' ? (
                        <button
                          onClick={() => pauseTask(task.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-mono flex items-center gap-1"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </button>
                      ) : task.status === 'PAUSED' ? (
                        <button
                          onClick={() => resumeTask(task.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-mono flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Resume</span>
                        </button>
                      ) : null}
                      <button
                        onClick={() => cancelTask(task.id)}
                        className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-[10px] transition-colors"
                        title="Cancel task"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Launch Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
                  <selectedService.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Dispatch {selectedService.name}</h3>
                  <p className="text-[11px] text-slate-400">Target TikTok video or live URL</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Target TikTok / Douyin URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.tiktok.com/@username/video/1234567890"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Target Quantity ({selectedService.type === 'LIVE_VIEW' ? 'Concurrent Viewers' : 'Actions'})
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedService.type === 'LIVE_VIEW' ? 50 : 500}
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Delays will be naturally jittered between {selectedService.delayRange}.
                </span>
              </div>

              {selectedService.type === 'COMMENT' && (
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Comment Tone & Niche</label>
                  <select
                    value={commentNiche}
                    onChange={(e) => setCommentNiche(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="TECH">Technology & AI SaaS</option>
                    <option value="FITNESS">Fitness & Health Motivation</option>
                    <option value="LIFESTYLE">Lifestyle & Daily Routine</option>
                    <option value="FINANCE">Personal Finance & Productivity</option>
                    <option value="GENERIC">Organic High-Engagement Reaction</option>
                  </select>
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Farm Nodes Allocated:</span>
                  <span className="text-cyan-400">{Math.min(Math.ceil(targetCount / 10), accounts.length || 5)} accounts</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Execution Window:</span>
                  <span className="text-slate-300">~{Math.max(5, Math.round(targetCount * 1.2))} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Safety Compliance Gate:</span>
                  <span className="text-emerald-400">PASSED (Within Caps)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Dispatch Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}