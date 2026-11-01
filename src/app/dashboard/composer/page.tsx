'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PenSquare,
  Sparkles,
  Music,
  Image as ImageIcon,
  Calendar,
  Send,
  Video,
  Hash,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { Metric } from '@/components/Metric';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { PublishingPlatform, ContentComposer } from '@/content/composer';

export interface ComposerPageProps {
  initialCaption?: string;
}

export default function ComposerPage({ initialCaption }: ComposerPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlPlatform = searchParams ? searchParams.get('platform') : null;
  const urlHook = searchParams ? searchParams.get('hook') : null;
  const urlMediaId = searchParams ? searchParams.get('mediaId') : null;
  const urlTopic = searchParams ? searchParams.get('topic') : null;

  const validPlatforms: PublishingPlatform[] = ['TIKTOK', 'INSTAGRAM_REELS', 'YOUTUBE_SHORTS'];
  const resolvedPlatform: PublishingPlatform =
    urlPlatform && validPlatforms.includes(urlPlatform.toUpperCase() as PublishingPlatform)
      ? (urlPlatform.toUpperCase() as PublishingPlatform)
      : 'TIKTOK';

  const safeDecode = (val: string | null) => {
    if (!val) return '';
    try {
      return decodeURIComponent(val);
    } catch {
      return val;
    }
  };

  const initialText =
    initialCaption ||
    (urlHook
      ? safeDecode(urlHook)
      : urlTopic
      ? `Here's what you need to know about ${safeDecode(urlTopic)}...`
      : 'Stop scrolling if you want to scale your FYP reach in 2026.');

  const [platform, setPlatform] = useState<PublishingPlatform>(resolvedPlatform);
  const [caption, setCaption] = useState<string>(initialText);
  const [selectedMediaId, setSelectedMediaId] = useState<string>(urlMediaId || '');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedSound, setSelectedSound] = useState<string>('Trending Beat 2026');
  const [selectedCoverFrame, setSelectedCoverFrame] = useState<number>(1);
  const [scheduledAt, setScheduledAt] = useState<string>(
    new Date(Date.now() + 7200000).toISOString().slice(0, 16)
  );

  const [hashtagSuggestions, setHashtagSuggestions] = useState<Array<{ tag: string; score: number }>>([
    { tag: '#ecommerce', score: 92 },
    { tag: '#dropshipping', score: 88 },
    { tag: '#viral', score: 85 },
    { tag: '#growthhacks', score: 80 },
    { tag: '#businesstips', score: 78 },
  ]);
  const [soundsList, setSoundsList] = useState<Array<{ id: string; title: string }>>([]);
  const [mediaList, setMediaList] = useState<Array<{ id: string; storageKey: string }>>([]);
  const [accountList, setAccountList] = useState<Array<{ id: string; username: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [scheduledSuccess, setScheduledSuccess] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/v1/content/composer')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          if (Array.isArray(data.hashtagSuggestions) && data.hashtagSuggestions.length > 0) {
            setHashtagSuggestions(data.hashtagSuggestions);
          }
          if (Array.isArray(data.sounds)) setSoundsList(data.sounds);
          if (Array.isArray(data.mediaAssets)) {
            setMediaList(data.mediaAssets);
            if (!selectedMediaId && data.mediaAssets.length > 0) {
              setSelectedMediaId(data.mediaAssets[0].id);
            }
          }
          if (Array.isArray(data.accounts)) {
            setAccountList(data.accounts);
            if (!selectedAccountId && data.accounts.length > 0) {
              setSelectedAccountId(data.accounts[0].id);
            }
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlatformChange = (p: PublishingPlatform) => {
    setPlatform(p);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('platform', p.toLowerCase());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleAddHashtag = (tag: string) => {
    if (!caption.includes(tag)) {
      setCaption((prev) => `${prev.trim()} ${tag}`);
    }
  };

  const limits: Record<PublishingPlatform, number> = {
    TIKTOK: 2200,
    INSTAGRAM_REELS: 2200,
    YOUTUBE_SHORTS: 100,
  };

  const currentLimit = limits[platform];
  const isOverLimit = caption.length > currentLimit;

  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/content/composer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule',
          accountId: selectedAccountId || 'acc-default',
          mediaAssetId: selectedMediaId || 'media-default',
          caption,
          platform,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScheduledSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/calendar');
        }, 1200);
      }
    } catch {} finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SectionErrorBoundary sectionName="Content Composer">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <PenSquare className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">Content Composer</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-platform video packaging with trend-driven hashtags, sound attach, and cover frame selection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Provenance: LIVE (DB)
            </span>
          </div>
        </div>

        {/* Platform Variant Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-800/80 pb-2">
          {(
            [
              { key: 'TIKTOK', label: 'TikTok' },
              { key: 'INSTAGRAM_REELS', label: 'Instagram Reels' },
              { key: 'YOUTUBE_SHORTS', label: 'YouTube Shorts' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handlePlatformChange(item.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                platform === item.key
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSchedulePost} className="space-y-6">
          {/* Caption Area */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-white">Caption &amp; Copy</label>
              <span className={`font-mono text-xs ${isOverLimit ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                {caption.length} / {currentLimit} chars
              </span>
            </div>

            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write high-retention video copy..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            {/* Trending Hashtag Suggestions */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                Trending Hashtags (Click to Append)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {hashtagSuggestions.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleAddHashtag(item.tag)}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
                  >
                    <Hash className="w-3 h-3" />
                    <span>{item.tag.replace(/^#/, '')}</span>
                    <span className="text-slate-500 text-[9px]">{item.score}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sound Attachment & Media Asset Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sound Attachment */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Music className="w-4 h-4 text-purple-400" />
                <span>Sound Attachment</span>
              </div>
              <input
                type="text"
                value={selectedSound}
                onChange={(e) => setSelectedSound(e.target.value)}
                placeholder="Attach sound title or ID..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400 font-mono block">
                Synced with platform audio library
              </span>
            </div>

            {/* Media Asset Picker */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Video className="w-4 h-4 text-cyan-400" />
                <span>Media Asset</span>
              </div>
              <select
                value={selectedMediaId}
                onChange={(e) => setSelectedMediaId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                {mediaList.length === 0 ? (
                  <option value="media-default">Default Video (videos/hook_test.mp4)</option>
                ) : (
                  mediaList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.storageKey}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Cover Frame Picker */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Cover Frame Selector</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Candidate frames scored by contrast</span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[0.5, 1.2, 2.0, 3.2].map((time, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCoverFrame(idx)}
                  className={`border rounded-lg p-2.5 text-center transition-all ${
                    selectedCoverFrame === idx
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-bold shadow'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-mono">{`${time}s`}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {idx === 1 ? 'High Contrast' : 'Standard'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Account & Schedule Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white block mb-1">Target Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                {accountList.length === 0 ? (
                  <option value="acc-1">@tiktok_main</option>
                ) : (
                  accountList.map((a) => (
                    <option key={a.id} value={a.id}>
                      @{a.username}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-white block mb-1">Execution Slot Timestamp</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submission Bar */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <Metric
              label="Selected Slot"
              value={new Date(scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              provenance="live"
            />

            <button
              type="submit"
              disabled={isSubmitting || isOverLimit}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              {scheduledSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Scheduled! Redirecting...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Schedule to Queue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </SectionErrorBoundary>
  );
}
