import React, { useState } from 'react';
import {
  Smartphone,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Layers,
  ArrowRight,
  Shield,
  Upload,
  Sparkles,
  Camera,
  Maximize2,
  Clock,
  UserCheck,
  Check
} from 'lucide-react';
import {
  GoldOperationalState,
  GoldPositionRecord,
  GoldScreenAgentState,
  GoldTimeframe,
  MobileTab
} from '../types/apex';
import { analyzeMobileScreenVision, executeScreenAction, switchGoldAccount } from '../services/api';

interface PhoneScreenAgentTabProps {
  screenAgent: GoldScreenAgentState;
  operationalState: GoldOperationalState;
  spotPrice: number;
  openPositions: GoldPositionRecord[];
  onRefresh: () => void;
}

export const PhoneScreenAgentTab: React.FC<PhoneScreenAgentTabProps> = ({
  screenAgent,
  operationalState,
  spotPrice,
  openPositions,
  onRefresh,
}) => {
  const [deviceModel, setDeviceModel] = useState<'iOS' | 'Android'>('iOS');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isVisionAnalyzing, setIsVisionAnalyzing] = useState(false);
  const [visionReport, setVisionReport] = useState<any>(null);
  const [userVisionNotes, setUserVisionNotes] = useState('');
  const [showAccountSwitchModal, setShowAccountSwitchModal] = useState(false);
  const [switchSuccessMsg, setSwitchSuccessMsg] = useState('');

  // Handle Tab Switch inside Mobile Mockup
  const handleNavTab = async (tab: MobileTab) => {
    try {
      await executeScreenAction('SWITCH_TAB', { tab });
      onRefresh();
    } catch (err: any) {
      console.warn('Screen action failed:', err.message);
    }
  };

  // Handle Timeframe Switch
  const handleTimeframeChange = async (tf: GoldTimeframe) => {
    try {
      await executeScreenAction('SWITCH_TIMEFRAME', { timeframe: tf });
      onRefresh();
    } catch (err: any) {
      console.warn('Timeframe switch failed:', err.message);
    }
  };

  // Handle Chart Zoom
  const handleZoom = async (level: string) => {
    try {
      await executeScreenAction('ZOOM_CHART', { level });
      onRefresh();
    } catch (err: any) {
      console.warn('Zoom failed:', err.message);
    }
  };

  // Handle Real Screenshot Upload & Vision Analysis
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          setVisionReport(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunVision = async () => {
    if (!uploadedImage) return;
    setIsVisionAnalyzing(true);
    try {
      const report = await analyzeMobileScreenVision(uploadedImage, userVisionNotes);
      setVisionReport(report);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Vision observation failed');
    } finally {
      setIsVisionAnalyzing(false);
    }
  };

  // Handle Safe Account Switching
  const handleExecuteAccountSwitch = async (targetLogin: number) => {
    try {
      const res = await switchGoldAccount(targetLogin);
      setSwitchSuccessMsg(res.message);
      onRefresh();
      setTimeout(() => {
        setSwitchSuccessMsg('');
        setShowAccountSwitchModal(false);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Account switch rejected');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Supervision Notice */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-white flex items-center gap-2">
              Phone Screen-Sharing Agent (XAUUSD Exclusive)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                LIVE LINKED
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Observes Android & iPhone MT5 terminals in real-time. Automated execution is strictly anchored in native MQL5.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Model Selector */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setDeviceModel('iOS')}
              className={`px-3 py-1 rounded transition-all ${
                deviceModel === 'iOS' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              iPhone (iOS)
            </button>
            <button
              onClick={() => setDeviceModel('Android')}
              className={`px-3 py-1 rounded transition-all ${
                deviceModel === 'Android' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Android
            </button>
          </div>

          <button
            onClick={() => setShowAccountSwitchModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-all border border-slate-700"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            Switch Account
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Mobile MT5 Viewport on Left, AI Observe-Interpret-Act-Verify Loop on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Interactive Mobile Phone Screen Device Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-slate-950 border-4 border-slate-800 rounded-[36px] shadow-2xl overflow-hidden p-2.5 relative ring-1 ring-amber-500/20">
            {/* Phone Speaker & Camera Notch */}
            <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
              <div className="w-8 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Mobile MT5 Top Bar */}
            <div className="bg-slate-900/90 rounded-t-xl px-3 py-2 flex items-center justify-between text-[11px] font-mono border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-amber-400">XAUUSD</span>
                <span className="text-slate-400 text-[10px] font-bold px-1 rounded bg-slate-800">
                  {screenAgent.selectedTimeframe}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-white text-xs">${spotPrice.toFixed(2)}</span>
                <span className="text-emerald-400 text-[9px] block">+0.22 spread</span>
              </div>
            </div>

            {/* Timeframe Bar (M1, M5, M15, H1) */}
            <div className="bg-slate-950 px-2 py-1.5 flex items-center justify-between border-b border-slate-800/80 text-[10px] font-mono">
              <span className="text-slate-500 text-[9px]">TIMEFRAME:</span>
              <div className="flex gap-1">
                {(['M1', 'M5', 'M15', 'H1'] as GoldTimeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => handleTimeframeChange(tf)}
                    className={`px-2 py-0.5 rounded transition-all ${
                      screenAgent.selectedTimeframe === tf
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Screen Main Canvas based on Active Tab */}
            <div className="bg-slate-950 h-[360px] overflow-y-auto p-2 font-mono text-xs flex flex-col justify-between">
              {screenAgent.activeTab === 'CHART' && (
                <div className="h-full flex flex-col justify-between">
                  {/* Candlestick & Moving Average Canvas Representation */}
                  <div className="relative flex-1 bg-slate-900/60 rounded-lg p-2 border border-slate-800/80 overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Apex ECN • 84920194</span>
                      <span className="text-cyan-400">EMA 21/50 Stack</span>
                    </div>

                    {/* SVG Gold Candlestick Graphic */}
                    <svg viewBox="0 0 280 180" className="w-full h-36 my-auto">
                      {/* Grid Lines */}
                      <line x1="0" y1="45" x2="280" y2="45" stroke="#1e293b" strokeDasharray="3" />
                      <line x1="0" y1="90" x2="280" y2="90" stroke="#1e293b" strokeDasharray="3" />
                      <line x1="0" y1="135" x2="280" y2="135" stroke="#1e293b" strokeDasharray="3" />
                      {/* 21 EMA Ascending Support */}
                      <path d="M 10 135 Q 100 115 180 85 T 270 55" fill="none" stroke="#f59e0b" strokeWidth="2" />
                      {/* 50 EMA */}
                      <path d="M 10 150 Q 100 130 180 105 T 270 75" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                      {/* Candlesticks */}
                      {/* Bar 1 */}
                      <rect x="50" y="105" width="8" height="25" fill="#10b981" />
                      <line x1="54" y1="95" x2="54" y2="135" stroke="#10b981" />
                      {/* Bar 2 */}
                      <rect x="90" y="90" width="8" height="20" fill="#10b981" />
                      <line x1="94" y1="80" x2="94" y2="115" stroke="#10b981" />
                      {/* Bar 3 (Red Pullback) */}
                      <rect x="130" y="85" width="8" height="15" fill="#f43f5e" />
                      <line x1="134" y1="75" x2="134" y2="105" stroke="#f43f5e" />
                      {/* Bar 4 (Hammer bounce on 21 EMA) */}
                      <rect x="170" y="80" width="8" height="12" fill="#10b981" />
                      <line x1="174" y1="75" x2="174" y2="110" stroke="#10b981" strokeWidth="1.5" />
                      {/* Bar 5 (Live Expanding Candle) */}
                      <rect x="210" y="60" width="8" height="25" fill="#10b981" />
                      <line x1="214" y1="50" x2="214" y2="90" stroke="#10b981" />
                    </svg>

                    <div className="flex justify-between items-center text-[10px] text-amber-400 font-bold bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                      <span>Gold Spot: $2,727.35</span>
                      <span className="text-emerald-400">H1 Bull Trend</span>
                    </div>
                  </div>

                  {/* Quick Zoom Bar */}
                  <div className="flex justify-between items-center pt-2 text-[10px]">
                    <span className="text-slate-500">ZOOM:</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleZoom('IN')} className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300">+</button>
                      <button onClick={() => handleZoom('OUT')} className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300">-</button>
                      <button onClick={() => handleZoom('LATEST')} className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400">Latest Bar</button>
                    </div>
                  </div>
                </div>
              )}

              {screenAgent.activeTab === 'QUOTES' && (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
                    <span>SYMBOL</span>
                    <span>BID / ASK (SPREAD)</span>
                  </div>
                  <div className="p-2 rounded bg-amber-950/30 border border-amber-800/60 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-amber-300 block text-xs">XAUUSD</span>
                      <span className="text-[9px] text-slate-400">Spot Gold vs US Dollar</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white">$2727.20 / $2727.50</span>
                      <span className="text-[10px] text-emerald-400 block">22 pts ($0.22)</span>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-500 italic text-center">
                    All non-gold instruments are filtered and blocked by Exclusive Gold Mode.
                  </div>
                </div>
              )}

              {screenAgent.activeTab === 'TRADE' && (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
                    <span>OPEN POSITIONS</span>
                    <span>FLOATING PnL</span>
                  </div>
                  {openPositions.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-[11px]">
                      No active gold positions. Agent on standby.
                    </div>
                  ) : (
                    openPositions.map((p) => (
                      <div key={p.ticket} className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-400 font-bold">{p.type} {p.symbol} {p.volume}</span>
                          <span className="text-emerald-400 font-bold">+${p.unrealizedPnL.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>Open: ${p.openPrice.toFixed(2)}</span>
                          <span>Now: ${p.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-amber-400 flex justify-between">
                          <span>SL: ${p.stopLoss.toFixed(2)}</span>
                          <span className="text-cyan-400">TP: ${p.takeProfit.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {screenAgent.activeTab === 'HISTORY' && (
                <div className="space-y-2 text-[10px]">
                  <div className="text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
                    <span>CLOSED DEALS (GOLD)</span>
                    <span>NET PnL</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <div>
                      <span className="font-bold text-emerald-400">BUY XAUUSD 0.12</span>
                      <span className="text-slate-500 block text-[9px]">TP Hit @ $2,722.80</span>
                    </div>
                    <span className="text-emerald-400 font-bold">+$55.20</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <div>
                      <span className="font-bold text-rose-400">SELL XAUUSD 0.14</span>
                      <span className="text-slate-500 block text-[9px]">TP Hit @ $2,721.40</span>
                    </div>
                    <span className="text-emerald-400 font-bold">+$50.40</span>
                  </div>
                </div>
              )}

              {screenAgent.activeTab === 'SETTINGS' && (
                <div className="space-y-2 text-[10px]">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 block font-sans">CONNECTED ACCOUNT</span>
                    <span className="font-bold text-white text-xs block">#84920194 (Apex Demo)</span>
                    <span className="text-slate-500 block">Server: ApexMarkets-Demo01</span>
                    <span className="text-emerald-400 block font-bold">Gold Mapping: XAUUSD (Verified)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile MT5 Bottom Navigation Bar */}
            <div className="bg-slate-900 rounded-b-xl px-1 py-1.5 grid grid-cols-5 gap-0.5 border-t border-slate-800 text-center text-[9px] font-sans">
              {(['QUOTES', 'CHART', 'TRADE', 'HISTORY', 'SETTINGS'] as MobileTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleNavTab(tab)}
                  className={`py-1 rounded font-semibold transition-all ${
                    screenAgent.activeTab === tab
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Home Indicator Pill */}
            <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
          </div>
        </div>

        {/* Right Column (7 Cols): Autonomous Observe-Interpret-Act-Verify Loop & Vision OCR */}
        <div className="lg:col-span-7 space-y-5">
          {/* Loop Card: Observe - Interpret - Act - Verify */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                Human-Like Observe–Interpret–Act–Verify Loop
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {screenAgent.lastVerifiedTimestamp}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* 1. Observe */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold text-[11px] block flex items-center gap-1.5 font-mono">
                  <span>1. OBSERVE (MT5 SCREEN)</span>
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {screenAgent.lastObservedAction}
                </p>
              </div>

              {/* 2. Interpret */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-bold text-[11px] block flex items-center gap-1.5 font-mono">
                  <span>2. INTERPRET (GOLD REGIME)</span>
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Price is consolidating above $2,724 demand shelf. M5 and H1 EMAs maintain bullish slope. Spread is low at 22 points ($0.22/oz).
                </p>
              </div>

              {/* 3. Act */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-indigo-400 font-bold text-[11px] block flex items-center gap-1.5 font-mono">
                  <span>3. PROPOSED ACTION</span>
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {screenAgent.proposedAction}
                </p>
              </div>

              {/* 4. Verify */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold text-[11px] block flex items-center gap-1.5 font-mono">
                  <span>4. RESULT VERIFIED</span>
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {screenAgent.verificationStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Real Phone Screenshot Vision Upload & Verification Section */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Inspect Real MT5 Mobile Screen (Gemini Vision)</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">iPhone or Android Upload</span>
            </div>

            <p className="text-xs text-slate-300">
              Share a screenshot of your MT5 mobile app while running on your phone. The agent confirms the selected gold symbol, audits visible SL/TP levels, and detects account or broker warnings.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1 border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-xl p-3 text-center cursor-pointer transition-all bg-slate-950/50 flex items-center justify-center min-h-[90px]">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                {uploadedImage ? (
                  <div className="flex items-center gap-3">
                    <img src={uploadedImage} alt="Uploaded Phone Screen" className="h-16 w-auto rounded border border-slate-700" />
                    <span className="text-xs text-emerald-400 font-medium">Screenshot Loaded. Ready to Inspect.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Click to upload MT5 screenshot from your phone</span>
                  </div>
                )}
              </label>

              <button
                onClick={handleRunVision}
                disabled={!uploadedImage || isVisionAnalyzing}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all flex-shrink-0 ${
                  !uploadedImage || isVisionAnalyzing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {isVisionAnalyzing ? 'Inspecting...' : 'Analyze Phone Screen'}
              </button>
            </div>

            {/* Vision Report if Available */}
            {visionReport && (
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>{visionReport.deviceRecognized} • Tab: {visionReport.activeTab}</span>
                  <span className="text-emerald-400">Symbol: {visionReport.detectedSymbol} ({visionReport.detectedTimeframe})</span>
                </div>
                <p className="text-slate-200 text-xs font-sans leading-relaxed">
                  {visionReport.plainLanguageMarketExplanation}
                </p>
                <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-1.5 flex justify-between">
                  <span>Audit: {visionReport.discrepanciesOrWarnings}</span>
                  <span className="text-cyan-400">Next: {visionReport.proposedNextAction}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Switching Modal (Section 9 Compliance) */}
      {showAccountSwitchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Safe MT5 Account Switching</h3>
                <p className="text-xs text-slate-400">Recheck permissions, equity, and Gold symbol mapping</p>
              </div>
            </div>

            {openPositions.length > 0 ? (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Open Gold Position Detected</span>
                </div>
                <p>
                  You cannot switch trading accounts while {openPositions.length} active position is open. Please close or protect the trade first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold block text-sm">#84920194 (Apex Demo)</span>
                    <span className="text-slate-400 text-[11px]">ApexMarkets-Demo01 • $10,412.80</span>
                    <span className="text-emerald-400 text-[10px] block">Symbol: XAUUSD</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                    Active
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold block text-sm">#61094821 (Apex Live Raw)</span>
                    <span className="text-slate-400 text-[11px]">ApexMarkets-Live01 • $25,400.00</span>
                    <span className="text-amber-400 text-[10px] block">Symbol: XAUUSD.raw</span>
                  </div>
                  <button
                    onClick={() => handleExecuteAccountSwitch(61094821)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Switch & Map
                  </button>
                </div>
              </div>
            )}

            {switchSuccessMsg && (
              <div className="p-2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono">
                {switchSuccessMsg}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAccountSwitchModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
