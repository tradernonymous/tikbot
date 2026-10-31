import React from 'react';
import { Layers, ShoppingCart, DollarSign, RefreshCw, CheckCircle2, ShieldAlert, ExternalLink } from 'lucide-react';
import { DEFAULT_SERVICES } from '@/panel/catalog';

export default function SmmPanelPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">SMM Catalog & Order Pipeline</h2>
          <p className="text-xs text-slate-400 mt-1">
            Service catalog for engagement offerings (Internal Farm Nodes & Optional External SMM v2 Providers).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
            <span>Provider Balance:</span>
            <span className="font-bold text-white">$142.50 USD</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Provider</span>
          </button>
        </div>
      </div>

      {/* Service Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEFAULT_SERVICES.map((srv) => (
          <div key={srv.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                  {srv.category}
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  ${srv.ratePer1000.toFixed(2)} / 1k
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">{srv.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{srv.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                Min {srv.minQuantity} • Max {srv.maxQuantity.toLocaleString()}
              </span>
              <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium transition-colors">
                Order
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Active Orders & Sync Log */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Recent Orders</span>
          <span className="text-xs text-slate-400 font-mono">INTERNAL & EXTERNAL DISPATCH</span>
        </div>

        <div className="p-8 text-center text-slate-400 text-xs">
          <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p>No active external provider orders currently in flight.</p>
          <p className="text-[11px] text-slate-400 mt-1">Orders are governed by the manual approval gate.</p>
        </div>
      </div>
    </div>
  );
}
