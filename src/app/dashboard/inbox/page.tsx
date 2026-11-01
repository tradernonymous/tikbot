'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Inbox,
  Send,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  Flame,
} from 'lucide-react';
import { Metric } from '@/components/Metric';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { CommentCategory } from '@/intelligence/comment-inbox';

export interface InboxItemRecord {
  id: string;
  authorHandle: string;
  text: string;
  postTitle?: string;
  category: CommentCategory;
  sentimentScore: number;
  status: 'PENDING' | 'SENT' | 'FLAGGED';
  reply?: {
    id: string;
    replyText: string;
    status: string;
    createdAt: string;
  };
  createdAt: string;
}

export interface ContentPlanItem {
  id: string;
  title: string;
  theme: string | null;
  captionDraft: string | null;
  status: string;
  createdAt: string;
}

export interface InboxPageProps {
  initialItems?: InboxItemRecord[];
  initialIdeas?: ContentPlanItem[];
}

export default function InboxPage({ initialItems, initialIdeas }: InboxPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTab = searchParams ? searchParams.get('tab') : null;
  const urlCategory = searchParams ? searchParams.get('category') : null;
  const urlSearch = searchParams ? searchParams.get('search') : null;

  const validTabs = ['PENDING', 'SENT', 'IDEAS', 'FAQ'] as const;
  type TabType = (typeof validTabs)[number];

  const resolvedTab: TabType =
    urlTab && validTabs.includes(urlTab.toUpperCase() as TabType)
      ? (urlTab.toUpperCase() as TabType)
      : 'PENDING';

  const [activeTab, setActiveTab] = useState<TabType>(resolvedTab);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || 'ALL');
  const [searchFilter, setSearchFilter] = useState<string>(urlSearch || '');
  const [items, setItems] = useState<InboxItemRecord[]>(initialItems || []);
  const [ideas, setIdeas] = useState<ContentPlanItem[]>(initialIdeas || []);
  const [loading, setLoading] = useState<boolean>(!initialItems && !initialIdeas);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [escalatedIds, setEscalatedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialItems && initialIdeas) return;

    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams({ tab: activeTab.toLowerCase() });
    if (selectedCategory !== 'ALL') {
      params.set('category', selectedCategory);
    }

    fetch(`/api/v1/intelligence/inbox?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          if (Array.isArray(data.items)) setItems(data.items);
          if (Array.isArray(data.contentPlans)) setIdeas(data.contentPlans);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedCategory, initialItems, initialIdeas]);

  const updateUrl = (tab: TabType, category: string, search: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('tab', tab.toLowerCase());
    if (category !== 'ALL') {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    if (search.trim()) {
      params.set('search', search.trim());
    } else {
      params.delete('search');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    updateUrl(tab, selectedCategory, searchFilter);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    updateUrl(activeTab, cat, searchFilter);
  };

  const handleSearchChange = (q: string) => {
    setSearchFilter(q);
    updateUrl(activeTab, selectedCategory, q);
  };

  const handleReplyChange = (id: string, text: string) => {
    setReplyDrafts((prev) => ({ ...prev, [id]: text }));
  };

  const handleSendReply = async (commentId: string) => {
    const replyText = replyDrafts[commentId]?.trim();
    if (!replyText) return;

    try {
      const res = await fetch('/api/v1/intelligence/inbox', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          commentId,
          replyText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === commentId ? { ...i, reply: data.reply, status: 'SENT' } : i
          )
        );
      }
    } catch {}
  };

  const handleEscalateToContentPlan = async (item: InboxItemRecord) => {
    try {
      const res = await fetch('/api/v1/intelligence/inbox', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'escalate',
          text: item.text,
          authorHandle: item.authorHandle,
          category: item.category,
        }),
      });
      const data = await res.json();
      if (data.success && data.contentPlan) {
        setEscalatedIds((prev) => new Set(prev).add(item.id));
        setIdeas((prev) => [data.contentPlan, ...prev]);
      }
    } catch {}
  };

  const CATEGORY_STYLES: Record<CommentCategory, { label: string; className: string }> = {
    QUESTION: { label: 'Question', className: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' },
    OBJECTION: { label: 'Objection', className: 'bg-rose-500/10 border-rose-500/30 text-rose-300' },
    PRAISE: { label: 'Praise', className: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
    SPAM: { label: 'Spam', className: 'bg-slate-800 border-slate-700 text-slate-400' },
    GENERAL: { label: 'General', className: 'bg-blue-500/10 border-blue-500/30 text-blue-300' },
  };

  const filteredItems = items.filter((item) => {
    if (searchFilter && !item.text.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <SectionErrorBoundary sectionName="Comment Inbox">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Inbox className="w-6 h-6 text-cyan-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">Comment Inbox &amp; VOC</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Classified audience sentiment, approval-gated responses, and Voice-of-Customer escalation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Provenance: LIVE (DB)
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-2">
          <nav className="flex space-x-1" aria-label="Inbox sub-tabs">
            <button
              onClick={() => handleTabChange('PENDING')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'PENDING'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Pending</span>
            </button>
            <button
              onClick={() => handleTabChange('SENT')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'SENT'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Sent</span>
            </button>
            <button
              onClick={() => handleTabChange('IDEAS')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'IDEAS'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Ideas</span>
            </button>
            <button
              onClick={() => handleTabChange('FAQ')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'FAQ'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQ Bank</span>
            </button>
          </nav>

          {(activeTab === 'PENDING' || activeTab === 'SENT') && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search comments..."
                  className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Categories</option>
                <option value="QUESTION">Question</option>
                <option value="OBJECTION">Objection</option>
                <option value="PRAISE">Praise</option>
                <option value="SPAM">Spam</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Pending Comments */}
        {activeTab === 'PENDING' && (
          filteredItems.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No comments waiting for review"
              description="All inbound audience comments have been answered or moderated."
              actionLabel="View Sent History"
              onAction={() => handleTabChange('SENT')}
            />
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const cat = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.GENERAL;
                const isEscalated = escalatedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 transition-colors hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{`@${item.authorHandle}`}</span>
                        {item.postTitle && (
                          <span className="text-[11px] text-slate-400">{`on "${item.postTitle}"`}</span>
                        )}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${cat.className}`}>
                          {cat.label.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Metric
                          label="Sentiment"
                          value={item.sentimentScore > 0 ? `+${item.sentimentScore}` : `${item.sentimentScore}`}
                          provenance="live"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-slate-200">{item.text}</p>

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={replyDrafts[item.id] || ''}
                          onChange={(e) => handleReplyChange(item.id, e.target.value)}
                          placeholder="Draft approved reply..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendReply(item.id)}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg shadow transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Approve &amp; Send</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEscalateToContentPlan(item)}
                        disabled={isEscalated}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                          isEscalated
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                        }`}
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isEscalated ? 'Escalated to Ideas' : 'Escalate to Content Plan'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Tab 2: Sent Comments */}
        {activeTab === 'SENT' && (
          filteredItems.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No sent replies found"
              description="Replies approved and posted to social networks appear here."
            />
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">@{item.authorHandle}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      POSTED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 italic">&ldquo;{item.text}&rdquo;</p>
                  {item.reply && (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded p-2 text-xs text-slate-200">
                      <span className="text-cyan-400 font-mono text-[10px] block mb-0.5">Approved Reply:</span>
                      {item.reply.replyText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 3: Ideas from Escalated Comments */}
        {activeTab === 'IDEAS' && (
          ideas.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No escalated content ideas yet"
              description="Audience questions and objections can be escalated to content planning drafts from the Pending tab."
              actionLabel="Go to Pending Comments"
              onAction={() => handleTabChange('PENDING')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ideas.map((idea) => (
                <div key={idea.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-amber-500/10 text-amber-300 border-amber-500/20 uppercase font-semibold">
                        {idea.theme || 'COMMUNITY_IDEA'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{idea.status}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{idea.title}</h3>
                    {idea.captionDraft && (
                      <p className="text-xs text-slate-300 mt-2 line-clamp-2">&ldquo;{idea.captionDraft}&rdquo;</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(idea.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/dashboard/composer?source=voc&topic=${encodeURIComponent(idea.title)}`}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      <span>Create Video in Composer</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 4: FAQ Bank */}
        {activeTab === 'FAQ' && (
          <div className="space-y-4">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">Voice of Customer FAQ Bank</h2>
              <p className="text-xs text-slate-400">
                Standard approved response patterns for repetitive objection and question patterns.
              </p>
              <div className="space-y-3 pt-2">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-cyan-400">Q: Does this work for new accounts without followers?</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    A: Yes! The organic FYP algorithm evaluates each video independently based on completion rate and initial retention.
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-rose-400">Q: How do you prevent shadowbans with proxies?</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    A: We require residential proxy rotation, stealth browser fingerprinting, and strict hourly action budgets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionErrorBoundary>
  );
}
