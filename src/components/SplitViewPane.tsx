'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ExternalLink, Columns, Maximize2, Minimize2 } from 'lucide-react';
import { useUi } from '@/context/UiContext';

export const SPLIT_PAGE_OPTIONS = [
  { label: 'Composer', url: '/dashboard/composer' },
  { label: 'Comment Inbox', url: '/dashboard/inbox' },
  { label: 'Calendar', url: '/dashboard/calendar' },
  { label: 'Research', url: '/dashboard/research' },
  { label: 'Trends Radar', url: '/dashboard/trends' },
];

export function SplitViewPane() {
  const {
    splitViewOpen,
    splitViewUrl,
    splitWidthPercent,
    closeSplitView,
    openSplitView,
    setSplitWidth,
  } = useUi();

  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing && typeof window !== 'undefined') {
        const totalWidth = window.innerWidth;
        const newWidthPx = totalWidth - e.clientX;
        const newPercent = (newWidthPx / totalWidth) * 100;
        setSplitWidth(Math.round(newPercent));
      }
    },
    [isResizing, setSplitWidth]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  if (!splitViewOpen || !splitViewUrl) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="complementary"
      aria-label="Split View Secondary Workspace"
      style={{ width: `${splitWidthPercent}%` }}
      className="hidden lg:flex flex-col h-full border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl relative z-30 transition-all duration-75"
    >
      {/* Draggable Resize Handle */}
      <div
        role="separator"
        aria-label="Resize split view divider"
        onMouseDown={startResizing}
        className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-cyan-500/40 active:bg-cyan-500 transition-colors z-40"
      />

      {/* Pane Header */}
      <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <Columns className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white">Side Workspace:</span>
          <select
            value={splitViewUrl}
            onChange={(e) => openSplitView(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-[11px] rounded px-2 py-0.5 focus:outline-none focus:border-cyan-500"
          >
            {SPLIT_PAGE_OPTIONS.map((opt) => (
              <option key={opt.url} value={opt.url}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => closeSplitView()}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close Split View"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pane Body */}
      <div className="flex-1 w-full h-[calc(100%-3rem)] bg-slate-950">
        <iframe
          src={splitViewUrl}
          title="Split View Secondary Workspace"
          className="w-full h-full border-0 bg-slate-950"
        />
      </div>
    </div>
  );
}
