import React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { getDevFixtures } from '@/fixtures';
import { Calendar, UploadCloud, Video, Clock, Check, X, Film, Folder } from 'lucide-react';

const DEV_MEDIA_ASSETS = [
  { id: 'asset-1', title: 'Viral Hook 01', size: '14.2 MB' },
  { id: 'asset-2', title: 'Product Showcase A', size: '28.5 MB' },
  { id: 'asset-3', title: 'Customer Interview Teaser', size: '8.9 MB' },
];

const DEV_PUBLISH_JOBS = [
  {
    id: 'pub-001',
    title: '3 productivity habits you need in 2026 #focus #hustle',
    scheduledAt: new Date('2026-11-01T14:00:00Z'),
    status: 'PENDING_APPROVAL',
  },
  {
    id: 'pub-002',
    title: 'Behind the scenes: Building viral AI dashboards #tech #saas',
    scheduledAt: new Date('2026-11-01T18:00:00Z'),
    status: 'READY',
  },
];

export default function PublishingPage() {
  const mediaAssets = DEV_MEDIA_ASSETS;
  const publishJobs = DEV_PUBLISH_JOBS;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Content & Publishing Operations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Media library, multi-platform composer, slot scheduler, and manual approval gate for TikTok auto-publishing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow-sm transition-all border border-slate-700">
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Media</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all">
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Post</span>
          </button>
        </div>
      </div>

      {/* Media Library Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Ready Assets</div>
            <div className="text-lg font-bold text-white font-mono">{mediaAssets.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-800/50 text-indigo-400">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Folders</div>
            <div className="text-lg font-bold text-white font-mono">4</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-800/50 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Queued Posts</div>
            <div className="text-lg font-bold text-white font-mono">{publishJobs.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Published</div>
            <div className="text-lg font-bold text-white font-mono">12</div>
          </div>
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
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">
                    acc_farm_primary
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-cyan-400">
                    {new Date(job.scheduledAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {job.status === 'PENDING_APPROVAL' ? (
                      <div className="inline-flex gap-2">
                        <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold transition-all">
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-semibold transition-all">
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
    </div>
  );
}
