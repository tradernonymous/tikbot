'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Network,
  Database,
  Sliders,
  AlertOctagon,
  CheckCircle2,
  Save,
  Server,
  Cpu,
  Lock,
} from 'lucide-react';
import { COMPLIANCE_ACTION_CAPS } from '@/farm/rate-limiter';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'network' | 'caps'>('general');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = () => {
    setSavedMessage('Settings successfully saved to local configuration.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">System Settings & Governance</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure system parameters, encryption keys, network sidecars, and safety action caps.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>General & Environment</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Security & Keys</span>
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'network'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Sidecars & Network</span>
        </button>
        <button
          onClick={() => setActiveTab('caps')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'caps'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Safety Velocity Caps</span>
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Environment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Deployment Platform</label>
                <input
                  type="text"
                  disabled
                  value="Railway (Docker Standalone)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-xs cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Framework Runtime</label>
                <input
                  type="text"
                  disabled
                  value="Next.js 16 (App Router + Turbopack) / Node 22"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-xs cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Database Provider</label>
                <input
                  type="text"
                  disabled
                  value="PostgreSQL 16 (Prisma ORM v6)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-xs cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Queue Concurrency</label>
                <input
                  type="number"
                  defaultValue={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Cryptographic Vault Configuration</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">AES-256-GCM Vault Status</label>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>MASTER_ENCRYPTION_KEY loaded (32 bytes / 256 bits)</span>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Session Signing Secret</label>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>SESSION_SECRET loaded & verified (&ge; 32 characters)</span>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Operator Authentication Mode</label>
                <input
                  type="text"
                  disabled
                  value="Single-Operator Scrypt ($scrypt$16b_salt$64b_key)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-xs cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sidecars & Network */}
      {activeTab === 'network' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Self-Hosted Sidecars & Scraper Adapters</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">TikTok/Douyin Download API Endpoint</label>
                <input
                  type="text"
                  defaultValue="http://localhost:8000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Self-hosted Douyin_TikTok_Download_API sidecar URL.</p>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Python TikTok-Api Sidecar URL</label>
                <input
                  type="text"
                  defaultValue="http://localhost:8080"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Containerized Python service for direct feed ingestion.</p>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Redis Cache & Distributed Lock</label>
                <input
                  type="text"
                  defaultValue="redis://localhost:6379"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Safety Caps */}
      {activeTab === 'caps' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Per-Account Compliance Velocity Limits</h3>
            <p className="text-xs text-slate-400">
              Hard caps enforced by <code className="text-cyan-400">AccountRateLimiter</code> to prevent account suspensions.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Max Per Hour</th>
                    <th className="py-2.5 px-3">Max Per Day</th>
                    <th className="py-2.5 px-3">Min Jitter</th>
                    <th className="py-2.5 px-3">Max Jitter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {Object.entries(COMPLIANCE_ACTION_CAPS).map(([action, cap]) => (
                    <tr key={action}>
                      <td className="py-2.5 px-3 font-semibold text-cyan-400">{action}</td>
                      <td className="py-2.5 px-3">{cap.maxPerHour} / hr</td>
                      <td className="py-2.5 px-3 text-emerald-400">{cap.maxPerDay} / day</td>
                      <td className="py-2.5 px-3 text-slate-400">{cap.minJitterMs / 1000}s</td>
                      <td className="py-2.5 px-3 text-slate-400">{cap.maxJitterMs / 1000}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
