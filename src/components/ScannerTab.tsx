import React, { useState } from 'react';
import {
  Radar,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { ScannedSymbolItem } from '../types/apex';

interface ScannerTabProps {
  symbols: ScannedSymbolItem[];
}

export const ScannerTab: React.FC<ScannerTabProps> = ({ symbols }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'APPROVED' | 'ACTIVE' | 'MAJORS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSymbols = symbols.filter((s) => {
    if (searchQuery && !s.symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterType === 'APPROVED') return s.passesRiskFilters;
    if (filterType === 'ACTIVE') return s.action === 'IN_POSITION';
    if (filterType === 'MAJORS') return ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'].includes(s.symbol);
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Controller Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Radar className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-white">Multi-Symbol Market Scanner Matrix</h2>
            <p className="text-xs text-slate-400">
              Real-time spread cost analysis, ATR volatility ratio, quantitative regime detection & opportunity ranking
            </p>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36"
          />

          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded transition-all ${
                filterType === 'ALL' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({symbols.length})
            </button>
            <button
              onClick={() => setFilterType('APPROVED')}
              className={`px-2.5 py-1 rounded transition-all ${
                filterType === 'APPROVED' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Approved ({symbols.filter((s) => s.passesRiskFilters).length})
            </button>
            <button
              onClick={() => setFilterType('ACTIVE')}
              className={`px-2.5 py-1 rounded transition-all ${
                filterType === 'ACTIVE' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active ({symbols.filter((s) => s.action === 'IN_POSITION').length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-sans uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4 font-semibold">Symbol</th>
              <th className="py-3 px-3 font-semibold">Bid / Ask</th>
              <th className="py-3 px-3 font-semibold">Spread (Pts / $)</th>
              <th className="py-3 px-3 font-semibold">ATR(14)</th>
              <th className="py-3 px-3 font-semibold">Cost / ATR</th>
              <th className="py-3 px-3 font-semibold">Market Regime</th>
              <th className="py-3 px-3 font-semibold">Uncertainty</th>
              <th className="py-3 px-3 font-semibold">Rank Score</th>
              <th className="py-3 px-3 font-semibold">Optimal Strategy</th>
              <th className="py-3 px-4 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredSymbols.map((item) => (
              <tr
                key={item.symbol}
                className={`hover:bg-slate-800/50 transition-colors ${
                  !item.passesRiskFilters ? 'opacity-60 bg-slate-950/40' : ''
                }`}
              >
                {/* Symbol */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{item.symbol}</span>
                    {item.action === 'IN_POSITION' && (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold">
                        OPEN
                      </span>
                    )}
                  </div>
                </td>

                {/* Bid / Ask */}
                <td className="py-3 px-3 text-slate-300">
                  <span className="block">{item.bid.toFixed(item.bid > 500 ? 2 : 5)}</span>
                  <span className="text-slate-500 block text-[10px]">
                    {item.ask.toFixed(item.ask > 500 ? 2 : 5)}
                  </span>
                </td>

                {/* Spread */}
                <td className="py-3 px-3">
                  <span className={`font-bold ${item.spreadPoints > 25 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {item.spreadPoints} pts
                  </span>
                  <span className="text-slate-500 block text-[10px]">${item.spreadCostUSD.toFixed(2)} / lot</span>
                </td>

                {/* ATR */}
                <td className="py-3 px-3 text-slate-300 font-sans">
                  {item.atr14 > 10 ? item.atr14.toFixed(1) : item.atr14.toFixed(5)}
                </td>

                {/* Cost / ATR Ratio */}
                <td className="py-3 px-3">
                  <span
                    className={`font-bold ${
                      item.spreadToAtrRatio > 0.20 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {(item.spreadToAtrRatio * 100).toFixed(1)}%
                  </span>
                  <span className="text-slate-500 text-[10px] block">
                    {item.spreadToAtrRatio > 0.20 ? 'Too Costly' : 'Friction OK'}
                  </span>
                </td>

                {/* Market Regime */}
                <td className="py-3 px-3 font-sans">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      item.regimeKey === 'BULL_TREND'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : item.regimeKey === 'BEAR_TREND'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                        : item.regimeKey === 'VOLATILITY_COMPRESSION'
                        ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
                        : item.regimeKey === 'POTENTIAL_BREAKOUT'
                        ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.regime}
                  </span>
                </td>

                {/* Model Uncertainty */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-bold ${
                        item.uncertainty > 0.40 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {item.uncertainty.toFixed(2)}
                    </span>
                    <div className="w-10 bg-slate-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          item.uncertainty > 0.40 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, item.uncertainty * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Opportunity Score */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1 font-bold">
                    <span
                      className={`text-sm ${
                        item.opportunityScore >= 80
                          ? 'text-cyan-400 font-extrabold'
                          : item.opportunityScore >= 70
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.opportunityScore.toFixed(1)}
                    </span>
                    <span className="text-slate-600 text-[10px]">/100</span>
                  </div>
                </td>

                {/* Best Strategy */}
                <td className="py-3 px-3 font-sans text-slate-300 text-[11px]">
                  {item.bestStrategy}
                </td>

                {/* Action / Feasibility Status */}
                <td className="py-3 px-4 text-right">
                  {item.passesRiskFilters ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 text-[11px] font-sans font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.action === 'IN_POSITION' ? 'Position Open' : 'Ready'}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/80 text-[10px] font-sans"
                      title={item.riskNotes}
                    >
                      <XCircle className="w-3 h-3 text-amber-500" />
                      Filtered
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
