import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Cpu,
  Power,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Edit2,
  Check,
  Eye,
  Smartphone
} from 'lucide-react';
import { ExecutionMode, GoldOperationalState, GoldSystemTelemetry } from '../types/apex';

interface HeaderProps {
  telemetry: GoldSystemTelemetry | null;
  onEmergencyStop: (action: 'HALT_AND_LIQUIDATE' | 'HALT_ENTRIES_ONLY') => void;
  onResetEmergencyStop: () => void;
  onModeChange: (mode: ExecutionMode, authKey?: string) => Promise<void>;
  appName: string;
  onRenameApp: (newName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  onEmergencyStop,
  onResetEmergencyStop,
  onModeChange,
  appName,
  onRenameApp,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(appName);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyAction, setEmergencyAction] = useState<'HALT_AND_LIQUIDATE' | 'HALT_ENTRIES_ONLY'>('HALT_AND_LIQUIDATE');
  const [showLiveAuthModal, setShowLiveAuthModal] = useState(false);
  const [liveKeyInput, setLiveKeyInput] = useState('');
  const [liveChecklist, setLiveChecklist] = useState({
    demoTested: false,
    goldVolatilityUnderstood: false,
    slVerified: false,
    brokerRawEcn: false,
  });

  const account = telemetry?.account;
  const market = telemetry?.market;
  const isEmergency = telemetry?.isEmergencyStopped || telemetry?.circuitBreakerTripped;
  const opState: GoldOperationalState = telemetry?.operationalState || (isEmergency ? 'EMERGENCY STOP' : 'READY');

  const handleSaveName = () => {
    if (editedName.trim()) {
      onRenameApp(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleConfirmLiveMode = async () => {
    if (!liveChecklist.demoTested || !liveChecklist.goldVolatilityUnderstood || !liveChecklist.slVerified) {
      alert('You must acknowledge all mandatory safety checklist requirements before authorizing live Gold trading.');
      return;
    }
    try {
      await onModeChange('LIVE_STRICT_CONFIRM', liveKeyInput.trim());
      setShowLiveAuthModal(false);
      setLiveKeyInput('');
    } catch (err: any) {
      alert(err.message || 'Live authorization failed.');
    }
  };

  // State colors
  const stateColorMap: Record<GoldOperationalState, { bg: string; text: string; ring: string }> = {
    'DISCONNECTED': { bg: 'bg-slate-800', text: 'text-slate-400', ring: 'ring-slate-700' },
    'OBSERVING': { bg: 'bg-blue-950', text: 'text-blue-400', ring: 'ring-blue-800' },
    'ANALYZING': { bg: 'bg-purple-950', text: 'text-purple-400', ring: 'ring-purple-800' },
    'READY': { bg: 'bg-emerald-950', text: 'text-emerald-400', ring: 'ring-emerald-800' },
    'EXECUTING': { bg: 'bg-cyan-950 animate-pulse', text: 'text-cyan-400', ring: 'ring-cyan-500' },
    'MANAGING POSITION': { bg: 'bg-indigo-950', text: 'text-indigo-400', ring: 'ring-indigo-800' },
    'PAUSED': { bg: 'bg-amber-950', text: 'text-amber-400', ring: 'ring-amber-800' },
    'EMERGENCY STOP': { bg: 'bg-rose-950', text: 'text-rose-400', ring: 'ring-rose-800' },
  };

  const stateStyle = stateColorMap[opState] || stateColorMap['READY'];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-3 lg:px-6 py-2.5 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: App Identity & Instrument Badge */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50 flex-shrink-0">
              <span className="font-extrabold text-slate-950 text-sm tracking-tighter font-mono">AU</span>
            </div>

            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="bg-slate-900 border border-amber-500/60 rounded px-2 py-0.5 text-sm font-bold text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                  <h1 className="text-base lg:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                    {appName}
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono font-bold">
                      XAUUSD ONLY
                    </span>
                  </h1>
                  <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              )}
            </div>

            {/* Operational State Indicator Badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${stateStyle.bg} ${stateStyle.text} ring-1 ${stateStyle.ring}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${opState === 'EMERGENCY STOP' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${opState === 'EMERGENCY STOP' ? 'bg-red-500' : 'bg-amber-500'}`} />
              </span>
              <span>{opState}</span>
            </div>
          </div>

          {/* Center: Live Gold Price & Account Telemetry Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex items-center gap-2 lg:gap-4 text-xs font-mono bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
            {/* Live Gold Price */}
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Gold Spot (XAUUSD)</span>
              <span className="font-extrabold text-amber-400 text-sm">
                ${market ? market.spotPrice.toFixed(2) : '2,727.35'}
              </span>
              <span className="text-slate-500 text-[10px] block">Spread: {market ? `${market.spreadPoints} pts ($${market.spreadDollars})` : '22 pts'}</span>
            </div>

            {/* Account Equity */}
            {account && (
              <>
                <div className="border-l border-slate-800 pl-2 lg:pl-3">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Account Equity</span>
                  <span className="font-bold text-white text-sm">
                    ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-slate-500 text-[10px] block">Free: ${account.freeMargin.toFixed(0)}</span>
                </div>

                <div className="border-l border-slate-800 pl-2 lg:pl-3">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Daily PnL</span>
                  <span className={`font-bold ${account.dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {account.dailyPnL >= 0 ? '+' : ''}${account.dailyPnL.toFixed(2)} ({account.dailyPnLPct >= 0 ? '+' : ''}{account.dailyPnLPct.toFixed(2)}%)
                  </span>
                  <span className="text-slate-500 text-[10px] block">Cap: -1.0%</span>
                </div>

                <div className="border-l border-slate-800 pl-2 lg:pl-3">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Drawdown</span>
                  <span className={`font-semibold ${account.currentDrawdownPct > 2.0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {account.currentDrawdownPct.toFixed(2)}% <span className="text-slate-500 text-[10px]">/ 4.0%</span>
                  </span>
                  <span className="text-slate-500 text-[10px] block">High: ${account.peakEquity.toFixed(0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Right: Operational Mode Selector & Emergency Stop */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-medium">
              <button
                onClick={() => onModeChange('DEMO_AUTONOMOUS')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  telemetry?.mode === 'DEMO_AUTONOMOUS'
                    ? 'bg-amber-600 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Demo Active
              </button>

              <button
                onClick={() => onModeChange('MONITOR_ONLY')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  telemetry?.mode === 'MONITOR_ONLY'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monitor Only
              </button>

              <button
                onClick={() => setShowLiveAuthModal(true)}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                  telemetry?.mode === 'LIVE_STRICT_CONFIRM'
                    ? 'bg-rose-600 text-white font-bold shadow-sm ring-1 ring-rose-400'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                <Lock className="w-3 h-3" />
                Live Mode
              </button>
            </div>

            {/* Emergency Stop Button */}
            {isEmergency ? (
              <button
                onClick={onResetEmergencyStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Activity className="w-3.5 h-3.5" />
                Reset Circuit Breaker
              </button>
            ) : (
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/20 ring-1 ring-rose-500/50 hover:scale-[1.02] transition-all"
              >
                <Power className="w-3.5 h-3.5" />
                Emergency Stop
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Emergency Stop Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-xl max-w-md w-full p-6 shadow-2xl shadow-rose-950/50 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-lg bg-rose-950 border border-rose-800">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Emergency Stop Confirmation</h3>
                <p className="text-xs text-rose-300">Halt Gold trading operations immediately</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Activating Emergency Stop will trip the local circuit breaker and instruct the native MQL5 Expert Advisor to immediately stop. Choose execution policy:
            </p>

            <div className="space-y-2 text-xs">
              <label
                onClick={() => setEmergencyAction('HALT_AND_LIQUIDATE')}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  emergencyAction === 'HALT_AND_LIQUIDATE'
                    ? 'bg-rose-950/40 border-rose-500 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="emergencyAction"
                  checked={emergencyAction === 'HALT_AND_LIQUIDATE'}
                  onChange={() => setEmergencyAction('HALT_AND_LIQUIDATE')}
                  className="mt-0.5 accent-rose-500"
                />
                <div>
                  <span className="font-bold block text-sm">Halt & Liquidate All Gold Positions (Recommended)</span>
                  <span className="text-slate-400 text-xs">
                    Instantly closes any open XAUUSD position at market to eliminate market volatility exposure.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setEmergencyAction('HALT_ENTRIES_ONLY')}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  emergencyAction === 'HALT_ENTRIES_ONLY'
                    ? 'bg-amber-950/40 border-amber-500 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="emergencyAction"
                  checked={emergencyAction === 'HALT_ENTRIES_ONLY'}
                  onChange={() => setEmergencyAction('HALT_ENTRIES_ONLY')}
                  className="mt-0.5 accent-amber-500"
                />
                <div>
                  <span className="font-bold block text-sm">Halt New Entries Only</span>
                  <span className="text-slate-400 text-xs">
                    Existing gold positions remain protected by hard SL/TP and trailing rules, but zero new orders can trigger.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onEmergencyStop(emergencyAction);
                  setShowEmergencyModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Confirm Emergency Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Trading Authorization Gate Modal */}
      {showLiveAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/60 rounded-xl max-w-lg w-full p-6 shadow-2xl shadow-amber-950/40 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-lg bg-amber-950 border border-amber-800">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Live Gold Execution Safety Gate</h3>
                <p className="text-xs text-amber-300">Strict confirmation required for real capital deployment on XAUUSD</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Gold (XAUUSD) exhibits rapid price swings of $10-$40 in minutes. Live trading requires explicit risk acknowledgment. Verify all mandatory prerequisites:
            </p>

            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={liveChecklist.demoTested}
                  onChange={(e) => setLiveChecklist({ ...liveChecklist, demoTested: e.target.checked })}
                  className="mt-0.5 accent-amber-500"
                />
                <span>I have completed at least 14 days of demo forward testing on MT5 without abnormal execution errors.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={liveChecklist.goldVolatilityUnderstood}
                  onChange={(e) => setLiveChecklist({ ...liveChecklist, goldVolatilityUnderstood: e.target.checked })}
                  className="mt-0.5 accent-amber-500"
                />
                <span>I understand that conservative risk (0.25% - 0.50% per trade) is strictly enforced and trades will be skipped if 0.01 lot exceeds my dollar risk budget.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={liveChecklist.slVerified}
                  onChange={(e) => setLiveChecklist({ ...liveChecklist, slVerified: e.target.checked })}
                  className="mt-0.5 accent-amber-500"
                />
                <span>I confirm that every position must have a broker-validated protective Stop Loss placed at entry.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={liveChecklist.brokerRawEcn}
                  onChange={(e) => setLiveChecklist({ ...liveChecklist, brokerRawEcn: e.target.checked })}
                  className="mt-0.5 accent-amber-500"
                />
                <span>I am using an ECN / Raw Spread account with low gold spreads (under 30 points / $0.30/oz).</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authorization Key (Passphrase: <code className="text-amber-400 font-mono">AUTHORIZED_GOLD_APEX_2026</code>)
              </label>
              <input
                type="text"
                placeholder="Enter AUTHORIZED_GOLD_APEX_2026"
                value={liveKeyInput}
                onChange={(e) => setLiveKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowLiveAuthModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLiveMode}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30"
              >
                Authorize Live Gold Scalper
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
