import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Calculator,
  Lock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Save,
  Ban
} from 'lucide-react';
import { GoldRiskConfig } from '../types/apex';

interface RiskFortressTabProps {
  riskConfig: GoldRiskConfig;
  onUpdateRiskConfig: (config: GoldRiskConfig) => void;
}

export const RiskFortressTab: React.FC<RiskFortressTabProps> = ({
  riskConfig,
  onUpdateRiskConfig,
}) => {
  const [formData, setFormData] = useState<GoldRiskConfig>(riskConfig);
  const [isSaved, setIsSaved] = useState(false);

  // Position Sizing Sandbox Calculator State for Gold
  const [calcEquity, setCalcEquity] = useState<number>(10000);
  const [calcRiskPct, setCalcRiskPct] = useState<number>(0.25); // Default 0.25%
  const [calcSlDollars, setCalcSlDollars] = useState<number>(3.00); // $3.00/oz stop on Gold
  const contractSizeOz = 100; // 100 oz per standard lot
  const lotStep = 0.01;
  const minLot = 0.01;

  // Gold Sizing Math
  const maxDollarBudget = calcEquity * (calcRiskPct / 100.0);
  const riskPerStandardLot = calcSlDollars * contractSizeOz; // e.g. $3 * 100 = $300
  const rawLots = riskPerStandardLot > 0 ? maxDollarBudget / riskPerStandardLot : 0;
  const steppedLots = Math.floor(rawLots / lotStep) * lotStep;
  const minLotDollarRisk = minLot * riskPerStandardLot;
  const isMinLotSafe = minLotDollarRisk <= maxDollarBudget;

  const handleSave = () => {
    onUpdateRiskConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-white">Gold Risk Fortress & Hard Invariants</h2>
            <p className="text-xs text-slate-400">
              0.25% demo starting risk, strict downward lot rounding, and non-gold instrument blocking
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          {isSaved ? 'Parameters Synced!' : 'Save Risk Parameters'}
        </button>
      </div>

      {/* Grid: Risk Form & Exclusive Gold Security Barrier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): Risk Parameters */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-amber-400" />
            Hard Circuit Breakers (Non-Overridable by AI)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Risk Per Trade */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Risk Per Gold Trade (% Equity)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.10"
                max="1.50"
                value={formData.riskPerTradePct}
                onChange={(e) => setFormData({ ...formData, riskPerTradePct: parseFloat(e.target.value) || 0.25 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-amber-400/90 font-sans block">Starting demo recommendation: 0.25%</span>
            </div>

            {/* Daily Loss Limit */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Daily Loss Circuit Breaker (%)
              </label>
              <input
                type="number"
                step="0.25"
                min="0.5"
                max="3.0"
                value={formData.maxDailyLossPct}
                onChange={(e) => setFormData({ ...formData, maxDailyLossPct: parseFloat(e.target.value) || 1.0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">Stops entries until 00:00 server reset (1.00%)</span>
            </div>

            {/* Max Peak Drawdown */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Peak Drawdown Ceiling (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="2.0"
                max="6.0"
                value={formData.maxPeakDrawdownPct}
                onChange={(e) => setFormData({ ...formData, maxPeakDrawdownPct: parseFloat(e.target.value) || 4.0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">High-water mark cutoff: 4.00%</span>
            </div>

            {/* Max Spread Points */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Max Allowable Gold Spread (Points)
              </label>
              <input
                type="number"
                value={formData.maxSpreadPoints}
                onChange={(e) => setFormData({ ...formData, maxSpreadPoints: parseInt(e.target.value) || 35 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">35 points = $0.35/oz on Gold</span>
            </div>

            {/* Max Concurrent Gold Trades */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Max Concurrent Gold Trades
              </label>
              <input
                type="number"
                min="1"
                max="2"
                value={formData.maxConcurrentGoldTrades}
                onChange={(e) => setFormData({ ...formData, maxConcurrentGoldTrades: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">Strictly limits exposure (default 1)</span>
            </div>

            {/* Loss Streak Cooldown */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Cooldown (Losses / Duration)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.maxConsecutiveLosses}
                  onChange={(e) => setFormData({ ...formData, maxConsecutiveLosses: parseInt(e.target.value) || 3 })}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-bold focus:outline-none"
                  placeholder="3 losses"
                />
                <input
                  type="number"
                  value={formData.cooldownMinutes}
                  onChange={(e) => setFormData({ ...formData, cooldownMinutes: parseInt(e.target.value) || 60 })}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-bold focus:outline-none"
                  placeholder="60 mins"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-sans block">Automatic pause prevents tilt</span>
            </div>
          </div>
        </div>

        {/* Right (1 Col): Exclusive Gold Security Barrier */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Ban className="w-4 h-4 text-rose-400" />
            Exclusive Gold Hard Barrier
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 space-y-1">
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>MAPPED GOLD SYMBOL</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-sm block">XAUUSD</span>
              <span className="text-[10px] text-slate-400 font-sans">100 oz Contract • Tick $0.01 • Full Trading Enabled</span>
            </div>

            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/80 space-y-1.5 text-[11px]">
              <span className="text-rose-400 font-bold block flex items-center gap-1 font-sans">
                <AlertTriangle className="w-3.5 h-3.5" />
                NON-GOLD SYMBOLS PROHIBITED:
              </span>
              <p className="text-slate-300 font-sans leading-relaxed">
                Orders on EURUSD, GBPUSD, BTCUSD, US30, or any other non-gold asset are hard-rejected in the native MQL5 execution layer.
              </p>
              <div className="flex flex-wrap gap-1 text-[10px] text-slate-400 pt-1">
                <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 line-through">EURUSD</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 line-through">GBPUSD</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 line-through">BTCUSD</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 line-through">US30</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gold Position Sizing Mathematical Sandbox */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Calculator className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">XAUUSD Position Sizing Sandbox & Min Lot Risk Proof</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block text-[11px] mb-1 font-sans">Account Equity ($)</label>
            <input
              type="number"
              value={calcEquity}
              onChange={(e) => setCalcEquity(parseFloat(e.target.value) || 10000)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block text-[11px] mb-1 font-sans">Risk Budget (% of Equity)</label>
            <input
              type="number"
              step="0.05"
              value={calcRiskPct}
              onChange={(e) => setCalcRiskPct(parseFloat(e.target.value) || 0.25)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block text-[11px] mb-1 font-sans">Stop Loss Distance ($/oz on Gold)</label>
            <input
              type="number"
              step="0.25"
              value={calcSlDollars}
              onChange={(e) => setCalcSlDollars(parseFloat(e.target.value) || 3.00)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Calculation Output Cards */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">AUTHORIZED RISK BUDGET:</span>
            <span className="text-base font-bold text-white">${maxDollarBudget.toFixed(2)}</span>
            <span className="text-slate-400 text-[10px] block font-sans">({calcRiskPct}% of ${calcEquity.toLocaleString()})</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">RISK ON 1.0 STANDARD LOT:</span>
            <span className="text-base font-bold text-slate-200">${riskPerStandardLot.toFixed(2)}</span>
            <span className="text-slate-400 text-[10px] block font-sans">(${calcSlDollars}/oz × 100 oz contract)</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">STEPPED VOLUME (FLOOR):</span>
            <span className="text-base font-bold text-amber-400">{steppedLots.toFixed(2)} Lots</span>
            <span className="text-slate-400 text-[10px] block font-sans">Rounded down to nearest 0.01 step</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">MIN LOT (0.01) SAFETY GATE:</span>
            {isMinLotSafe ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                PASS (${minLotDollarRisk.toFixed(2)} &le; ${maxDollarBudget.toFixed(2)})
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1 text-sm">
                <AlertTriangle className="w-4 h-4" />
                REJECT (${minLotDollarRisk.toFixed(2)} &gt; ${maxDollarBudget.toFixed(2)})
              </span>
            )}
            <span className="text-slate-400 text-[10px] block font-sans">
              {isMinLotSafe ? 'Order authorized' : 'Trade skipped: Capital preserved!'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
