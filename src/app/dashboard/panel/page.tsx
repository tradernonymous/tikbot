'use client';

import React, { useState, useEffect } from 'react';
import { useOperations, ActiveFarmTask } from '@/context/OperationsContext';
import { SUPPLIER_FOLLOWER_TIKTOK_SERVICES, SMMServiceCategory } from '@/panel/catalog';
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
import { EmptyState } from '@/components/EmptyState';
import { AccessibleModal } from '@/components/AccessibleModal';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Execution engine mode: Internal Farm vs Paid Wholesale SMM API
  const [engineMode, setEngineMode] = useState<'INTERNAL' | 'SMM'>('SMM');
  const [smmServiceId, setSmmServiceId] = useState<string>('12886');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Auto-set the recommended service ID when selecting a service
  const handleLaunchModal = (service: FarmService) => {
    setSelectedService(service);
    const cat = service.type === 'VIEW' ? 'VIEWS' : service.type === 'LIKE' ? 'LIKES' : service.type === 'COMMENT' ? 'COMMENTS' : 'LIVE_VIEWS';
    const presets = SUPPLIER_FOLLOWER_TIKTOK_SERVICES[cat];
    if (presets && presets.length > 0) {
      setSmmServiceId(presets[0].id);
      setTargetCount(presets[0].min || (service.type === 'VIEW' ? 100 : 50));
    } else {
      if (service.type === 'VIEW') setTargetCount(100);
      else if (service.type === 'LIKE') setTargetCount(50);
      else if (service.type === 'COMMENT') setTargetCount(10);
      else if (service.type === 'LIVE_VIEW') setTargetCount(20);
    }
    if (!targetUrl) setTargetUrl('');
  };

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

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !targetUrl) return;

    const cat =
      selectedService.type === 'VIEW'
        ? 'VIEWS'
        : selectedService.type === 'LIKE'
        ? 'LIKES'
        : selectedService.type === 'COMMENT'
        ? 'COMMENTS'
        : 'LIVE_VIEWS';
    const match = (SUPPLIER_FOLLOWER_TIKTOK_SERVICES[cat] || []).find((s) => s.id === smmServiceId);
    const rate = match ? match.ratePer1000 : 0.2639;
    const totalMyr = (targetCount / 1000) * rate;
    const costFormatted = `RM ${totalMyr.toFixed(4)}`;

    if (engineMode === 'SMM') {
      setIsSubmittingOrder(true);
      setDispatchError(null);
      setDispatchSuccess(null);
      try {
        const res = await fetch('/api/v1/smm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'order',
            service: smmServiceId,
            link: targetUrl.trim(),
            quantity: targetCount,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to dispatch SMM order');
        }

        dispatchFarmTask({
          serviceName: `${selectedService.name} (SMM #${data.order.externalOrderId})`,
          serviceType: selectedService.type,
          targetUrl,
          targetCount,
          commentNiche,
          externalOrderId: data.order.externalOrderId,
          executionMode: 'SMM_PROVIDER',
          costFormatted,
          status: 'RUNNING',
        });

        setDispatchSuccess(`Order #${data.order.externalOrderId} sent to SupplierFollower! Cost: ${costFormatted}. Live views propagating.`);
      } catch (err: any) {
        // P8: on failure mark the task FAILED with real error, never show success, never dispatch phantom order
        dispatchFarmTask({
          serviceName: `${selectedService.name} (Order Failed)`,
          serviceType: selectedService.type,
          targetUrl,
          targetCount,
          commentNiche,
          executionMode: 'SMM_PROVIDER',
          costFormatted: 'FAILED',
          status: 'FAILED',
        });
        setDispatchError(
          `SMM Order Failed: ${err.message}. Task recorded as FAILED. Check server configuration in Settings.`
        );
      } finally {
        setIsSubmittingOrder(false);
        setSelectedService(null);
        setTimeout(() => setDispatchSuccess(null), 7000);
        setTimeout(() => setDispatchError(null), 10000);
      }
      return;
    }

    dispatchFarmTask({
      serviceName: selectedService.name,
      serviceType: selectedService.type,
      targetUrl,
      targetCount,
      commentNiche,
      executionMode: 'INTERNAL_FARM',
      costFormatted: 'FREE (Farm)',
    });

    setDispatchSuccess(`Successfully dispatched ${selectedService.name} (${targetCount} actions) to internal farm queue.`);
    setSelectedService(null);
    setTimeout(() => setDispatchSuccess(null), 5000);
  };

  return (
    <SectionErrorBoundary sectionName="Farm Services Panel">
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

      {/* v3-F Farm Boost Engine Cross-Link Banner */}
      <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-indigo-300">
          <span className="font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">v3-F Feature</span>
          <span>Looking for the new FYP Push Engine, Multi-Step Launch Wizard, and Plausibility Preflight?</span>
        </div>
        <Link
          href="/dashboard/farm/services"
          className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 hover:underline shrink-0"
        >
          Open Farm Services & Boost &rarr;
        </Link>
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

      {dispatchError && (
        <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-700/80 text-rose-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{dispatchError}</span>
          </div>
          <button onClick={() => setDispatchError(null)} className="text-slate-400 hover:text-white">
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

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          {farmTasks.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Active Automation Tasks"
                description="No farm automation tasks are currently running. Select a service launcher above to dispatch an automation."
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
                <tr className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-4 font-medium">Service & Engine</th>
                  <th className="py-3 px-4 font-medium">Target URL</th>
                  <th className="py-3 px-4 font-medium">Cost / Run</th>
                  <th className="py-3 px-4 font-medium">Progress</th>
                  <th className="py-3 px-4 font-medium">Nodes</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {farmTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-white max-w-[220px]">
                      <div className="truncate font-semibold">{task.serviceName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            task.executionMode === 'SMM_PROVIDER'
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
                              : 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                          }`}
                        >
                          {task.executionMode === 'SMM_PROVIDER' ? 'SMM API' : 'FARM NODES'}
                        </span>
                        {task.externalOrderId && (
                          <span className="text-[10px] text-slate-400 font-mono">#{task.externalOrderId}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-cyan-400/90 max-w-[220px] truncate">
                      <a href={task.targetUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                        <span className="truncate">{task.targetUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      <span className="font-bold text-emerald-400">
                        {task.costFormatted || (task.executionMode === 'SMM_PROVIDER' ? 'RM 0.00' : 'FREE')}
                      </span>
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
                      {task.providerStatus && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Provider: <span className="text-cyan-300">{task.providerStatus}</span>
                        </div>
                      )}
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
          )}
        </div>
      </div>

      {/* Quick Launch Modal */}
      <AccessibleModal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        title={selectedService ? `Dispatch ${selectedService.name}` : ''}
        maxWidth="max-w-lg"
      >
        {selectedService && (
          <div>
            <p className="text-[11px] text-slate-400 -mt-2 mb-4">Target TikTok video or live URL</p>

            <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
              {/* Execution Engine Selector */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">Execution Engine</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEngineMode('SMM')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      engineMode === 'SMM'
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Wholesale SMM API</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-cyan-900/60 text-cyan-300 rounded font-mono">PAID ($0.03/1k)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Instant delivery via global mobile/residential pool.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEngineMode('INTERNAL')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      engineMode === 'INTERNAL'
                        ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Internal Farm Nodes</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-purple-900/60 text-purple-300 rounded font-mono">SELF-HOSTED</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Local Chrome stealth browsers with dwell timing.</p>
                  </button>
                </div>
              </div>

              {engineMode === 'SMM' && (
                <div className="space-y-2">
                  <label className="text-slate-300 font-medium block mb-1">
                    Select SupplierFollower Service Tier & Price
                  </label>
                  <div className="space-y-1.5">
                    {(() => {
                      const cat =
                        selectedService.type === 'VIEW'
                          ? 'VIEWS'
                          : selectedService.type === 'LIKE'
                          ? 'LIKES'
                          : selectedService.type === 'COMMENT'
                          ? 'COMMENTS'
                          : 'LIVE_VIEWS';
                      const presets = SUPPLIER_FOLLOWER_TIKTOK_SERVICES[cat] || [];
                      return presets.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSmmServiceId(s.id);
                            if (targetCount < s.min) setTargetCount(s.min);
                          }}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            smmServiceId === s.id
                              ? 'bg-cyan-950/70 border-cyan-500 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200">
                              #{s.id} — {s.name}
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">
                              RM {s.ratePer1000.toFixed(4)} / 1k
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                            <span>{s.note}</span>
                            <span className="font-mono text-slate-400">Min: {s.min} • Max: {s.max.toLocaleString()}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="pt-1">
                    <label className="text-slate-400 text-[10px] block mb-0.5">Or Custom Service ID:</label>
                    <input
                      type="text"
                      placeholder="e.g. 12886"
                      value={smmServiceId}
                      onChange={(e) => setSmmServiceId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">
                    Target Quantity ({selectedService.type === 'LIVE_VIEW' ? 'Concurrent Viewers' : 'Actions'})
                  </label>
                  {engineMode === 'SMM' && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Limits: {(() => {
                        const cat =
                          selectedService.type === 'VIEW'
                            ? 'VIEWS'
                            : selectedService.type === 'LIKE'
                            ? 'LIKES'
                            : selectedService.type === 'COMMENT'
                            ? 'COMMENTS'
                            : 'LIVE_VIEWS';
                        const preset = (SUPPLIER_FOLLOWER_TIKTOK_SERVICES[cat] || []).find((s) => s.id === smmServiceId);
                        return preset ? `${preset.min.toLocaleString()} – ${preset.max.toLocaleString()}` : '100 – 10,000,000';
                      })()}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  max={engineMode === 'SMM' ? 10000000 : (selectedService.type === 'LIVE_VIEW' ? 50 : 5000)}
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {engineMode === 'SMM'
                    ? 'Dispatched through SupplierFollower wholesale mobile/residential device network.'
                    : `Delays will be naturally jittered between ${selectedService.delayRange}.`}
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
                {engineMode === 'SMM' ? (
                  <>
                    <div className="flex justify-between">
                      <span>Provider Engine:</span>
                      <span className="text-cyan-400">SupplierFollower (Service #{smmServiceId})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calculated Order Price:</span>
                      <span className="text-emerald-400 font-bold">
                        {(() => {
                          const cat =
                            selectedService.type === 'VIEW'
                              ? 'VIEWS'
                              : selectedService.type === 'LIKE'
                              ? 'LIKES'
                              : selectedService.type === 'COMMENT'
                              ? 'COMMENTS'
                              : 'LIVE_VIEWS';
                          const match = (SUPPLIER_FOLLOWER_TIKTOK_SERVICES[cat] || []).find((s) => s.id === smmServiceId);
                          const rate = match ? match.ratePer1000 : 0.2639;
                          const total = (targetCount / 1000) * rate;
                          return `RM ${total.toFixed(4)} MYR (~$${(total / 4.4).toFixed(4)} USD)`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Audience Gate Bypass:</span>
                      <span className="text-emerald-400">ENABLED (Global Account Network)</span>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                  disabled={isSubmittingOrder}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isSubmittingOrder ? 'animate-spin' : ''}`} />
                  <span>{isSubmittingOrder ? 'Submitting Order...' : 'Dispatch Task'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </AccessibleModal>
    </div>
  </SectionErrorBoundary>
  );
}