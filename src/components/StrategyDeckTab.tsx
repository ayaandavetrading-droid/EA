import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { StrategyItem } from '../types/apex';

interface StrategyDeckTabProps {
  strategies: StrategyItem[];
  onToggleStrategy: (id: number, enabled: boolean) => void;
}

export const StrategyDeckTab: React.FC<StrategyDeckTabProps> = ({
  strategies,
  onToggleStrategy,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Trend Pullback', 'Breakout & Retest', 'Key Level Reaction', 'Range Mean Reversion', 'Volatility Squeeze'];

  const filtered = strategies.filter((s) => {
    if (filterCategory !== 'ALL' && !s.category.includes(filterCategory)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-white">12 Modular Gold Scalping Strategies</h2>
            <p className="text-xs text-slate-400">
              Calibrated specifically for Gold volatility, round psychological levels, and session liquidity
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((strat) => {
          const isExpanded = expandedId === strat.id;

          return (
            <div
              key={strat.id}
              className={`bg-slate-900/90 border rounded-xl shadow-lg transition-all flex flex-col ${
                strat.enabled
                  ? 'border-slate-800 hover:border-amber-500/50'
                  : 'border-slate-800/40 opacity-60 bg-slate-950/60'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                      G{strat.id}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{strat.category}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{strat.name}</h3>
                </div>

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={strat.enabled}
                    onChange={(e) => onToggleStrategy(strat.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-4 gap-1 p-2.5 bg-slate-950/60 border-b border-slate-800 text-center text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[9px]">WIN RATE</span>
                  <span className="text-emerald-400 font-bold">{strat.winRate}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">PROFIT FACTOR</span>
                  <span className="text-amber-400 font-bold">{strat.profitFactor}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">AVG R:R</span>
                  <span className="text-slate-200 font-bold">{strat.avgRR}:1</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">TRADES</span>
                  <span className="text-slate-400 font-medium">{strat.tradesCount}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3 flex-1 text-xs">
                <p className="text-slate-300 text-xs leading-relaxed">{strat.description}</p>

                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">TIMEFRAME & RULES:</span>
                  <span className="text-cyan-300">{strat.timeframe} • {strat.indicators}</span>
                </div>

                {isExpanded && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="space-y-1">
                      <span className="text-amber-400 text-[10px] font-bold block flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        FAILURE MODES & ANOMALIES:
                      </span>
                      <p className="text-slate-400 text-[11px]">{strat.failureMode}</p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-emerald-400 text-[10px] font-bold block flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        GOLD SPREAD SENSITIVITY:
                      </span>
                      <p className="text-slate-400 text-[11px]">{strat.costSensitivity}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Drawer */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : strat.id)}
                className="w-full py-2 px-4 border-t border-slate-800/80 text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1 bg-slate-950/40 hover:bg-slate-900 transition-colors"
              >
                <span>{isExpanded ? 'Hide Details' : 'View In-Depth Rules'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
