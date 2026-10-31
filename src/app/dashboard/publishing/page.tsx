'use client';

import React, { useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Calendar,
  UploadCloud,
  Video,
  Clock,
  Check,
  X,
  Film,
  Folder,
  Plus,
  Play,
  CheckCircle2,
  Sparkles,
  Music,
} from 'lucide-react';

const INITIAL_MEDIA_ASSETS = [
  { id: 'asset-1', title: 'Viral Hook 01 — 3-Second Rule', size: '14.2 MB', duration: '15.4s', format: '9:16' },
  { id: 'asset-2', title: 'Product Showcase A — Workflow Demo', size: '28.5 MB', duration: '32.1s', format: '9:16' },
  { id: 'asset-3', title: 'Customer Interview Teaser', size: '8.9 MB', duration: '18.0s', format: '9:16' },
];

const INITIAL_PUBLISH_JOBS = [
  {
    id: 'pub-001',
    title: '3 productivity habits you need in 2026 #focus #hustle #fyp',
    scheduledAt: 'Tomorrow at 14:00 UTC',
    status: 'PENDING_APPROVAL' as const,
    account: '@growth_creator_01',
  },
  {
    id: 'pub-002',
    title: 'Behind the scenes: Building viral AI dashboards #tech #saas',
    scheduledAt: 'Nov 02 at 18:00 UTC',
    status: 'SCHEDULED' as const,
    account: '@tech_automation_bot',
  },
];

export default function PublishingPage() {
  const [publishJobs, setPublishJobs] = useState(INITIAL_PUBLISH_JOBS);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [platform, setPlatform] = useState<'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE_SHORTS'>('TIKTOK');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const charLimit = platform === 'YOUTUBE_SHORTS' ? 100 : 2200;

  const handleApprove = (id: string) => {
    setPublishJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'SCHEDULED' as const } : j))
    );
    setToastMessage('Publish job authorized and scheduled for auto-upload.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReject = (id: string) => {
    setPublishJobs((prev) => prev.filter((j) => j.id !== id));
    setToastMessage('Publish job rejected and cancelled.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption) return;

    const newJob = {
      id: `pub-${Date.now().toString().slice(-4)}`,
      title: caption,
      scheduledAt: 'Scheduled (Awaiting Approval)',
      status: 'PENDING_APPROVAL' as const,
      account: '@growth_creator_01',
    };

    setPublishJobs([newJob, ...publishJobs]);
    setToastMessage('Post scheduled and placed in manual approval queue.');
    setShowScheduleModal(false);
    setCaption('');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const addTag = (tag: string) => {
    setCaption((prev) => `${prev} ${tag}`.trim());
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Content & Auto-Publishing Operations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Media library, multi-platform composer, slot scheduler, and manual approval gate for TikTok auto-publishing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Post</span>
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

      {/* Media Library Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Ready Assets</div>
            <div className="text-lg font-bold text-white font-mono">{INITIAL_MEDIA_ASSETS.length} Videos</div>
            <div className="text-[10px] text-cyan-400">9:16 Portrait Formatted</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-800/50 text-indigo-400">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Folders</div>
            <div className="text-lg font-bold text-white font-mono">4 Folders</div>
            <div className="text-[10px] text-indigo-300">Hooks, Teasers, Demos</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-800/50 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Queued Slots</div>
            <div className="text-lg font-bold text-white font-mono">{publishJobs.length} Planned</div>
            <div className="text-[10px] text-amber-300">Within Hourly Caps</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Published</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">12 Posts</div>
            <div className="text-[10px] text-slate-400">TiktokAutoUploader</div>
          </div>
        </div>
      </div>

      {/* Media Assets Reel */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Media Library Assets (9:16 Portrait Ready)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INITIAL_MEDIA_ASSETS.map((asset) => (
            <div
              key={asset.id}
              className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                    {asset.format}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{asset.duration} • {asset.size}</span>
                </div>
                <h4 className="text-xs font-semibold text-white">{asset.title}</h4>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-800/60 flex justify-end">
                <button
                  onClick={() => {
                    setCaption(`Check out this new release! ${asset.title} #viral #fyp`);
                    setShowScheduleModal(true);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                >
                  Schedule this asset &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Publishing Queue Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Publishing Schedule & Approval Queue</span>
          <span className="text-xs text-slate-400 font-mono">
            {publishJobs.length} SLOTS PLANNED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">Caption / Hook</th>
                <th className="py-3 px-4 font-medium">Target Account</th>
                <th className="py-3 px-4 font-medium">Scheduled Time</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Approval Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {publishJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 font-medium text-white max-w-[280px] truncate">
                    {job.title}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-cyan-400">
                    {job.account}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-300">
                    {job.scheduledAt}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {job.status === 'PENDING_APPROVAL' ? (
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleApprove(job.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold transition-all"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(job.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-semibold transition-all"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-emerald-400">READY</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Post Composer Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Post Composer & Scheduler</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Target Publishing Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TIKTOK', 'INSTAGRAM', 'YOUTUBE_SHORTS'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                        platform === p
                          ? 'bg-cyan-600 text-white font-semibold'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {p === 'TIKTOK' ? 'TikTok' : p === 'INSTAGRAM' ? 'IG Reels' : 'YT Shorts'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-medium">Caption & Hashtags</label>
                  <span
                    className={`font-mono text-[10px] ${
                      caption.length > charLimit ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {caption.length} / {charLimit}
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your viral hook, caption, and hashtags here..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-xs focus:outline-none focus:border-cyan-500"
                />

                {/* Quick Hashtag Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-400">Quick Tags:</span>
                  {['#fyp', '#viral', '#trending', '#productivity', '#tech'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] font-mono transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Publishing Bridge:</span>
                  <span className="text-slate-300 font-medium">TiktokAutoUploader Headless</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Node:</span>
                  <span className="text-cyan-400 font-medium">@growth_creator_01 (Active Session)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={caption.length > charLimit}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Queue for Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
