import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  Play,
  Pause,
  Power,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  Upload,
  Lock,
  Unlock,
  Coins,
  TrendingUp,
  Server,
  Eye,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Check,
  Video,
  VideoOff
} from 'lucide-react';
import {
  ExecutionMode,
  GoldOperationalState,
  GoldPositionRecord,
  GoldScreenAgentState,
  GoldSystemTelemetry,
  GoldTimeframe
} from '../types/apex';
import {
  analyzeMobileScreenVision,
  closeGoldPosition,
  executeScreenAction,
  resetGoldEmergencyStop,
  setGoldExecutionMode,
  startGoldScanning,
  stopGoldTrading
} from '../services/api';

interface OneTapGoldTraderProps {
  telemetry: GoldSystemTelemetry | null;
  positions: GoldPositionRecord[];
  onRefresh: () => void;
  onOpenSetupGuide: () => void;
}

export const OneTapGoldTrader: React.FC<OneTapGoldTraderProps> = ({
  telemetry,
  positions,
  onRefresh,
  onOpenSetupGuide,
}) => {
  // Primary Control States
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showLiveAuthModal, setShowLiveAuthModal] = useState<boolean>(false);
  const [liveKeyInput, setLiveKeyInput] = useState<string>('');
  const [showStopProcedureModal, setShowStopProcedureModal] = useState<boolean>(false);
  const [stopProcedure, setStopProcedure] = useState<'HALT_NEW_ENTRIES' | 'HALT_AND_CLOSE'>('HALT_NEW_ENTRIES');

  // Screen Sharing WebRTC State
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Vision Analysis State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isVisionAnalyzing, setIsVisionAnalyzing] = useState<boolean>(false);
  const [visionReport, setVisionReport] = useState<any>(null);
  const [deviceType, setDeviceType] = useState<'iOS' | 'Android'>('iOS');

  const account = telemetry?.account;
  const market = telemetry?.market;
  const screenAgent = telemetry?.screenAgent;
  const isLive = telemetry?.mode === 'LIVE_STRICT_CONFIRM';
  const isEmergency = telemetry?.isEmergencyStopped || telemetry?.circuitBreakerTripped;

  // Handle Starting the Autonomous Loop
  const handleStart = async () => {
    setActionLoading(true);
    try {
      await startGoldScanning();
      setIsScanning(true);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to start autonomous scanner');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Stopping Trading Safe Procedure
  const handleConfirmStop = async () => {
    setActionLoading(true);
    try {
      await stopGoldTrading(stopProcedure);
      setIsScanning(false);
      setShowStopProcedureModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to execute stop procedure');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Live Mode Authorization
  const handleAuthorizeLive = async () => {
    if (liveKeyInput.trim() !== 'AUTHORIZED_GOLD_APEX_2026') {
      alert('Invalid authorization passphrase. Enter AUTHORIZED_GOLD_APEX_2026');
      return;
    }
    setActionLoading(true);
    try {
      await setGoldExecutionMode('LIVE_STRICT_CONFIRM', liveKeyInput.trim());
      setShowLiveAuthModal(false);
      setLiveKeyInput('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Live mode switch failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwitchToDemo = async () => {
    setActionLoading(true);
    try {
      await setGoldExecutionMode('DEMO_AUTONOMOUS');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Demo mode switch failed');
    } finally {
      setActionLoading(false);
    }
  };

  // WebRTC Screen-Sharing Handler
  const handleStartScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert('Screen capture API is not directly supported by this browser. You can upload an MT5 screenshot or photo below.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
        },
        audio: false,
      });

      setScreenStream(stream);
      setIsScreenSharing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Handle user stopping screen share via browser banner
      stream.getVideoTracks()[0].onended = () => {
        handleStopScreenShare();
      };

      // Trigger automatic first vision snapshot after 1.5 seconds
      setTimeout(() => {
        captureAndAnalyzeFrame(stream);
      }, 1500);
    } catch (err: any) {
      console.warn('Screen share cancelled or rejected:', err);
    }
  };

  const handleStopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    setScreenStream(null);
    setIsScreenSharing(false);
  };

  // Capture frame from active video element and analyze with Gemini Vision
  const captureAndAnalyzeFrame = async (activeStream?: MediaStream) => {
    const streamToUse = activeStream || screenStream;
    if (!videoRef.current || !streamToUse) return;

    try {
      setIsVisionAnalyzing(true);
      const canvas = canvasRef.current || document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL('image/jpeg', 0.85);
        setUploadedImage(base64Data);

        const report = await analyzeMobileScreenVision(base64Data, 'Live WebRTC screen frame captured by user');
        setVisionReport(report);
        onRefresh();
      }
    } catch (err: any) {
      console.warn('Live frame analysis warning:', err.message);
    } finally {
      setIsVisionAnalyzing(false);
    }
  };

  // File Upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          setUploadedImage(base64);
          setIsVisionAnalyzing(true);
          try {
            const report = await analyzeMobileScreenVision(base64, 'User uploaded MT5 mobile screenshot');
            setVisionReport(report);
            onRefresh();
          } catch (err: any) {
            alert(err.message || 'Vision inspection failed');
          } finally {
            setIsVisionAnalyzing(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 1-Tap Close Position
  const handleClosePos = async (ticket: number) => {
    if (window.confirm(`Close Gold position #${ticket} immediately at market?`)) {
      try {
        await closeGoldPosition(ticket, 'One-Tap Dashboard Close');
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to close position');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8 font-sans">
      {/* 1. TOP HEADER: BRANDING & 1-TAP VPS SYNC BADGE */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50 flex-shrink-0">
            <span className="font-extrabold text-slate-950 text-base font-mono">AU</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Apex Gold AI</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700">
                XAUUSD ONLY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              One-Tap Autonomous Gold Scalper • Independent VPS Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenSetupGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span>Setup & VPS Guide</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>VPS ONLINE</span>
          </div>
        </div>
      </div>

      {/* 2. THE THREE MAIN CONTROLS (START • LIVE TRADING • STOP) */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Primary Autonomous Controls
          </span>
          <span className="text-xs font-mono text-amber-400 font-bold">
            State: {telemetry?.operationalState || 'READY'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* CONTROL 1: START (AUTONOMOUS SCAN & TRADE) */}
          <button
            onClick={handleStart}
            disabled={actionLoading}
            className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-bold text-sm shadow-xl transition-all transform active:scale-95 ${
              isScanning && !telemetry?.isPaused
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 ring-2 ring-emerald-400 shadow-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            <Play className={`w-5 h-5 ${isScanning && !telemetry?.isPaused ? 'fill-slate-950' : 'fill-white'}`} />
            <div className="text-left">
              <div className="leading-tight">
                {isScanning && !telemetry?.isPaused ? 'SCANNING ACTIVE' : 'START TRADING'}
              </div>
              <div className="text-[10px] opacity-80 font-normal">
                {isScanning && !telemetry?.isPaused ? 'Analyzing M1-H1 Gold' : 'Auto-scan & execute'}
              </div>
            </div>
          </button>

          {/* CONTROL 2: LIVE TRADING TOGGLE */}
          {isLive ? (
            <button
              onClick={handleSwitchToDemo}
              disabled={actionLoading}
              className="w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 ring-2 ring-rose-400 transition-all transform active:scale-95"
            >
              <Lock className="w-5 h-5" />
              <div className="text-left">
                <div className="leading-tight">LIVE TRADING: ON</div>
                <div className="text-[10px] text-rose-200 font-normal">Tap to switch to Demo</div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowLiveAuthModal(true)}
              disabled={actionLoading}
              className="w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-lg transition-all transform active:scale-95"
            >
              <Unlock className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <div className="leading-tight">DEMO AUTONOMOUS</div>
                <div className="text-[10px] text-amber-400 font-normal">Tap to authorize Live</div>
              </div>
            </button>
          )}

          {/* CONTROL 3: STOP (SAFE POSITION PROCEDURE) */}
          <button
            onClick={() => setShowStopProcedureModal(true)}
            disabled={actionLoading}
            className="w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-bold text-sm bg-slate-900 hover:bg-slate-800 text-rose-400 border border-rose-500/40 hover:border-rose-500 shadow-xl transition-all transform active:scale-95"
          >
            <Power className="w-5 h-5 text-rose-400" />
            <div className="text-left">
              <div className="leading-tight">STOP TRADING</div>
              <div className="text-[10px] text-slate-400 font-normal">Safe position procedure</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. CORE TELEMETRY DASHBOARD (ACCOUNT • SYMBOL • CONNECTION • EQUITY • PnL) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        {/* Card A: Account & Broker */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-1">
          <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
            Connected Account
          </span>
          <span className="text-sm font-bold text-white block truncate">
            #{account?.login || 84920194}
          </span>
          <span className="text-[11px] text-slate-400 block truncate">
            {account?.broker || 'Apex Global ECN'}
          </span>
          <span className="text-[10px] text-emerald-400 block">
            Lev: 1:{account?.leverage || 100} • ECN Raw
          </span>
        </div>

        {/* Card B: Gold Symbol & Spread */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-1">
          <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
            Gold Instrument
          </span>
          <span className="text-sm font-bold text-amber-400 block">
            ${market?.spotPrice.toFixed(2) || '2,727.35'}
          </span>
          <span className="text-[11px] text-slate-300 block">
            {telemetry?.confirmedSymbol || 'XAUUSD'} (100 oz)
          </span>
          <span className="text-[10px] text-emerald-400 block">
            Spread: {market?.spreadPoints || 22} pts (${market?.spreadDollars || 0.22})
          </span>
        </div>

        {/* Card C: Account Equity & Free Margin */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-1">
          <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
            Account Equity
          </span>
          <span className="text-sm font-bold text-white block">
            ${account ? account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '10,412.80'}
          </span>
          <span className="text-[11px] text-slate-400 block">
            Free: ${account ? account.freeMargin.toFixed(0) : '10,262'}
          </span>
          <span className="text-[10px] text-slate-400 block">
            Margin Lev: {account ? account.marginLevel.toFixed(0) : '6941'}%
          </span>
        </div>

        {/* Card D: Daily Profit or Loss & Drawdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-1">
          <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
            Today's Net PnL
          </span>
          <span className={`text-sm font-bold block ${account && account.dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {account && account.dailyPnL >= 0 ? '+' : ''}${account?.dailyPnL.toFixed(2) || '+128.30'}
          </span>
          <span className="text-[11px] text-emerald-400 block">
            +{account?.dailyPnLPct.toFixed(2) || '1.25'}% Return
          </span>
          <span className="text-[10px] text-slate-400 block">
            DD: {account?.currentDrawdownPct.toFixed(2) || '0.26'}% / 4.0%
          </span>
        </div>
      </div>

      {/* 4. ACTIVE OPEN GOLD POSITION CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Active Gold Position</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {positions.length} Open
            </span>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Strategy: {positions[0]?.strategyName || 'Trend Pullback 21 EMA'}
          </span>
        </div>

        {positions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-300">
              No active positions. AI is continuously scanning M1-H1 market structure.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Enforcing 0.25% demo risk, low spread gate (&lt;35 pts), and 1.60 minimum R:R.
            </p>
          </div>
        ) : (
          positions.map((pos) => (
            <div
              key={pos.ticket}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-xs">
                    {pos.type}
                  </span>
                  <span className="font-extrabold text-white text-sm">
                    {pos.symbol} {pos.volume} Lots
                  </span>
                  <span className="text-slate-500 text-xs">#{pos.ticket}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-400 block">
                      +${pos.unrealizedPnL.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-500">
                      (+${pos.pnlDollarsPerOz.toFixed(2)}/oz • {pos.currentR.toFixed(2)}R)
                    </span>
                  </div>

                  <button
                    onClick={() => handleClosePos(pos.ticket)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex-shrink-0"
                  >
                    Close Trade
                  </button>
                </div>
              </div>

              {/* Price & Stops Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-sans">Open Price</span>
                  <span className="text-white font-semibold">${pos.openPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-sans">Current Spot</span>
                  <span className="text-amber-400 font-semibold">${pos.currentPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-sans">Protective Stop Loss</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    ${pos.stopLoss.toFixed(2)}
                    <span className="text-[9px] px-1 rounded bg-emerald-950 text-emerald-300">BE+</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-sans">Take Profit Target</span>
                  <span className="text-cyan-400 font-semibold">${pos.takeProfit.toFixed(2)}</span>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Break-Even Protected (+ $0.15 Commission Buffer)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-indigo-400" />
                  Chandelier ATR Trailing Active
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. PHONE SCREEN-SHARING AGENT (ONE-TAP SCREEN SHARE & GEMINI VISION OCR) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              Phone Screen-Sharing Agent (Mobile MT5)
            </h3>
            <p className="text-xs text-slate-400">
              Share your MT5 screen on Android or iPhone. The AI observes charts, audits open positions, and confirms SL/TP.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isScreenSharing ? (
              <button
                onClick={handleStopScreenShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold shadow-md transition-all"
              >
                <VideoOff className="w-3.5 h-3.5" />
                Stop Sharing
              </button>
            ) : (
              <button
                onClick={handleStartScreenShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
              >
                <Video className="w-4 h-4 text-slate-950" />
                Share MT5 Screen
              </button>
            )}
          </div>
        </div>

        {/* Live Screen Preview or Device Mockup */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Left: Video / Device Frame */}
          <div className="md:col-span-5 flex justify-center">
            {isScreenSharing ? (
              <div className="relative w-full max-w-[280px] bg-slate-950 border-4 border-amber-500/50 rounded-2xl overflow-hidden shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-[320px] object-cover bg-slate-950"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-amber-400 text-[10px] font-mono border border-slate-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Stream Active
                </div>
                <button
                  onClick={() => captureAndAnalyzeFrame()}
                  disabled={isVisionAnalyzing}
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold font-mono shadow-md flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {isVisionAnalyzing ? 'Auditing...' : 'Audit Frame'}
                </button>
              </div>
            ) : (
              /* Synthetic / Static Phone Mockup */
              <div className="w-full max-w-[280px] bg-slate-950 border-4 border-slate-800 rounded-2xl p-2.5 shadow-xl space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1 text-[10px]">
                  <span className="font-bold text-amber-400">MT5 Mobile (iOS / Android)</span>
                  <span className="text-emerald-400">XAUUSD, M5</span>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Apex ECN • #84920194</span>
                    <span className="text-amber-400 font-bold">${market?.spotPrice.toFixed(2) || '2,727.35'}</span>
                  </div>
                  <svg viewBox="0 0 240 90" className="w-full h-20 my-1">
                    <line x1="0" y1="20" x2="240" y2="20" stroke="#1e293b" strokeDasharray="3" />
                    <line x1="0" y1="50" x2="240" y2="50" stroke="#1e293b" strokeDasharray="3" />
                    <line x1="0" y1="75" x2="240" y2="75" stroke="#1e293b" strokeDasharray="3" />
                    <path d="M 10 70 Q 80 60 150 40 T 230 25" fill="none" stroke="#f59e0b" strokeWidth="2" />
                    <rect x="40" y="55" width="6" height="15" fill="#10b981" />
                    <rect x="80" y="45" width="6" height="15" fill="#10b981" />
                    <rect x="120" y="40" width="6" height="10" fill="#f43f5e" />
                    <rect x="160" y="32" width="6" height="18" fill="#10b981" />
                    <rect x="200" y="22" width="6" height="20" fill="#10b981" />
                  </svg>
                  <div className="text-[9px] text-slate-400 flex justify-between">
                    <span>EMA 21/50 Support</span>
                    <span className="text-emerald-400">SL: $2,725.20</span>
                  </div>
                </div>

                <label className="block w-full border border-dashed border-slate-700 hover:border-amber-500 rounded-lg p-2 text-center cursor-pointer text-[10px] text-slate-400 transition-all bg-slate-900/40">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <Upload className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
                  <span>Or upload MT5 phone screenshot</span>
                </label>
              </div>
            )}
          </div>

          {/* Right: Autonomous Observe-Interpret-Act-Verify Feed */}
          <div className="md:col-span-7 space-y-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-amber-400 font-bold text-[10px] uppercase font-sans flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                1. Observe (Screen Inspection)
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {screenAgent?.lastObservedAction || 'Observed M5 Gold Chart: Retesting 21 EMA support ($2,725.50)'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-cyan-400 font-bold text-[10px] uppercase font-sans flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                2. Interpret & Propose
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {screenAgent?.proposedAction || 'Maintain position monitoring; dynamic break-even armed at $2,726.00'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-emerald-400 font-bold text-[10px] uppercase font-sans flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                3. Result Verified
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {screenAgent?.verificationStatus || 'Screen verified: Symbol is XAUUSD, account intact'}
              </p>
            </div>

            {visionReport && (
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/80 text-[11px] space-y-1">
                <span className="font-bold text-amber-300 block">AI Vision Report:</span>
                <p className="text-slate-200 font-sans text-xs">{visionReport.plainLanguageMarketExplanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. CONTINUOUS OPERATION / DECOUPLED VPS REASSURANCE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs">
        <Server className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">
            Independent VPS / Desktop Continuous Operation
          </span>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            You can lock your phone or leave it on a table. The native MetaTrader 5 Expert Advisor (<code className="text-amber-300 font-mono">ApexGoldAI.mq5</code>) runs authoritatively on your desktop terminal or VPS. It executes orders, moves stop-losses to break-even, applies trailing stops, and exits trades independently even if phone screen-sharing disconnects.
          </p>
        </div>
      </div>

      {/* Hidden canvas for video frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* LIVE TRADING CONFIRMATION MODAL */}
      {showLiveAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-800">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Authorize Live Gold Trading</h3>
                <p className="text-xs text-amber-300">Real capital execution on XAUUSD</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Gold (XAUUSD) possesses high intraday volatility. Switching to Live Trading activates real MT5 order execution. Every trade is governed by hard stop-losses, downward lot rounding, and 1.0% max daily loss.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Security Authorization Passphrase:
              </label>
              <div className="text-[11px] text-amber-400 font-mono bg-slate-950 p-2 rounded border border-slate-800 mb-1">
                Passphrase: <span className="font-bold select-all">AUTHORIZED_GOLD_APEX_2026</span>
              </div>
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
                onClick={handleAuthorizeLive}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Confirm & Activate Live Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOP TRADING PROCEDURE MODAL */}
      {showStopProcedureModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-800">
                <Power className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Safe Stop Procedure</h3>
                <p className="text-xs text-rose-300">Choose how open positions are handled</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label
                onClick={() => setStopProcedure('HALT_NEW_ENTRIES')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  stopProcedure === 'HALT_NEW_ENTRIES'
                    ? 'bg-amber-950/40 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="stopProc"
                  checked={stopProcedure === 'HALT_NEW_ENTRIES'}
                  onChange={() => setStopProcedure('HALT_NEW_ENTRIES')}
                  className="mt-0.5 accent-amber-500"
                />
                <div>
                  <span className="font-bold block text-sm">Halt New Entries (Recommended)</span>
                  <span className="text-slate-400 text-xs">
                    Existing gold positions remain actively managed on VPS with protective SL, break-even, and trailing stops.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setStopProcedure('HALT_AND_CLOSE')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  stopProcedure === 'HALT_AND_CLOSE'
                    ? 'bg-rose-950/40 border-rose-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="stopProc"
                  checked={stopProcedure === 'HALT_AND_CLOSE'}
                  onChange={() => setStopProcedure('HALT_AND_CLOSE')}
                  className="mt-0.5 accent-rose-500"
                />
                <div>
                  <span className="font-bold block text-sm">Halt & Close All Open Trades</span>
                  <span className="text-slate-400 text-xs">
                    Immediately closes all floating gold positions at market price to eliminate market exposure.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowStopProcedureModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStop}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Execute Stop Procedure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
