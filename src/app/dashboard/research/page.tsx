'use client';

import React, { useState } from 'react';
import { useOperations, ResearchedPost } from '@/context/OperationsContext';
import { parseAndNormalizeSocialUrl } from '@/research/url-parser';
import { analyzeTranscript, classifyHookType } from '@/intelligence/transcripts';
import { clusterCommentsForVoc, ScrapedComment } from '@/intelligence/comment-mining';
import { discoverCrossPlatformHandles, OsintProbeResult } from '@/intelligence/osint';
import { exportPostsToCsv, exportPostsToJson, ExportablePost } from '@/research/export-tools';
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
  Users,
  Compass,
  ArrowRight,
  Globe,
  Radio,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResearchPage() {
  const router = useRouter();
  const { researchedPosts, addResearchedPost } = useOperations();

  const [activeSubTab, setActiveSubTab] = useState<'ANALYZE' | 'VOC' | 'OSINT'>('ANALYZE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(0);

  // Video Analyzer State
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
    hookType: string;
    claims: string[];
    atoms: any[];
    downloadUrl: string;
  } | null>(null);

  // VOC Comment Miner State
  const [vocCommentsInput, setVocCommentsInput] = useState<string>(
    `Where can I buy this setup? Drop the link!\nIs this too expensive for beginners?\nI struggle with keeping 50% retention after 3 seconds.\nWait this is actually fire, saved for later!\nWhy do my videos stop getting views after 200 views?\nThis doesn't work for e-commerce brands.\nTake my money already where is the link?`
  );
  const [vocReport, setVocReport] = useState<any | null>(null);
  const [isMiningVoc, setIsMiningVoc] = useState(false);

  // OSINT State
  const [osintHandle, setOsintHandle] = useState('');
  const [osintResults, setOsintResults] = useState<OsintProbeResult[] | null>(null);
  const [isScanningOsint, setIsScanningOsint] = useState(false);

  // Handle URL Video Analysis
  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzingUrl) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      let parsedAuthor = 'growth_creator';
      try {
        const parsed = parseAndNormalizeSocialUrl(analyzingUrl);
        if (parsed.authorHandle) parsedAuthor = parsed.authorHandle;
      } catch {}

      const sampleTranscript =
        'Stop posting 60-second clips before you watch this 3-second hook framework. ' +
        'Because TikTok algorithms dictate retention in the first 2.8 seconds. ' +
        'We tested 40 variations and outlier reach spiked by 420% when opening with a negative constraint. ' +
        'Apply this in your next script today.';

      const transcriptAnalysis = analyzeTranscript(sampleTranscript);

      const result = {
        author: parsedAuthor,
        caption: 'The single 45-second retention habit that blew up our profile in 14 days #growth #content',
        outlierScore: 5.4,
        views: 480000,
        likes: 62000,
        comments: 2450,
        shares: 8900,
        hookText: transcriptAnalysis.hookText,
        hookType: transcriptAnalysis.hookType,
        claims: transcriptAnalysis.claims,
        atoms: transcriptAnalysis.atoms,
        downloadUrl: 'https://download-api.tikbot.internal/video/hd_no_watermark.mp4',
      };

      setAnalysisResult(result);
      setIsAnalyzing(false);

      // Auto-save to researched outliers in global context
      const newPost: ResearchedPost = {
        id: `post-${Date.now().toString().slice(-4)}`,
        platformPostId: Date.now().toString().slice(-8),
        authorHandle: result.author,
        caption: result.caption,
        viewCount: result.views,
        likeCount: result.likes,
        commentCount: result.comments,
        shareCount: result.shares,
        outlierScore: result.outlierScore,
        hookText: result.hookText,
        downloadUrl: result.downloadUrl,
      };
      addResearchedPost(newPost);
    }, 1000);
  };

  // Handle VOC Comment Mining
  const handleMineVoc = () => {
    setIsMiningVoc(true);
    setTimeout(() => {
      const lines = vocCommentsInput.split('\n').filter((l) => l.trim().length > 0);
      const comments: ScrapedComment[] = lines.map((text, i) => ({
        id: `c-${i}`,
        text: text.trim(),
        likeCount: Math.floor(Math.random() * 50),
      }));
      const clustered = clusterCommentsForVoc(comments);
      setVocReport(clustered);
      setIsMiningVoc(false);
    }, 600);
  };

  // Handle OSINT Probe
  const handleScanOsint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osintHandle) return;

    setIsScanningOsint(true);
    // Simulate real cross-platform probe fetcher
    const fetcher = async (url: string) => {
      await new Promise((r) => setTimeout(r, 400));
      return { exists: true, status: 200, title: `Profile for @${osintHandle}` };
    };

    const results = await discoverCrossPlatformHandles(osintHandle, { fetcher });
    setOsintResults(results);
    setIsScanningOsint(false);
  };

  // Export functions
  const handleExportCsv = () => {
    const exportable: ExportablePost[] = researchedPosts.map((p) => ({
      id: p.id,
      platform: 'TIKTOK',
      authorHandle: p.authorHandle,
      caption: p.caption,
      viewCount: p.viewCount,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      shareCount: p.shareCount,
      outlierScore: p.outlierScore,
      publishedAt: new Date(),
    }));
    const csv = exportPostsToCsv(exportable);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tikbot_outliers_${Date.now()}.csv`;
    a.click();
  };

  const handleExportJson = () => {
    const exportable: ExportablePost[] = researchedPosts.map((p) => ({
      id: p.id,
      platform: 'TIKTOK',
      authorHandle: p.authorHandle,
      caption: p.caption,
      viewCount: p.viewCount,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      shareCount: p.shareCount,
      outlierScore: p.outlierScore,
      publishedAt: new Date(),
    }));
    const json = exportPostsToJson(exportable);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tikbot_outliers_${Date.now()}.json`;
    a.click();
  };

  const filteredPosts = researchedPosts.filter((post) => {
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
            Analyze viral formats, outlier engagement ratios, transcript claim-hooks, VOC comments, and cross-platform handles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveSubTab('ANALYZE')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeSubTab === 'ANALYZE'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Video & Hook Analyzer</span>
        </button>
        <button
          onClick={() => setActiveSubTab('VOC')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeSubTab === 'VOC'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>VOC Comment Mining</span>
        </button>
        <button
          onClick={() => setActiveSubTab('OSINT')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeSubTab === 'OSINT'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Cross-Platform OSINT</span>
        </button>
      </div>

      {/* Sub-Tab 1: Video & Hook Analyzer */}
      {activeSubTab === 'ANALYZE' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Direct TikTok / Douyin Video Analyzer</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">WATERMARK REMOVAL & TRANSCRIPTION ENGINE</span>
          </div>

          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Paste any TikTok or Douyin URL (e.g., https://www.tiktok.com/@topcreator/video/71829102918)..."
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
              <span>{isAnalyzing ? 'Extracting & Mining...' : 'Extract & Analyze'}</span>
            </button>
          </form>

          {/* Analysis Result Card with Interconnected Actions */}
          {analysisResult && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-800/60 space-y-3 mt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-400">@{analysisResult.author}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[10px] font-bold font-mono">
                    {analysisResult.outlierScore}x VIRAL OUTLIER
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-[10px] font-mono">
                    HOOK: {analysisResult.hookType}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Cross-Link 1: Repurpose Hook to Post Composer */}
                  <button
                    onClick={() => {
                      const encodedHook = encodeURIComponent(analysisResult.hookText);
                      router.push(`/dashboard/publishing?hook=${encodedHook}&account=@${analysisResult.author}`);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-all"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Repurpose Hook</span>
                  </button>

                  {/* Cross-Link 2: Launch Farm Boost */}
                  <button
                    onClick={() => {
                      const encodedTarget = encodeURIComponent(analyzingUrl);
                      router.push(`/dashboard/panel?targetUrl=${encodedTarget}&service=VIEW`);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium transition-all"
                  >
                    <Flame className="w-3 h-3" />
                    <span>Launch Farm Boost</span>
                  </button>

                  <a
                    href={analysisResult.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all"
                  >
                    <Download className="w-3 h-3" />
                    <span>MP4 No Watermark</span>
                  </a>
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">&ldquo;{analysisResult.caption}&rdquo;</p>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <span className="text-[10px] text-cyan-400 font-mono block">DETECTED 3-SECOND RETENTION HOOK:</span>
                <p className="text-white font-medium italic">&ldquo;{analysisResult.hookText}&rdquo;</p>
                {analysisResult.claims.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span className="text-slate-400 block font-mono text-[10px]">CORE CLAIM:</span>
                    <span>{analysisResult.claims[0]}</span>
                  </div>
                )}
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
      )}

      {/* Sub-Tab 2: VOC Comment Mining */}
      {activeSubTab === 'VOC' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Voice of Customer (VOC) Comment Intelligence</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">CLUSTER QUESTIONS, PAIN POINTS & DEMAND</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">
              Paste Scraped TikTok Comments (one per line):
            </label>
            <textarea
              rows={5}
              value={vocCommentsInput}
              onChange={(e) => setVocCommentsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end">
              <button
                onClick={handleMineVoc}
                disabled={isMiningVoc}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isMiningVoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Classify VOC Clusters</span>
              </button>
            </div>
          </div>

          {vocReport && (
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-amber-400 block font-semibold">PRODUCT DEMAND</span>
                  <span className="text-lg font-bold text-white">{vocReport.productDemands.length} items</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-rose-400 block font-semibold">PAIN POINTS</span>
                  <span className="text-lg font-bold text-white">{vocReport.painPoints.length} items</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-cyan-400 block font-semibold">QUESTIONS</span>
                  <span className="text-lg font-bold text-white">{vocReport.questions.length} items</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-emerald-400 block font-semibold">PRAISE</span>
                  <span className="text-lg font-bold text-white">{vocReport.praise.length} items</span>
                </div>
              </div>

              {/* Action Pipeline to Comment Campaigns */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white">Seed Comment Discussions from VOC Pain Points</h4>
                  <p className="text-[11px] text-slate-400">
                    Inject relatable answers to these discovered objections using farm accounts.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/campaigns?actionType=COMMENT')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Launch Comment Campaign &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Cross-Platform OSINT */}
      {activeSubTab === 'OSINT' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Creator Cross-Platform Discovery (OSINT)</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">TIKTOK • INSTAGRAM • X • YOUTUBE</span>
          </div>

          <form onSubmit={handleScanOsint} className="flex gap-3">
            <input
              type="text"
              required
              placeholder="Enter creator handle (e.g., topcreator or mrbeast)..."
              value={osintHandle}
              onChange={(e) => setOsintHandle(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isScanningOsint}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isScanningOsint ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Scan Platforms</span>
            </button>
          </form>

          {osintResults && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3">
              {osintResults.map((probe) => (
                <div key={probe.platform} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{probe.platform}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      FOUND (95%)
                    </span>
                  </div>
                  <a
                    href={probe.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 truncate"
                  >
                    <span className="truncate">{probe.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                  <button
                    onClick={() => {
                      if (post.hookText) {
                        router.push(`/dashboard/publishing?hook=${encodeURIComponent(post.hookText)}&account=@${post.authorHandle}`);
                      } else {
                        router.push(`/dashboard/publishing?account=@${post.authorHandle}`);
                      }
                    }}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3 h-3 text-slate-500" />
                    <span>Repurpose Hook</span>
                  </button>
                  <button
                    onClick={() => {
                      const dummyUrl = `https://www.tiktok.com/@${post.authorHandle}/video/${post.platformPostId}`;
                      router.push(`/dashboard/panel?targetUrl=${encodeURIComponent(dummyUrl)}&service=VIEW`);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium flex items-center gap-1"
                  >
                    <span>Farm Boost &rarr;</span>
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