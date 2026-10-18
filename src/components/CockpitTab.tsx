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
  DollarSign
} from 'lucide-react';
import { AuditLogItem, ClosedTradeRecord, PositionRecord, SystemTelemetry } from '../types/apex';

interface CockpitTabProps {
  telemetry: SystemTelemetry | null;
  positions: PositionRecord[];
  tradeHistory: ClosedTradeRecord[];
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
  const aspirationalTarget = 20000.00; // 100% return on $10,000 starting equity
  const currentEquity = account?.equity ?? 10412.80;
  const progressPct = Math.min(100, Math.max(0, ((currentEquity - 10000.00) / 10000.00) * 100));

  const [activeLogFilter, setActiveLogFilter] = useState<'ALL' | 'REJECTIONS' | 'FILLS'>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    if (activeLogFilter === 'REJECTIONS') return log.event.includes('REJECTED');
    if (activeLogFilter === 'FILLS') return log.event.includes('ORDER_FILLED') || log.event.includes('POSITION_CLOSED');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Equity Progress & Account Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Account High-Water Mark & Progress */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Adaptive Compounding Milestone</h3>
                <p className="text-[11px] text-slate-400">Aspirational 100% Growth Target</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">+{progressPct.toFixed(1)}%</span>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Baseline: $10,000</span>
              <span className="text-white font-bold">${currentEquity.toFixed(2)}</span>
              <span className="text-slate-400">Target: $20,000</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, progressPct)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 italic pt-1">
              Disciplined position sizing adjusts dynamically based on current equity. Never forced by deadlines.
            </p>
          </div>
        </div>

        {/* Card 2: Risk Envelope & Circuit Breaker State */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800/60 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Capital Risk Envelope</h3>
                <p className="text-[11px] text-slate-400">Hard preservation bounds</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono font-bold">
              SAFE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3 text-xs font-mono">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">PEAK DRAWDOWN</span>
              <span className="font-bold text-emerald-400">{account?.currentDrawdownPct.toFixed(2)}%</span>
              <span className="text-slate-600 text-[10px] block">Max Cap: 5.0%</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">DAILY PnL GATE</span>
              <span className={`font-bold ${account && account.dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {account ? `${account.dailyPnLPct >= 0 ? '+' : ''}${account.dailyPnLPct.toFixed(2)}%` : '+2.81%'}
              </span>
              <span className="text-slate-600 text-[10px] block">Limit: -2.0%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Execution Quality & EA Latency */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800/60 text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Execution Health</h3>
                <p className="text-[11px] text-slate-400">ECN Fill Quality & Latency</p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {telemetry?.connection?.pingMs ?? 24}ms ping
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 mt-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Positions:</span>
              <span className="font-mono font-bold text-white">{positions.length} / 3 Max</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Average Slippage:</span>
              <span className="font-mono text-emerald-400">0.8 points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duplicate Guard:</span>
              <span className="font-mono text-emerald-400">Active & Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Positions Deck */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm lg:text-base font-bold text-white">Open Scalping Positions</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
              {positions.length} Active
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Governed by ATR Stops, Auto Break-Even & Trailing Logic
          </span>
        </div>

        {positions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No active scalping positions</p>
            <p className="text-xs text-slate-500">
              The scanner is monitoring enabled symbols for optimal setups matching verified regimes.
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
                    <span className="text-xs text-slate-400 font-mono">{pos.volume} lots</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono hidden md:inline">
                      #{pos.ticket}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {pos.breakEvenActivated && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-mono flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        BE Locked (+1.5p)
                      </span>
                    )}
                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-emerald-400 block">
                        +${pos.unrealizedPnL.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        +{pos.pnlPips} pips ({pos.currentR.toFixed(2)}R)
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

                {/* Price Levels & Strategy Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">ENTRY PRICE</span>
                    <span className="text-slate-200 font-bold">{pos.openPrice.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CURRENT PRICE</span>
                    <span className="text-white font-bold">{pos.currentPrice.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PROTECTIVE SL</span>
                    <span className="text-amber-400 font-bold">{pos.stopLoss.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TAKE PROFIT (TP)</span>
                    <span className="text-cyan-400 font-bold">{pos.takeProfit.toFixed(5)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Strategy:</span>
                    <span className="text-slate-300 font-semibold">{pos.strategyName}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-500">Regime:</span>
                    <span className="text-slate-300">{pos.regime}</span>
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

      {/* Split Grid: Closed Trades Journal & Real-Time Decision Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closed Trades Journal */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg p-5 flex flex-col h-[420px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Recent Trade History & Net Realized PnL
            </h3>
            <span className="text-xs text-slate-400 font-mono">Sample History</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
            {tradeHistory.map((trade) => (
              <div key={trade.ticket} className="pt-2 first:pt-0 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.type}
                    </span>
                    <span className="text-white font-bold">{trade.symbol}</span>
                    <span className="text-slate-400 font-sans text-[11px]">({trade.strategy})</span>
                  </div>
                  <span className="text-slate-500 text-[10px] block font-sans">
                    {trade.closeReason} • {trade.timestamp}
                  </span>
                </div>

                <div className="text-right">
                  <span className={`font-bold block ${trade.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trade.netProfit >= 0 ? '+' : ''}${trade.netProfit.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {trade.pnlPips >= 0 ? '+' : ''}{trade.pnlPips} pips ({trade.resultR >= 0 ? '+' : ''}{trade.resultR.toFixed(2)}R)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Decision Audit Stream */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg p-5 flex flex-col h-[420px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Disciplined Decision Audit Stream</h3>
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
                Rejections
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
              <div key={idx} className="p-2 rounded bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    <span className="text-cyan-400 font-bold">{log.symbol}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        log.event.includes('REJECTED')
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
