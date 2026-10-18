import React, { useState } from 'react';
import {
  Download,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const DeploymentTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('ApexAITrader.mq5');
  const [hasCopied, setHasCopied] = useState(false);

  const fileSnippets: Record<string, string> = {
    'ApexAITrader.mq5': `//+------------------------------------------------------------------+
//|                                                ApexAITrader.mq5  |
//|                                  Apex AI Trader Autonomous Bot   |
//|               Professional AI MT5 Algorithmic Scalping System    |
//+------------------------------------------------------------------+
#property copyright "Apex AI Quantitative Team"
#property link      "https://apexaitrader.internal"
#property version   "1.00"

#include <Trade\\Trade.mqh>
#include "Include\\Apex\\RiskManager.mqh"
#include "Include\\Apex\\StopManager.mqh"
#include "Include\\Apex\\TradeExecution.mqh"
#include "Include\\Apex\\MarketScanner.mqh"
#include "Include\\Apex\\RegimeDetector.mqh"
#include "Include\\Apex\\StrategyLibrary.mqh"

input double InpMaxRiskPerTradePct  = 0.75; // Max Risk Per Trade (% Equity)
input double InpMaxPeakDrawdownPct  = 5.00; // Peak Drawdown Circuit Breaker (%)
input double InpMaxDailyLossPct      = 2.00; // Daily Loss Gate (%)
input int    InpMaxSpreadPoints     = 25;   // Max Spread Points Gate
input bool   InpUseBreakEven        = true; // Dynamic Break-Even + Cost Offset
input double InpBreakEvenTriggerR   = 1.00; // Move to BE after 1.0R profit

// Lifecycle Handlers: OnInit(), OnTick(), OnTimer(), OnTradeTransaction()`,

    'RiskManager.mqh': `//+------------------------------------------------------------------+
//|                                                  RiskManager.mqh |
//|                                  Apex AI Trader Risk Engine v1.0 |
//|                         Independent Hard Capital Preservation    |
//+------------------------------------------------------------------+
// Strictly calculates volume based on SL distance, tick value, and lot steps.
// Never rounds up. Skips trade if minimum lot (0.01) exceeds dollar risk!
double rawVolume = maxTradeRiskMoney / riskPerLot;
double steppedVolume = MathFloor(rawVolume / lotStep) * lotStep;

if(steppedVolume < minLot) {
   // Skip trade for capital preservation!
   return "REJECTED: Min lot exceeds risk ceiling";
}`,

    'StopManager.mqh': `//+------------------------------------------------------------------+
//|                                                  StopManager.mqh |
//|                    Dynamic ATR Stops, Break-Even & Trailing Risk |
//+------------------------------------------------------------------+
// Break-even movement with broker commission offset:
if(currentR >= m_config.breakEvenTriggerR) {
   double offsetPrice = m_config.breakEvenOffsetPips * pipVal;
   double candidateBE = NormalizeDouble(openPrice + offsetPrice, digits);
   // Never move SL backwards!
   if(candidateBE > currentSL + point) {
      ModifyStopLoss(ticket, symbol, candidateBE, currentTP);
   }
}`,

    'Apex_Conservative_Defaults.set': `; Apex AI Trader - Conservative Defaults Preset (.set)
InpAppWorkingName=Apex AI Trader
InpMagicNumber=100991
InpExecutionMode=2
InpMaxRiskPerTradePct=0.75
InpMaxTotalOpenRiskPct=3.00
InpMaxDailyLossPct=2.00
InpMaxWeeklyLossPct=5.00
InpMaxPeakDrawdownPct=5.00
InpMinFreeMarginLevel=250.0
InpMaxSpreadPoints=25
InpMaxSpreadToAtrRatio=0.20
InpMaxSimultaneousTrades=3
InpMaxTradesPerSymbol=1
InpMaxCorrelatedCurrency=2
InpMaxConsecutiveLosses=3
InpCooldownMinutes=90
InpEquityCompounding=true
InpUseBreakEven=true
InpBreakEvenTriggerR=1.00
InpBreakEvenOffsetPips=1.50`,

    'market_regime_model.py': `"""
Apex AI Trader - Quantitative Market Regime Classifier
Hurst Exponent, ADX, Bollinger Bandwidth & Uncertainty Scoring
"""
class MarketRegimeClassifier:
    def classify_regime(self, prices, high, low, spread_points, point_value=0.00001):
        # Estimates persistent drift (Hurst > 0.55) vs mean-reversion (Hurst < 0.45)
        # Flags ABNORMAL_UNSTABLE when spread > 25% of ATR bar`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileSnippets[selectedFile] || '');
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: One-Click Download */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-800/80 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-900 text-indigo-300 border border-indigo-700 text-xs font-mono font-bold">
              Production Release v1.00
            </span>
            <span className="text-xs text-slate-400">MetaTrader 5 Build 3800+ Compatible</span>
          </div>
          <h2 className="text-lg font-bold text-white">Download Apex AI Trader Complete Software Suite</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Includes all MQL5 Expert Advisor source files (`.mq5`, `.mqh`), presets (`.set`), Python quantitative engine, automated tests, and installation documentation in one archive.
          </p>
        </div>

        <a
          href="/api/mt5/download-ea-package"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all transform hover:scale-[1.02] flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          Download Package (.zip)
        </a>
      </div>

      {/* Grid: Installation Checklist & Source File Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Step-by-Step MT5 & VPS Setup */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-cyan-400" />
            MetaTrader 5 & VPS Setup Checklist
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="h-6 w-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 font-mono">
                1
              </span>
              <div>
                <span className="font-bold text-white block">Extract Files into MT5 Data Folder</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  In MT5, click <b>File -&gt; Open Data Folder</b>. Copy <code className="text-cyan-300">ApexAITrader.mq5</code> to <code className="text-cyan-300">MQL5/Experts/</code> and the <code className="text-cyan-300">Include/Apex/</code> folder into <code className="text-cyan-300">MQL5/Include/Apex/</code>.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="h-6 w-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 font-mono">
                2
              </span>
              <div>
                <span className="font-bold text-white block">Configure Terminal Options (WebRequest & Algo Trading)</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Press <kbd className="px-1 rounded bg-slate-800">Ctrl + O</kbd> -&gt; Expert Advisors tab. Check <b>Allow automated trading</b> and <b>Allow WebRequest</b>. Add <code className="text-cyan-300">http://127.0.0.1:3000</code> to the authorized URLs.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="h-6 w-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 font-mono">
                3
              </span>
              <div>
                <span className="font-bold text-white block">Compile Expert Advisor in MetaEditor</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Press <kbd className="px-1 rounded bg-slate-800">F4</kbd> to open MetaEditor. Open <code className="text-cyan-300">ApexAITrader.mq5</code> and click <b>Compile (F7)</b>. Confirm it generates 0 errors and 0 warnings.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="h-6 w-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 font-mono">
                4
              </span>
              <div>
                <span className="font-bold text-white block">Attach to Chart & Load Conservative Preset</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Open an M5 chart (EURUSD or XAUUSD). Drag ApexAITrader from the Navigator onto the chart. In Inputs, load <code className="text-cyan-300">Apex_Conservative_Defaults.set</code>. Ensure the top toolbar Algo Trading icon is green.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code & Preset Inspector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Source Code & Preset Viewer</h3>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{hasCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* File Picker Pills */}
          <div className="flex flex-wrap gap-1.5 pb-2">
            {Object.keys(fileSnippets).map((fn) => (
              <button
                key={fn}
                onClick={() => setSelectedFile(fn)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                  selectedFile === fn
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {fn}
              </button>
            ))}
          </div>

          {/* Code Viewer Area */}
          <div className="flex-1 bg-slate-950 rounded-lg p-3 border border-slate-800 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre select-text">
            {fileSnippets[selectedFile]}
          </div>
        </div>
      </div>
    </div>
  );
};
