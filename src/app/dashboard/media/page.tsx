'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Video,
  LayoutGrid,
  List,
  Plus,
  ArrowRight,
  Calendar,
  Search,
  Tag,
  Clock,
  Film,
} from 'lucide-react';
import { Metric } from '@/components/Metric';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, ColumnDef } from '@/components/DataTable';

export interface MediaAssetRecord {
  id: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  aspectRatio: string;
  tags: string[];
  variants: string[];
  usageCount: number;
  createdAt: string;
}

export interface MediaPageProps {
  initialAssets?: MediaAssetRecord[];
}

export default function MediaPage({ initialAssets }: MediaPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlView = searchParams ? searchParams.get('view') : null;
  const urlTag = searchParams ? searchParams.get('tag') : null;
  const urlSearch = searchParams ? searchParams.get('search') : null;

  const resolvedView = urlView === 'list' ? 'list' : 'grid';

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(resolvedView);
  const [selectedTag, setSelectedTag] = useState<string>(urlTag || 'ALL');
  const [searchFilter, setSearchFilter] = useState<string>(urlSearch || '');
  const [assets, setAssets] = useState<MediaAssetRecord[]>(initialAssets || []);
  const [loading, setLoading] = useState<boolean>(!initialAssets);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<string>('');
  const [newTag, setNewTag] = useState<string>('ugc');

  useEffect(() => {
    if (initialAssets) return;

    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (selectedTag !== 'ALL') {
      params.set('tag', selectedTag);
    }

    fetch(`/api/v1/content/media?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.assets)) {
          setAssets(data.assets);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTag, initialAssets]);

  const updateUrl = (view: 'grid' | 'list', tag: string, search: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('view', view);
    if (tag !== 'ALL') {
      params.set('tag', tag);
    } else {
      params.delete('tag');
    }
    if (search.trim()) {
      params.set('search', search.trim());
    } else {
      params.delete('search');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleViewChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    updateUrl(mode, selectedTag, searchFilter);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    updateUrl(viewMode, tag, searchFilter);
  };

  const handleSearchChange = (q: string) => {
    setSearchFilter(q);
    updateUrl(viewMode, selectedTag, q);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    try {
      const res = await fetch('/api/v1/content/media', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          storageKey: newKey.trim(),
          fileSizeBytes: 10485760, // 10MB default
          durationSeconds: 25.0,
          width: 1080,
          height: 1920,
          tags: [newTag.toLowerCase()],
        }),
      });
      const data = await res.json();
      if (data.success && data.asset) {
        setAssets((prev) => [
          {
            ...data.asset,
            aspectRatio: '9:16',
            tags: [newTag.toLowerCase()],
            variants: ['ORIGINAL'],
            usageCount: 0,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setNewKey('');
        setShowAddModal(false);
      }
    } catch {}
  };

  const filteredAssets = assets.filter((a) => {
    if (searchFilter && !a.storageKey.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    if (selectedTag !== 'ALL' && !a.tags.includes(selectedTag.toLowerCase())) {
      return false;
    }
    return true;
  });

  const listColumns: ColumnDef<MediaAssetRecord>[] = [
    {
      key: 'storageKey',
      header: 'Asset Name',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-white text-xs">{item.storageKey}</span>
        </div>
      ),
    },
    {
      key: 'aspectRatio',
      header: 'Aspect Ratio',
      render: (item) => (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold">
          {item.aspectRatio}
        </span>
      ),
    },
    {
      key: 'fileSizeBytes',
      header: 'Size',
      render: (item) => (
        <span className="text-xs font-mono text-slate-400">
          {(item.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
        </span>
      ),
    },
    {
      key: 'usageCount',
      header: 'Usage',
      render: (item) => (
        <Metric
          value={`Used in ${item.usageCount} posts`}
          provenance="live"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/composer?mediaId=${encodeURIComponent(item.id)}`}
            className="px-2.5 py-1 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/40 text-xs font-medium"
          >
            Use in Composer
          </Link>
          <Link
            href={`/dashboard/calendar?mediaId=${encodeURIComponent(item.id)}`}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
            title="Schedule in Calendar"
          >
            <Calendar className="w-3.5 h-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <SectionErrorBoundary sectionName="Media Library">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Video className="w-6 h-6 text-cyan-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">Media Library</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Store, crop, tag, and assign reusable video assets across multiple channel schedules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(!showAddModal)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Asset</span>
            </button>

            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Provenance: LIVE (DB)
            </span>
          </div>
        </div>

        {/* Add Asset Drawer / Form */}
        {showAddModal && (
          <form onSubmit={handleAddAsset} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">Asset Storage Key / Path</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="videos/campaign_q4_review.mp4"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">Tag</label>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ugc">UGC</option>
                <option value="review">Review</option>
                <option value="tutorial">Tutorial</option>
                <option value="faceless">Faceless</option>
                <option value="product">Product</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
            >
              Save Asset
            </button>
          </form>
        )}

        {/* Controls: Tags & View Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {['ALL', 'UGC', 'REVIEW', 'TUTORIAL', 'FACELESS', 'PRODUCT'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedTag === tag
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search assets..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center border border-slate-800 rounded-lg p-0.5 bg-slate-900">
              <button
                type="button"
                onClick={() => handleViewChange('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="sr-only">Grid View</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewChange('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
                <span className="sr-only">List View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content: Empty State, Grid View or List View */}
        {filteredAssets.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No media assets found"
            description="Upload or register raw video files to start composing multi-platform publishing schedules."
            actionLabel="Register First Asset"
            onAction={() => setShowAddModal(true)}
          />
        ) : viewMode === 'list' ? (
          <DataTable
            columns={listColumns}
            data={filteredAssets}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold">
                      {asset.aspectRatio}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {(asset.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-white break-all">{asset.storageKey}</h3>

                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((t) => (
                      <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <Metric
                    value={`Used in ${asset.usageCount} posts`}
                    provenance="live"
                  />

                  <Link
                    href={`/dashboard/composer?mediaId=${encodeURIComponent(asset.id)}`}
                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    <span>Compose</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionErrorBoundary>
  );
}
