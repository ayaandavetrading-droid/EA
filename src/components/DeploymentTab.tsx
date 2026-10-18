import React, { useState } from 'react';
import {
  Download,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  Server,
  ExternalLink,
  ShieldCheck,
  Coins
} from 'lucide-react';

export const DeploymentTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('ApexGoldAI.mq5');
  const [hasCopied, setHasCopied] = useState(false);

  const fileSnippets: Record<string, string> = {
    'ApexGoldAI.mq5': `//+------------------------------------------------------------------+
//|                                                  ApexGoldAI.mq5  |
//|                    Apex Gold AI — Autonomous XAUUSD Scalper      |
//|       Exclusive Gold Mode • Quantitative Regimes • Hard Risk Core|
//+------------------------------------------------------------------+
#property copyright "Apex Gold AI Quantitative Team"
#property link      "https://apexgold.internal"
#property version   "1.00"
#property description "Autonomous MT5 Scalping Agent dedicated exclusively to XAUUSD (Gold)."

#include <Trade\\Trade.mqh>
#include "Include\\ApexGold\\GoldSymbolDiscovery.mqh"
#include "Include\\ApexGold\\GoldRiskManager.mqh"
#include "Include\\ApexGold\\GoldStrategyEngine.mqh"

input double InpRiskPerTradePct         = 0.25;  // Demo Starting Risk (% of Equity)
input double InpMaxDailyLossPct         = 1.00;  // Daily Loss Circuit Breaker (%)
input double InpMaxPeakDrawdownPct      = 4.00;  // Peak-to-Trough Drawdown Ceiling (%)
input int    InpMaxSpreadPoints         = 35;    // Max Spread Points Gate (35 pts = $0.35/oz)
input bool   InpUseBreakEven            = true;  // Auto Move to Break-Even
input double InpBreakEvenTriggerR       = 1.00;  // Break-Even Activation (R-Multiple)
input double InpBreakEvenOffsetPips     = 1.50;  // Commission Buffer Offset ($0.15/oz)

// Verifies symbol represents Gold on broker; rejects all non-gold symbols!`,

    'GoldSymbolDiscovery.mqh': `//+------------------------------------------------------------------+
//|                                         GoldSymbolDiscovery.mqh |
//|          Broker Gold Symbol Resolution & Strict Spec Verification|
//+------------------------------------------------------------------+
bool CGoldSymbolDiscovery::VerifyGoldSpecifications(const string sym)
{
   double contractSize = SymbolInfoDouble(sym, SYMBOL_TRADE_CONTRACT_SIZE);
   // Standard gold is 100 troy ounces per lot (or 10 for micro)
   if(contractSize != 100.0 && contractSize != 10.0 && contractSize != 1000.0) {
      PrintFormat("REJECTED: Unexpected contract size %.1f oz for symbol %s", contractSize, sym);
      return false;
   }
   return true;
}`,

    'GoldRiskManager.mqh': `//+------------------------------------------------------------------+
//|                                            GoldRiskManager.mqh  |
//|                      Hard Capital Preservation for XAUUSD        |
//+------------------------------------------------------------------+
// Calculate exact volume down-rounded to lotStep. Never round up!
double rawVolume = maxTradeRiskDollars / riskPerLot;
double steppedVolume = MathFloor(rawVolume / lotStep) * lotStep;

if(steppedVolume < minLot) {
   // Skip trade! Minimum lot monetary risk exceeds dollar budget!
   return "REJECTED: 0.01 lot exceeds dollar risk budget";
}`,

    'GoldStrategyEngine.mqh': `//+------------------------------------------------------------------+
//|                                         GoldStrategyEngine.mqh  |
//|          12 Modular Gold Scalping Strategies (Trend, S/R, FVG)  |
//+------------------------------------------------------------------+
// 1. Trend Pullback 21 EMA
// 2. Asian Range Breakout & Retest
// 3. Round Psychological Number Rejection ($10/$50 levels)
// 4. NY Open Liquidity Expansion
// 5. Liquidity Sweep & Fair Value Gap (FVG)
// 6. Chandelier ATR Volatility Scalp`,

    'Apex_Gold_Conservative.set': `; Apex Gold AI - Conservative Defaults Preset (.set)
InpAppWorkingName=Apex Gold AI
InpMagicNumber=200888
InpOperatingMode=0
InpRiskPerTradePct=0.25
InpMaxDailyLossPct=1.00
InpMaxPeakDrawdownPct=4.00
InpMaxConcurrentGoldTrades=1
InpMaxSpreadPoints=35
InpMaxSpreadToAtrRatio=0.20
InpMaxConsecutiveLosses=3
InpCooldownMinutes=60
InpMinFreeMarginLevel=250.0
InpEquityCompounding=true
InpUseBreakEven=true
InpBreakEvenTriggerR=1.00
InpBreakEvenOffsetPips=1.50
InpUseTrailingStop=true
InpTrailingActivationR=1.40`,

    'market_regime_model.py': `"""
Apex Gold AI - Market Regime Classifier for XAUUSD
Quantitative Drift (Hurst Exponent), Volatility Squeeze & Spread Cost Gating
"""
class MarketRegimeClassifier:
    def classify_regime(self, prices, high, low, spread_points, point_value=0.00001):
        # Flags excessive spread relative to Gold ATR bar
        # Rejects entries if spread-to-ATR cost ratio > 0.20`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileSnippets[selectedFile] || '');
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: One-Click Download */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-800/80 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-900 text-amber-300 border border-amber-700 text-xs font-mono font-bold">
              Gold Specialist v1.00
            </span>
            <span className="text-xs text-slate-400">MetaTrader 5 Build 3800+ Compatible • XAUUSD Only</span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            Download Apex Gold AI Complete Software Suite
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Includes the native MQL5 Expert Advisor source files (`ApexGoldAI.mq5`, `Include/ApexGold/`), preset configurations (`.set`), Python quantitative engine, automated tests, and installation documentation.
          </p>
        </div>

        <a
          href="/api/gold/download-package"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02] flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          Download Gold EA Package (.zip)
        </a>
      </div>

      {/* Grid: Installation Checklist & Source File Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Step-by-Step MT5 & VPS Setup */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-amber-400" />
            MetaTrader 5 & VPS Setup Checklist
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="h-6 w-6 rounded-full bg-amber-950 border border-amber-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 font-mono">
                1
              </span>
              <div>
                <span className="font-bold text-white block">Extract Files into MT5 Data Folder</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  In MT5, click <b>File -&gt; Open Data Folder</b>. Copy <code className="text-amber-300">ApexGoldAI.mq5</code> to <code className="text-amber-300">MQL5/Experts/</code> and the <code className="text-amber-300">Include/ApexGold/</code> folder into <code className="text-amber-300">MQL5/Include/ApexGold/</code>.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="h-6 w-6 rounded-full bg-amber-950 border border-amber-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 font-mono">
                2
              </span>
              <div>
                <span className="font-bold text-white block">Configure Terminal Options (WebRequest & Algo Trading)</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Press <kbd className="px-1 rounded bg-slate-800">Ctrl + O</kbd> -&gt; Expert Advisors tab. Check <b>Allow automated trading</b> and <b>Allow WebRequest</b>. Add <code className="text-amber-300">http://127.0.0.1:3000</code> to the authorized URLs.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="h-6 w-6 rounded-full bg-amber-950 border border-amber-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 font-mono">
                3
              </span>
              <div>
                <span className="font-bold text-white block">Compile Expert Advisor in MetaEditor</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Press <kbd className="px-1 rounded bg-slate-800">F4</kbd> to open MetaEditor. Open <code className="text-amber-300">ApexGoldAI.mq5</code> and click <b>Compile (F7)</b>. Confirm it generates 0 errors and 0 warnings.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="h-6 w-6 rounded-full bg-amber-950 border border-amber-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 font-mono">
                4
              </span>
              <div>
                <span className="font-bold text-white block">Attach Exclusively to Gold Chart (M5 Timeframe)</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Open an M5 chart for <code className="text-amber-300">XAUUSD</code> (or broker Gold symbol). Drag ApexGoldAI from Navigator onto the chart. In Inputs, load <code className="text-amber-300">Apex_Gold_Conservative.set</code>. The EA will discover broker specifications, verify 100 oz contract size, and reject execution on any other symbol.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code & Preset Inspector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
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
                    ? 'bg-amber-500 text-slate-950 font-bold'
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
