import React from 'react';
import { getDevFixtures } from '@/fixtures';
import { Search, Sparkles, TrendingUp, MessageSquare, Play, Filter } from 'lucide-react';

export default function ResearchPage() {
  const fixtures = getDevFixtures();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Research Intelligence & Outlier Radar</h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze viral formats, outlier engagement ratios, transcript claim-hooks, and voice-of-customer insights.
          </p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 backdrop-blur-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search creator handle (@handle), keyword topic, or hashtag..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Run Research Analysis</span>
        </button>
      </div>

      {/* Outlier Posts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Discovered Outlier Posts</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {fixtures.posts.length} ANALYZED OUTLIERS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fixtures.posts.map((post) => (
            <div
              key={post.id}
              className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-cyan-400">@{post.authorHandle}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold font-mono">
                    {post.outlierScore}x OUTLIER
                  </span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed mb-4">
                  &ldquo;{post.caption}&rdquo;
                </p>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-center font-mono text-[11px] mb-3">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Views</span>
                    <span className="font-semibold text-white">{(post.viewCount / 1000).toFixed(0)}k</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Likes</span>
                    <span className="font-semibold text-emerald-400">{(post.likeCount / 1000).toFixed(0)}k</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Comments</span>
                    <span className="font-semibold text-cyan-400">{post.commentCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-slate-500" />
                    <span>Transcript Extracted</span>
                  </span>
                  <button className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium flex items-center gap-1">
                    <span>Inspect Teardown</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
