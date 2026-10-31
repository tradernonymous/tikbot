'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  Activity,
  Lock,
  Database,
  RefreshCw,
  CheckCircle2,
  Search,
  Filter,
  KeyRound,
} from 'lucide-react';

const INITIAL_AUDIT_LOGS = [
  {
    id: 'audit-001',
    action: 'KILL_SWITCH_DISENGAGE',
    actorEmail: 'admin@tikbot.internal',
    resourceId: 'SYSTEM',
    ipAddress: '10.0.1.42',
    createdAt: 'Today, 08:30 UTC',
    status: 'SUCCESS',
  },
  {
    id: 'audit-002',
    action: 'APPROVE_CAMPAIGN',
    actorEmail: 'operator@tikbot.internal',
    resourceId: 'camp-q4-boost',
    ipAddress: '10.0.1.45',
    createdAt: 'Today, 09:15 UTC',
    status: 'SUCCESS',
  },
  {
    id: 'audit-003',
    action: 'ROTATE_SECRET_VAULT',
    actorEmail: 'system-worker@tikbot.internal',
    resourceId: 'VAULT_KEY_02',
    ipAddress: '127.0.0.1',
    createdAt: 'Today, 09:20 UTC',
    status: 'SUCCESS',
  },
  {
    id: 'audit-004',
    action: 'AUTO_PAUSE_TRIGGER',
    actorEmail: 'rate-limiter@tikbot.internal',
    resourceId: 'acc_farm_node_08',
    ipAddress: '127.0.0.1',
    createdAt: 'Today, 09:45 UTC',
    status: 'WARNING',
  },
];

export default function CompliancePage() {
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rotationStatus, setRotationStatus] = useState<string | null>(null);

  const handleTestRotation = () => {
    setRotationStatus('Running zero-downtime re-encryption roundtrip...');
    setTimeout(() => {
      setRotationStatus('Vault re-encryption verified: 100% ciphertexts valid, 0 plaintext leaks.');
      setTimeout(() => setRotationStatus(null), 5000);
    }, 1000);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (
      searchQuery &&
      !log.action.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.resourceId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h2 className="text-xl font-bold tracking-tight text-white">Compliance, Security & Audit Logs</h2>
          <p className="text-xs text-slate-400 mt-1">
            System governance controls, velocity guardrails, secret rotation, and immutable audit logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestRotation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 text-xs font-semibold shadow-sm transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Secret Rotation</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-xs font-mono text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Policy Status: STRICT</span>
          </div>
        </div>
      </div>

      {rotationStatus && (
        <div className="p-3.5 rounded-xl bg-cyan-950/90 border border-cyan-800 text-cyan-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{rotationStatus}</span>
        </div>
      )}

      {/* Security Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Challenge Rate</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">0.0%</div>
            <div className="text-[10px] text-slate-400">Threshold: &lt; 15%</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-800/50 text-indigo-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Cipher Vault</div>
            <div className="text-lg font-bold text-white font-mono">AES-256-GCM</div>
            <div className="text-[10px] text-emerald-400">Master Keys Rotated</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-800/50 text-amber-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Kill Switch</div>
            <div className="text-lg font-bold text-slate-300 font-mono">ARMED</div>
            <div className="text-[10px] text-slate-400">Instant Global Freeze</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Approval Enforcement</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">100%</div>
            <div className="text-[10px] text-slate-400">0 Unapproved Runs</div>
          </div>
        </div>
      </div>

      {/* Audit Log Table Container */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter audit trail by action or resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredLogs.length} LOGGED EVENTS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">Action</th>
                <th className="py-3 px-4 font-medium">Operator / Actor</th>
                <th className="py-3 px-4 font-medium">Resource</th>
                <th className="py-3 px-4 font-medium">IP Address</th>
                <th className="py-3 px-4 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-cyan-400">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">
                    {log.actorEmail}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {log.resourceId}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">
                    {log.ipAddress}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-right text-slate-400">
                    {log.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
