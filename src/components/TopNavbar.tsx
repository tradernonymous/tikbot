'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Power, CheckCircle, RefreshCw } from 'lucide-react';

export function TopNavbar() {
  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/v1/system/kill-switch')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.active === 'boolean') {
          setKillSwitchActive(data.active);
        }
      })
      .catch(() => {});
  }, []);

  async function toggleKillSwitch() {
    const nextState = !killSwitchActive;
    const reason = nextState
      ? 'Manual Operator Emergency Kill-Switch Activation from Navbar'
      : 'Operator Resumed Normal Operations from Navbar';

    if (nextState) {
      const confirmed = window.confirm(
        'EMERGENCY WARNING: Activating the Kill Switch will immediately abort all running browser sessions, pause active campaigns, and stop queue consumption. Proceed?'
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/system/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextState, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setKillSwitchActive(data.active);
      }
    } catch (err) {
      console.error('Failed to toggle kill switch', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {killSwitchActive ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>KILL SWITCH ENGAGED — AUTOMATION HALTED</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safe Mode Operational (Manual Approval Default)</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleKillSwitch}
          disabled={loading}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
            killSwitchActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title="Toggle Global Automation Kill Switch"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Power className="w-3.5 h-3.5" />
          )}
          <span>{killSwitchActive ? 'Reset Kill Switch' : 'Emergency Kill Switch'}</span>
        </button>
      </div>
    </header>
  );
}
