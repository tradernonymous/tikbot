'use client';

import React, { useEffect, useRef } from 'react';
import { Search, X, Command, Play, Flame, Calendar, Users, Radio, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface CommandPaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'page' | 'action' | 'entity' | 'recent';
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  onExecute?: () => void;
}

export function filterCommandPaletteItems(
  items: CommandPaletteItem[],
  query: string
): CommandPaletteItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;

  return items.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(normalized);
    const subtitleMatch = item.subtitle ? item.subtitle.toLowerCase().includes(normalized) : false;
    const categoryMatch = item.category.toLowerCase().includes(normalized);
    return titleMatch || subtitleMatch || categoryMatch;
  });
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (item: CommandPaletteItem) => void;
  items: CommandPaletteItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelect,
  items,
  searchQuery,
  onSearchChange,
  selectedIndex = 0,
  onSelectedIndexChange,
}: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = filterCommandPaletteItems(items, searchQuery);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (item: CommandPaletteItem) => {
    if (onSelect) {
      onSelect(item);
    } else {
      if (item.onExecute) {
        item.onExecute();
      }
      if (item.href) {
        router.push(item.href);
      }
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (selectedIndex + 1) % Math.max(1, filtered.length);
      onSelectedIndexChange?.(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (selectedIndex - 1 + filtered.length) % Math.max(1, filtered.length);
      onSelectedIndexChange?.(prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-4 shadow-2xl space-y-3 font-sans">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            placeholder="Type a command, page, action, or entity..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white text-xs placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          id="command-palette-list"
          role="listbox"
          className="space-y-1 text-xs max-h-80 overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs font-mono">
              No matching commands or entities found for &quot;{searchQuery}&quot;
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => onSelectedIndexChange?.(index)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/60 text-white border border-cyan-800/60'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        item.category === 'action'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                          : item.category === 'entity'
                          ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="font-medium text-xs">{item.title}</span>
                    {item.subtitle && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono">
                    <span className="truncate max-w-[120px]">{item.href}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
