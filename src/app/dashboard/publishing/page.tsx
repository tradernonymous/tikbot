'use client';

import React, { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { AccessibleModal } from '@/components/AccessibleModal';
import { NotImplementedCard } from '@/components/NotImplementedCard';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EntityDrawer } from '@/components/EntityDrawer';
import { useOperations, PublishJob, MediaAsset } from '@/context/OperationsContext';
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
  ExternalLink,
  Flame,
  Layers,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function PublishingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = searchParams ? searchParams.get('focus') : null;
  const {
    publishJobs,
    schedulePublishJob,
    approvePublishJob,
    rejectPublishJob,
    publishNow,
    mediaAssets,
    accounts,
  } = useOperations();

  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [drawerJob, setDrawerJob] = useState<PublishJob | null>(null);
  const [caption, setCaption] = useState('');
  const [targetAccount, setTargetAccount] = useState<string>('@organic_growth_hacker');
  const [platform, setPlatform] = useState<'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE_SHORTS'>('TIKTOK');
  const [autoBoostOnPublish, setAutoBoostOnPublish] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (focusId) {
      const target = publishJobs.find((j) => j.id === focusId);
      if (target) {
        setDrawerJob(target);
      }
    }
  }, [focusId, publishJobs]);

  const handleCloseDrawer = () => {
    setDrawerJob(null);
    if (searchParams && searchParams.has('focus')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('focus');
      const remaining = params.toString();
      router.replace(remaining ? `?${remaining}` : window.location.pathname, { scroll: false });
    }
  };

  // Pre-fill hook from research tab if present in query params
  useEffect(() => {
    const hookParam = searchParams.get('hook');
    const accountParam = searchParams.get('account');
    if (hookParam) {
      setCaption(`${decodeURIComponent(hookParam)} #viral #fyp #growth`);
      setShowScheduleModal(true);
    }
    if (accountParam) {
      setTargetAccount(accountParam);
    }
  }, [searchParams]);

  const charLimit = platform === 'YOUTUBE_SHORTS' ? 100 : 2200;

  const filteredMedia = mediaAssets.filter((asset) => {
    if (selectedFolder === 'ALL') return true;
    return asset.folder === selectedFolder;
  });

  const handleApprove = (id: string) => {
    approvePublishJob(id);
    setToastMessage('Publish job authorized and scheduled for auto-upload.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReject = (id: string) => {
    rejectPublishJob(id);
    setToastMessage('Publish job rejected and slot freed.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption) return;

    schedulePublishJob({
      title: caption,
      account: targetAccount,
      platform,
      scheduledAt: 'Scheduled (Awaiting Approval)',
    });

    setToastMessage('Post scheduled and placed in manual approval queue.');
    setShowScheduleModal(false);
    setCaption('');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const addTag = (tag: string) => {
    setCaption((prev) => `${prev} ${tag}`.trim());
  };

  return (
    <SectionErrorBoundary sectionName="Content & Auto-Publishing">
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
            <div className="text-lg font-bold text-white font-mono">{mediaAssets.length} Videos</div>
            <div className="text-[10px] text-cyan-400">9:16 Portrait Formatted</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-800/50 text-indigo-400">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Folders</div>
            <div className="text-lg font-bold text-white font-mono">3 Categories</div>
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
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {publishJobs.filter((p) => p.status === 'PUBLISHED').length} Live
            </div>
            <div className="text-[10px] text-slate-400">TiktokAutoUploader</div>
          </div>
        </div>
      </div>

      {/* Media Assets Reel & Folder Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Media Library Assets (9:16 Portrait Ready)</h3>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {['ALL', 'Hooks', 'Demos', 'Teasers'].map((folder) => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedFolder === folder
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {folder}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredMedia.map((asset) => (
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
                    setCaption(`Check out this breakdown: ${asset.title} #viral #fyp`);
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

      {/* Automated Uploader Status Banner */}
      <NotImplementedCard
        featureName="Automated Headless Video Publisher"
        explanation="Direct headless video uploading requires an audited Content Posting API app (video.publish scope) or authenticated Playwright stealth runner. Fake instant publishing has been eliminated."
        issueNumber="3"
        issueUrl="https://github.com/tikbot/tikbot/issues/3"
      />

      {/* Publishing Queue Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Publishing Schedule & Approval Queue</span>
          <span className="text-xs text-slate-400 font-mono">
            {publishJobs.length} SLOTS PLANNED
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          {publishJobs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Publishing Slots Scheduled"
                description="The publishing queue is empty. Use the post composer or select an asset from the media library to schedule a slot."
                actionText="Schedule Post"
                onAction={() => setShowScheduleModal(true)}
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
                <tr className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-4 font-medium">Caption / Hook</th>
                  <th className="py-3 px-4 font-medium">Platform</th>
                  <th className="py-3 px-4 font-medium">Target Account</th>
                  <th className="py-3 px-4 font-medium">Scheduled Time</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Approval & Publish Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {publishJobs.map((job) => {
                  const isFocused = job.id === focusId;
                  return (
                  <tr
                    key={job.id}
                    onClick={() => {
                      setDrawerJob(job);
                      router.replace(`?focus=${job.id}`, { scroll: false });
                    }}
                    className={`hover:bg-slate-800/20 transition-colors cursor-pointer ${
                      isFocused ? 'bg-cyan-950/40 ring-1 ring-cyan-500' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-white max-w-[280px] truncate">
                      {job.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-indigo-400">{job.platform}</td>
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
                      ) : job.status === 'SCHEDULED' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-cyan-400 text-[10px] font-mono">
                          <Clock className="w-3 h-3" />
                          <span>Queued for Worker</span>
                        </div>
                      ) : job.status === 'PUBLISHED' ? (
                        <div className="inline-flex items-center gap-2">
                          <a
                            href={job.publishedUrl || 'https://www.tiktok.com'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline text-[11px] font-mono flex items-center gap-1"
                          >
                            <span>Live Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => {
                              const urlToBoost = job.publishedUrl || 'https://www.tiktok.com';
                              router.push(`/dashboard/panel?targetUrl=${encodeURIComponent(urlToBoost)}&service=VIEW`);
                            }}
                            className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[10px] font-semibold"
                          >
                            Boost
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500">CANCELLED</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Schedule Post Composer Modal */}
      <AccessibleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Post Composer & Scheduler"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Target Account Node</label>
              <select
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={`@${acc.username}`}>
                    @{acc.username} ({acc.platform})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Publishing Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="TIKTOK">TikTok (9:16)</option>
                <option value="INSTAGRAM">Instagram Reels</option>
                <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-medium">Caption & Viral Hashtags</label>
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
            <div className="flex items-center justify-between">
              <span>Auto-Launch Farm Boost on Publish:</span>
              <input
                type="checkbox"
                checked={autoBoostOnPublish}
                onChange={(e) => setAutoBoostOnPublish(e.target.checked)}
                className="accent-cyan-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Publishing Bridge:</span>
              <span className="text-slate-300 font-medium">TiktokAutoUploader Headless</span>
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
              <span>Queue for Operator Sign-Off</span>
            </button>
          </div>
        </form>
      </AccessibleModal>

      <EntityDrawer
        isOpen={Boolean(drawerJob)}
        onClose={handleCloseDrawer}
        entityType="publish_job"
        data={drawerJob}
      />
    </div>
  </SectionErrorBoundary>
  );
}