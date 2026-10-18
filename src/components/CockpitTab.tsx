import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  CheckCircle,
  FileText,
  Target,
  DollarSign,
  Radio,
  Calendar
} from 'lucide-react';
import {
  AuditLogItem,
  GoldClosedTradeRecord,
  GoldMarketData,
  GoldPositionRecord,
  GoldSystemTelemetry
} from '../types/apex';

interface CockpitTabProps {
  telemetry: GoldSystemTelemetry | null;
  positions: GoldPositionRecord[];
  tradeHistory: GoldClosedTradeRecord[];
  auditLogs: AuditLogItem[];
  onClosePosition: (ticket: number) => void;
}

export const CockpitTab: React.FC<CockpitTabProps> = ({
  telemetry,
  positions,
  tradeHistory,
  auditLogs,
  onClosePosition,
}) => {
  const account = telemetry?.account;
  const market = telemetry?.market;
  const currentEquity = account?.equity ?? 10412.80;
  const progressPct = Math.min(100, Math.max(0, ((currentEquity - 10000.00) / 10000.00) * 100));

  const [activeLogFilter, setActiveLogFilter] = useState<'ALL' | 'REJECTIONS' | 'FILLS'>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    if (activeLogFilter === 'REJECTIONS') return log.event.includes('REJECTED') || log.event.includes('BLOCKED');
    if (activeLogFilter === 'FILLS') return log.event.includes('ORDER_FILLED') || log.event.includes('POSITION_CLOSED');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Gold Market Telemetry & Session Phase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gold Spot & Spread */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-1 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span className="font-semibold text-amber-400">SPOT GOLD (XAUUSD)</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px]">
              100 oz contract
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white">
            ${market ? market.spotPrice.toFixed(2) : '2,727.35'}
          </div>
          <div className="flex justify-between text-xs text-slate-400 pt-1">
            <span>Spread: <b className="text-emerald-400">{market ? `${market.spreadPoints} pts ($${market.spreadDollars})` : '22 pts'}</b></span>
            <span>ATR(14): <b className="text-cyan-400">${market ? market.atr14.toFixed(2) : '2.85'}</b></span>
          </div>
        </div>

        {/* Card 2: Session Liquidity Phase */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-1 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span className="font-semibold text-white">SESSION LIQUIDITY</span>
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-lg font-bold text-emerald-400">
            {market?.sessionPhase === 'NY_OVERLAP' ? 'London / NY Overlap' : market?.sessionPhase || 'London Session'}
          </div>
          <span className="text-[11px] text-slate-400 font-sans block pt-1">
            Peak institutional liquidity window. Spreads at optimal daily minimums.
          </span>
        </div>

        {/* Card 3: US Macro Economic Calendar Filter */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-1 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span className="font-semibold text-white">US MACRO NEWS GATE</span>
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-cyan-300 truncate">
            {market?.highImpactNews?.title || 'US CPI Inflation Data'}
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>In: <b className="text-white">2h 45m</b></span>
            <span className="text-emerald-400 font-bold">Trading Active</span>
          </div>
        </div>

        {/* Card 4: Aspirational Milestone Progress */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-semibold text-slate-300">100% Growth Milestone</span>
            <span className="text-amber-400 font-mono font-bold">+{progressPct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progressPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Base: $10k</span>
            <span className="text-white font-bold">${currentEquity.toFixed(0)}</span>
            <span>Target: $20k</span>
          </div>
        </div>
      </div>

      {/* Live Open Gold Positions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm lg:text-base font-bold text-white">Active XAUUSD Scalp Positions</h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-xs font-mono font-bold">
              {positions.length} Active
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Governed by ATR Trailing, Break-Even (+Offset), and Server-Side Hard Stops
          </span>
        </div>

        {positions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No open Gold positions</p>
            <p className="text-xs text-slate-500">
              The agent is actively evaluating M5/M15 market structure and awaiting clean pullback confirmations.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {positions.map((pos) => (
              <div key={pos.ticket} className="p-4 hover:bg-slate-800/40 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        pos.type === 'BUY'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {pos.type}
                    </span>
                    <span className="text-base font-bold text-white font-mono">{pos.symbol}</span>
                    <span className="text-xs text-slate-400 font-mono">{pos.volume} lots ({(pos.volume * 100).toFixed(0)} oz)</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono hidden md:inline">
                      #{pos.ticket}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {pos.breakEvenActivated && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-mono flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        BE Locked (+$0.15/oz)
                      </span>
                    )}

                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-emerald-400 block">
                        +${pos.unrealizedPnL.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        +${pos.pnlDollarsPerOz.toFixed(2)}/oz ({pos.currentR.toFixed(2)}R)
                      </span>
                    </div>

                    <button
                      onClick={() => onClosePosition(pos.ticket)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white font-bold text-xs transition-colors"
                      title="Safely close position at market"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Price Levels Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">ENTRY PRICE</span>
                    <span className="text-slate-200 font-bold">${pos.openPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SPOT PRICE</span>
                    <span className="text-white font-bold">${pos.currentPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PROTECTIVE SL</span>
                    <span className="text-amber-400 font-bold">${pos.stopLoss.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TAKE PROFIT (TP)</span>
                    <span className="text-cyan-400 font-bold">${pos.takeProfit.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Strategy:</span>
                    <span className="text-slate-200 font-semibold">{pos.strategyName}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-500">Regime:</span>
                    <span className="text-amber-300">{pos.regime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>Opened {new Date(pos.openTime).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Closed Deals Journal & Decision Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closed Deals Journal */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Verified Gold Trade History & Net Realized PnL
            </h3>
            <span className="text-xs text-slate-400 font-mono">XAUUSD Dealt Deals</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60 font-mono text-xs">
            {tradeHistory.map((trade) => (
              <div key={trade.ticket} className="pt-2 first:pt-0 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.type}
                    </span>
                    <span className="text-white font-bold">{trade.symbol}</span>
                    <span className="text-slate-400 text-[11px]">({trade.volume} lots)</span>
                  </div>
                  <span className="text-slate-500 text-[10px] block font-sans">
                    {trade.strategy} • {trade.closeReason} • {trade.timestamp}
                  </span>
                </div>

                <div className="text-right">
                  <span className={`font-bold block ${trade.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trade.netProfit >= 0 ? '+' : ''}${trade.netProfit.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    +${trade.pnlDollarsPerOz.toFixed(2)}/oz ({trade.resultR >= 0 ? '+' : ''}{trade.resultR.toFixed(2)}R)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Decision Audit Stream */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Disciplined Gold Audit Stream</h3>
            </div>
            <div className="flex gap-1 text-[11px] font-mono">
              <button
                onClick={() => setActiveLogFilter('ALL')}
                className={`px-2 py-0.5 rounded ${activeLogFilter === 'ALL' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold' : 'text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveLogFilter('REJECTIONS')}
                className={`px-2 py-0.5 rounded ${activeLogFilter === 'REJECTIONS' ? 'bg-amber-950 text-amber-400 border border-amber-800 font-bold' : 'text-slate-400'}`}
              >
                Rejections & Blocks
              </button>
              <button
                onClick={() => setActiveLogFilter('FILLS')}
                className={`px-2 py-0.5 rounded ${activeLogFilter === 'FILLS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold' : 'text-slate-400'}`}
              >
                Fills
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
            {filteredLogs.map((log, idx) => (
              <div key={idx} className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    <span className="text-amber-400 font-bold">{log.symbol}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        log.event.includes('BLOCKED') || log.event.includes('REJECTED')
                          ? 'bg-amber-950 text-amber-400'
                          : log.event.includes('STOP')
                          ? 'bg-rose-950 text-rose-400'
                          : 'bg-emerald-950 text-emerald-400'
                      }`}
                    >
                      {log.event}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[10px] font-sans">{log.strategy}</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans leading-relaxed">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
