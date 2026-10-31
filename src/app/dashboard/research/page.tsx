'use client';

import React, { useState } from 'react';
import { getDevFixtures } from '@/fixtures';
import {
  Search,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Play,
  Filter,
  Download,
  Music,
  FileText,
  Share2,
  ExternalLink,
  Flame,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function ResearchPage() {
  const fixtures = getDevFixtures();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(0);
  const [analyzingUrl, setAnalyzingUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    author: string;
    caption: string;
    outlierScore: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    hookText: string;
    downloadUrl: string;
    audioUrl: string;
  } | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzingUrl) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        author: 'ai_growth_lab',
        caption: 'The single 45-second retention habit that blew up our TikTok profile in 14 days.',
        outlierScore: 5.4,
        views: 340000,
        likes: 42000,
        comments: 1850,
        shares: 6200,
        hookText: 'Stop posting 60-second clips before you watch this 3-second hook framework.',
        downloadUrl: 'https://download-api.tikbot.internal/video/hd_no_watermark.mp4',
        audioUrl: 'https://download-api.tikbot.internal/audio/original_soundtrack.mp3',
      });
    }, 1200);
  };

  const filteredPosts = fixtures.posts.filter((post) => {
    if (selectedMultiplier > 0 && post.outlierScore < selectedMultiplier) return false;
    if (
      searchQuery &&
      !post.caption.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !post.authorHandle.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Research Intelligence & Outlier Radar</h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze viral formats, outlier engagement ratios, transcript claim-hooks, and watermark-free video downloads.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Self-Hosted Douyin/TikTok Download Engine: ACTIVE</span>
        </div>
      </div>

      {/* Live URL Scraper & Watermark-Free Downloader */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Direct TikTok / Douyin Video Analyzer</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">WATERMARK REMOVAL & TRANSCRIPTION</span>
        </div>

        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Paste any TikTok or Douyin URL (e.g., https://www.tiktok.com/@creator/video/12345)..."
              value={analyzingUrl}
              onChange={(e) => setAnalyzingUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all shrink-0 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isAnalyzing ? 'Extracting...' : 'Extract & Analyze'}</span>
          </button>
        </form>

        {/* Live Analysis Teardown Result Card */}
        {analysisResult && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-800/60 space-y-3 mt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400">@{analysisResult.author}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[10px] font-bold font-mono">
                  {analysisResult.outlierScore}x VIRAL OUTLIER
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/panel"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium transition-all"
                >
                  <Flame className="w-3 h-3" />
                  <span>Launch Farm Boost</span>
                </Link>
                <a
                  href={analysisResult.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all"
                >
                  <Download className="w-3 h-3" />
                  <span>Download MP4</span>
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans">&ldquo;{analysisResult.caption}&rdquo;</p>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] text-cyan-400 font-mono block">DETECTED 3-SECOND HOOK:</span>
              <p className="text-slate-300 italic">&ldquo;{analysisResult.hookText}&rdquo;</p>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs pt-1">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">VIEWS</span>
                <span className="font-semibold text-white">{(analysisResult.views / 1000).toFixed(0)}k</span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">LIKES</span>
                <span className="font-semibold text-emerald-400">{(analysisResult.likes / 1000).toFixed(0)}k</span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">COMMENTS</span>
                <span className="font-semibold text-cyan-400">{analysisResult.comments}</span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SHARES</span>
                <span className="font-semibold text-purple-400">{analysisResult.shares}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Outlier Radar Filter & Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Discovered Outlier Posts ({filteredPosts.length})</h3>
          </div>

          {/* Multiplier Pills */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[11px] mr-1">Outlier Tier:</span>
            {[0, 2.0, 3.0, 4.0].map((mult) => (
              <button
                key={mult}
                onClick={() => setSelectedMultiplier(mult)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedMultiplier === mult
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {mult === 0 ? 'All' : `${mult}x+`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => (
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
                    <span className="text-slate-400 block text-[9px] uppercase">Views</span>
                    <span className="font-semibold text-white">{(post.viewCount / 1000).toFixed(0)}k</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Likes</span>
                    <span className="font-semibold text-emerald-400">{(post.likeCount / 1000).toFixed(0)}k</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Comments</span>
                    <span className="font-semibold text-cyan-400">{post.commentCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-slate-500" />
                    <span>Whisper Hook Mined</span>
                  </span>
                  <Link
                    href="/dashboard/panel"
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium flex items-center gap-1"
                  >
                    <span>Farm Boost &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
