import React from 'react';
import { ShieldCheck, AlertOctagon, Activity, Lock, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getDevFixtures } from '@/fixtures';

export default function CompliancePage() {
  const fixtures = getDevFixtures();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Compliance, Security & Audit Logs</h2>
          <p className="text-xs text-slate-400 mt-1">
            System governance controls, velocity guardrails, secret rotation, and immutable audit logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-xs font-mono text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Policy Status: STRICT</span>
          </div>
        </div>
      </div>

      {/* Security Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-[10px] text-emerald-400">Keys Active & Rotated</div>
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

      {/* Audit Log Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Immutable Operator Audit Trail</span>
          <span className="text-xs text-slate-400 font-mono">
            {fixtures.auditLogs.length} LOGGED EVENTS
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
              {fixtures.auditLogs.map((log) => (
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
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-right text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
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
