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
  RotateCcw
} from 'lucide-react';
import { RiskConfig } from '../types/apex';

interface RiskFortressTabProps {
  riskConfig: RiskConfig;
  onUpdateRiskConfig: (config: RiskConfig) => void;
}

export const RiskFortressTab: React.FC<RiskFortressTabProps> = ({
  riskConfig,
  onUpdateRiskConfig,
}) => {
  const [formData, setFormData] = useState<RiskConfig>(riskConfig);
  const [isSaved, setIsSaved] = useState(false);

  // Position Sizing Sandbox Calculator State
  const [calcEquity, setCalcEquity] = useState<number>(10000);
  const [calcRiskPct, setCalcRiskPct] = useState<number>(0.75);
  const [calcSlPoints, setCalcSlPoints] = useState<number>(120);
  const [calcSymbol, setCalcSymbol] = useState<string>('EURUSD');

  // Math simulation
  const maxDollarRisk = calcEquity * (calcRiskPct / 100.0);
  const pointValuePerLot = calcSymbol === 'XAUUSD' ? 1.0 : 1.0; // Standard lot point value ($1/pt)
  const riskPerStandardLot = calcSlPoints * pointValuePerLot;
  const rawLots = riskPerStandardLot > 0 ? maxDollarRisk / riskPerStandardLot : 0;
  const lotStep = 0.01;
  const steppedLots = Math.floor(rawLots / lotStep) * lotStep;
  const minLot = 0.01;
  const minLotDollarRisk = minLot * riskPerStandardLot;
  const isMinLotSafe = minLotDollarRisk <= maxDollarRisk;

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
          <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-white">Risk Fortress & Hard Preservation Engine</h2>
            <p className="text-xs text-slate-400">
              Independent risk manager operates in native MQL5. Never overridden by AI or language models.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          {isSaved ? 'Parameters Synced!' : 'Save Risk Parameters'}
        </button>
      </div>

      {/* Grid: Risk Parameters & Correlated Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Risk Parameters Form */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-cyan-400" />
            Hard Circuit Breakers & Invariant Ceilings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Risk per trade */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Max Risk Per Trade (% Equity)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.25"
                max="2.00"
                value={formData.maxRiskPerTradePct}
                onChange={(e) => setFormData({ ...formData, maxRiskPerTradePct: parseFloat(e.target.value) || 0.75 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">Conservative default: 0.75%</span>
            </div>

            {/* Total Open Risk */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Max Total Cumulative Open Risk (%)
              </label>
              <input
                type="number"
                step="0.25"
                min="1.0"
                max="6.0"
                value={formData.maxTotalOpenRiskPct}
                onChange={(e) => setFormData({ ...formData, maxTotalOpenRiskPct: parseFloat(e.target.value) || 3.0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">Max risk across all open positions</span>
            </div>

            {/* Daily Loss Gate */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Daily Loss Circuit Breaker (%)
              </label>
              <input
                type="number"
                step="0.25"
                min="1.0"
                max="5.0"
                value={formData.maxDailyLossPct}
                onChange={(e) => setFormData({ ...formData, maxDailyLossPct: parseFloat(e.target.value) || 2.0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">Stops new entries until next day 00:00 UTC</span>
            </div>

            {/* Peak Drawdown Cutoff */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Peak Drawdown Circuit Breaker (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="2.0"
                max="10.0"
                value={formData.maxPeakDrawdownPct}
                onChange={(e) => setFormData({ ...formData, maxPeakDrawdownPct: parseFloat(e.target.value) || 5.0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">Prop-firm / High-water mark ceiling</span>
            </div>

            {/* Max Spread Points */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Max Allowable Spread (Points)
              </label>
              <input
                type="number"
                value={formData.maxSpreadPoints}
                onChange={(e) => setFormData({ ...formData, maxSpreadPoints: parseInt(e.target.value) || 25 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">Rejects entry during rollover widening</span>
            </div>

            {/* Consecutive Losses Cooldown */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <label className="text-slate-400 font-sans block text-[11px] font-semibold">
                Loss Streak Cooldown (Losses / Mins)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.maxConsecutiveLosses}
                  onChange={(e) => setFormData({ ...formData, maxConsecutiveLosses: parseInt(e.target.value) || 3 })}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none"
                  placeholder="3 losses"
                />
                <input
                  type="number"
                  value={formData.cooldownMinutes}
                  onChange={(e) => setFormData({ ...formData, cooldownMinutes: parseInt(e.target.value) || 90 })}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none"
                  placeholder="90 mins"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-sans block">Prevents tilt and market regime shocks</span>
            </div>
          </div>
        </div>

        {/* Right Column: Correlated Currency Radar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-indigo-400" />
            Correlated Currency Cap (Max 2)
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">EUR Exposure</span>
                <span className="text-emerald-400 font-bold">1 / 2 Active</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full w-1/2" />
              </div>
              <span className="text-[10px] text-slate-500 font-sans">Active: EURUSD (Buy 0.52 lots)</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">USD Exposure</span>
                <span className="text-emerald-400 font-bold">2 / 2 Cap</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full w-full" />
              </div>
              <span className="text-[10px] text-amber-400/90 font-sans">Cap reached (EURUSD & XAUUSD). 3rd USD skipped.</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">Gold (XAU) Exposure</span>
                <span className="text-emerald-400 font-bold">1 / 1 Cap</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full w-full" />
              </div>
              <span className="text-[10px] text-slate-500 font-sans">Active: XAUUSD (Buy 0.15 lots)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Position Sizing Simulator & Mathematical Proof */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Live Mathematical Lot-Sizing Sandbox</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block text-[11px] mb-1">Account Equity ($)</label>
            <input
              type="number"
              value={calcEquity}
              onChange={(e) => setCalcEquity(parseFloat(e.target.value) || 10000)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block text-[11px] mb-1">Risk Fraction (%)</label>
            <input
              type="number"
              step="0.05"
              value={calcRiskPct}
              onChange={(e) => setCalcRiskPct(parseFloat(e.target.value) || 0.75)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block text-[11px] mb-1">Stop-Loss Distance (Points)</label>
            <input
              type="number"
              value={calcSlPoints}
              onChange={(e) => setCalcSlPoints(parseInt(e.target.value) || 120)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block text-[11px] mb-1">Symbol</label>
            <select
              value={calcSymbol}
              onChange={(e) => setCalcSymbol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:outline-none"
            >
              <option value="EURUSD">EURUSD (ECN 5-digit)</option>
              <option value="XAUUSD">XAUUSD (Gold)</option>
              <option value="GBPUSD">GBPUSD</option>
              <option value="USDJPY">USDJPY</option>
            </select>
          </div>
        </div>

        {/* Calculation Output Card */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">MAX PERMITTED RISK:</span>
            <span className="text-base font-bold text-white">${maxDollarRisk.toFixed(2)}</span>
            <span className="text-slate-400 text-[10px] block font-sans">({calcRiskPct}% of ${calcEquity})</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">RISK PER 1.0 LOT:</span>
            <span className="text-base font-bold text-slate-200">${riskPerStandardLot.toFixed(2)}</span>
            <span className="text-slate-400 text-[10px] block font-sans">({calcSlPoints} pts × $1/pt)</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">STEPPED VOLUME (FLOOR):</span>
            <span className="text-base font-bold text-cyan-400">{steppedLots.toFixed(2)} Lots</span>
            <span className="text-slate-400 text-[10px] block font-sans">Strict downward rounding</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px]">MIN LOT (0.01) VERIFICATION:</span>
            {isMinLotSafe ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                PASS (${minLotDollarRisk.toFixed(2)})
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1 text-sm">
                <AlertTriangle className="w-4 h-4" />
                REJECT (${minLotDollarRisk.toFixed(2)} &gt; ${maxDollarRisk.toFixed(2)})
              </span>
            )}
            <span className="text-slate-400 text-[10px] block font-sans">
              {isMinLotSafe ? 'Within risk ceiling' : 'Capital preserved: Trade skipped!'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
