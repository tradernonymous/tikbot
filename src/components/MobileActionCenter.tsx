'use client';

import React, { useState } from 'react';

export interface MobileActionCenterProps {
  killSwitchActive: boolean;
  pendingApprovalsCount: number;
  activeAccount?: string;
  provenance?: 'live' | 'cached' | 'unknown';
  onToggleKillSwitch?: () => void;
  onQuickApprove?: () => void;
}

export function MobileActionCenter({
  killSwitchActive,
  pendingApprovalsCount,
  activeAccount = 'None',
  provenance = 'live',
  onToggleKillSwitch,
  onQuickApprove,
}: MobileActionCenterProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      role="region"
      aria-label="Mobile Command Center"
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-md px-4 py-3 md:hidden shadow-2xl"
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Account + Provenance Status */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-200">
              {`@${activeAccount}`}
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                provenance === 'live'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {provenance}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            {pendingApprovalsCount > 0
              ? `${pendingApprovalsCount} pending`
              : 'All clear'}
          </span>
        </div>

        {/* Quick Actions (Thumb zone >= 44px touch targets) */}
        <div className="flex items-center gap-2">
          {pendingApprovalsCount > 0 && (
            <button
              type="button"
              onClick={onQuickApprove}
              className="min-h-[44px] px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 active:scale-95"
              aria-label={`Fast approve ${pendingApprovalsCount} items`}
            >
              Approve
            </button>
          )}

          <button
            type="button"
            onClick={onToggleKillSwitch}
            aria-label={killSwitchActive ? 'Deactivate Kill Switch' : 'Trigger Emergency Kill Switch'}
            className={`min-h-[44px] px-3.5 py-2 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 ${
              killSwitchActive
                ? 'bg-red-600 text-white animate-pulse shadow-red-900/50 shadow-lg'
                : 'bg-zinc-800 hover:bg-red-950/40 text-red-400 border border-red-900/40'
            }`}
          >
            {killSwitchActive ? 'KILL SWITCH ACTIVE' : 'Emergency Kill'}
          </button>
        </div>
      </div>
    </aside>
  );
}
