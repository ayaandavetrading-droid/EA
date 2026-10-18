import React from 'react';
import {
  X,
  Server,
  Download,
  Smartphone,
  Play,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Terminal,
  HelpCircle
} from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Simple 3-Step Setup Guide</h2>
              <p className="text-xs text-slate-400">Run independently on Desktop/VPS with Phone Supervision</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The 3 Simple Steps */}
        <div className="space-y-3 text-xs">
          {/* STEP 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center font-mono text-xs">
                  1
                </span>
                <span className="font-bold text-white text-sm">Install Expert Advisor on Desktop MT5 or VPS</span>
              </div>
              <a
                href="/api/gold/download-package"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download Package (.zip)
              </a>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Extract the package. Copy <code className="text-amber-400 font-mono">ApexGoldAI.mq5</code> into your MT5 <code className="text-slate-400 font-mono">MQL5/Experts/</code> folder. In MetaEditor (<kbd className="px-1 rounded bg-slate-800">F4</kbd>), press <kbd className="px-1 rounded bg-slate-800">F7</kbd> to compile. Attach it to any <b>M5 Gold chart</b> (XAUUSD / GOLD) and enable <b>Algo Trading</b>.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center font-mono text-xs">
                2
              </span>
              <span className="font-bold text-white text-sm">Open MetaTrader 5 on Your Phone</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Open MetaTrader 5 on your iPhone or Android and log into the same trading account. Open the Gold (XAUUSD) chart.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center font-mono text-xs">
                3
              </span>
              <span className="font-bold text-white text-sm">Share Screen & Tap START</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              In this Apex Gold AI app, tap <b>"Share MT5 Screen"</b> to start visual supervision, then tap <b>"START TRADING"</b>. The AI automatically scans trends, momentum, spreads, and takes care of sizing, entry, protective stop-loss, dynamic break-even, and profit targets.
            </p>
          </div>
        </div>

        {/* Continuous Reassurance */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Why You Can Leave Your Phone on the Table</span>
          </div>
          <p>
            Your phone is an optional supervisory and control window. The trading engine operates authoritatively inside the MT5 terminal on your desktop/VPS. Even if your phone disconnects, runs out of battery, or sleeps, your open positions remain safely protected by hard stop-losses, trailing stops, and break-even rules on the broker's servers.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
          >
            Got It, Let's Trade
          </button>
        </div>
      </div>
    </div>
  );
};
