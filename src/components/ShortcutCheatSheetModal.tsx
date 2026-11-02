'use client';

import React from 'react';
import { X, Command, Sparkles, Navigation, CornerDownLeft } from 'lucide-react';

export interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global Navigation',
    shortcuts: [
      { keys: ['⌘K', '/'], description: 'Command Palette' },
      { keys: ['?'], description: 'Keyboard shortcuts help' },
      { keys: ['Esc'], description: 'Close modals & drawers' },
      { keys: ['⌘Z'], description: 'Undo safe operation' },
      { keys: ['⌘⇧Z'], description: 'Redo operation' },
    ],
  },
  {
    title: 'Go-To Jump Navigation (press g then key)',
    shortcuts: [
      { keys: ['g', 'o'], description: 'Overview dashboard' },
      { keys: ['g', 'e'], description: 'Research Intelligence' },
      { keys: ['g', 't'], description: 'Trends Radar' },
      { keys: ['g', 'h'], description: 'Hook Lab' },
      { keys: ['g', 'x'], description: 'Competitors' },
      { keys: ['g', 'q'], description: 'Creators CRM' },
      { keys: ['g', 'w'], description: 'Live Stream Monitor' },
      { keys: ['g', 'c'], description: 'Publishing Calendar' },
      { keys: ['g', 'p'], description: 'Composer' },
      { keys: ['g', 'm'], description: 'Media Library' },
      { keys: ['g', 'i'], description: 'Comment Inbox' },
      { keys: ['g', 'r'], description: 'Telemetry Reports' },
      { keys: ['g', 'a'], description: 'Farm Accounts Fleet' },
      { keys: ['g', 'f'], description: 'Farm Accounts Engine' },
      { keys: ['g', 'v'], description: 'Farm Services & Boost' },
      { keys: ['g', 'k'], description: 'Engagement Campaigns' },
      { keys: ['g', 'b'], description: 'Publishing Operations' },
      { keys: ['g', 'l'], description: 'Farm Launch Panel' },
      { keys: ['g', 'u'], description: 'Compliance & Audit' },
      { keys: ['g', 's'], description: 'System Settings' },
    ],
  },
  {
    title: 'Row & Entity Operations',
    shortcuts: [
      { keys: ['j', 'k'], description: 'Navigate next / previous row' },
      { keys: ['Enter'], description: 'Open entity drawer' },
      { keys: ['a'], description: 'Approve pending campaign / slot' },
      { keys: ['x'], description: 'Dismiss / reject item' },
    ],
  },
];

export interface ShortcutCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutCheatSheetModal({ isOpen, onClose }: ShortcutCheatSheetModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts Cheat Sheet"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Command className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcut Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map((group, idx) => (
            <div
              key={group.title}
              className={`space-y-3 ${idx === 1 ? 'md:col-span-1' : ''}`}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/60 pb-1.5">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((sc, scIdx) => (
                  <div
                    key={scIdx}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="text-slate-300">{sc.description}</span>
                    <div className="flex items-center gap-1 font-mono">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 font-semibold shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Press Esc or ? to dismiss</span>
          <span className="text-cyan-400">tikbot v3 speed navigation</span>
        </div>
      </div>
    </div>
  );
}
