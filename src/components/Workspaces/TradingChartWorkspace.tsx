import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Info,
  DollarSign,
  Maximize2,
  Zap,
  Sliders,
  Crosshair,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { TradingChartAnalysis } from '../../types/deskpilot';
import { analyzeTradingChart } from '../../services/api';

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isUp: boolean;
  orderBlock?: 'bullish' | 'bearish';
  fvg?: 'bullish' | 'bearish';
  structure?: 'BOS' | 'CHoCH';
}

const ASSET_REGISTRY = [
  { ticker: 'BTC/USDT', name: 'Bitcoin / Tether', basePrice: 68450.0, category: 'Crypto', tickDecimals: 1 },
  { ticker: 'ETH/USD', name: 'Ethereum / Dollar', basePrice: 3540.0, category: 'Crypto', tickDecimals: 2 },
  { ticker: 'SOL/USD', name: 'Solana / Dollar', basePrice: 178.5, category: 'Crypto', tickDecimals: 2 },
  { ticker: 'EUR/USD', name: 'Euro / US Dollar', basePrice: 1.0845, category: 'Forex', tickDecimals: 4 },
  { ticker: 'GBP/USD', name: 'British Pound / Dollar', basePrice: 1.2980, category: 'Forex', tickDecimals: 4 },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', basePrice: 138.8, category: 'Equities', tickDecimals: 2 },
  { ticker: 'AAPL', name: 'Apple Inc.', basePrice: 228.5, category: 'Equities', tickDecimals: 2 },
  { ticker: 'SPY', name: 'S&P 500 ETF Trust', basePrice: 576.2, category: 'Equities', tickDecimals: 2 },
  { ticker: 'TSLA', name: 'Tesla Inc.', basePrice: 218.4, category: 'Equities', tickDecimals: 2 },
];

export const TradingChartWorkspace: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('4H');
  const [analysis, setAnalysis] = useState<TradingChartAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real-Time Live Ticking Simulator State
  const [isLiveTicking, setIsLiveTicking] = useState(true);
  const [livePrice, setLivePrice] = useState(68450.0);
  const [priceChangeDir, setPriceChangeDir] = useState<'up' | 'down' | 'neutral'>('neutral');

  // Indicator Overlay Toggles
  const [showEMA, setShowEMA] = useState(true);
  const [showSMC, setShowSMC] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // Position Sizing Calculator
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [customStopLoss, setCustomStopLoss] = useState<number | null>(null);
  const [customTakeProfit, setCustomTakeProfit] = useState<number | null>(null);

  const activeAssetObj = ASSET_REGISTRY.find((a) => a.ticker === selectedAsset) || ASSET_REGISTRY[0];

  // Initialize live price when asset changes
  useEffect(() => {
    setLivePrice(activeAssetObj.basePrice);
    setCustomStopLoss(null);
    setCustomTakeProfit(null);
  }, [selectedAsset]);

  // Generate realistic OHLCV Candlestick dataset based on selected asset and timeframe
  const candles: Candle[] = useMemo(() => {
    const list: Candle[] = [];
    const count = 30;
    let curr = activeAssetObj.basePrice * 0.94;
    const volatility = activeAssetObj.basePrice * (timeframe === '1m' ? 0.001 : timeframe === '15m' ? 0.003 : 0.008);

    for (let i = 0; i < count; i++) {
      const delta = (Math.sin(i * 0.5) + (Math.random() - 0.48)) * volatility;
      const open = curr;
      const close = i === count - 1 ? livePrice : curr + delta;
      const high = Math.max(open, close) + Math.random() * volatility * 0.7;
      const low = Math.min(open, close) - Math.random() * volatility * 0.7;
      const volume = Math.floor(1000 + Math.random() * 5000 * (i % 5 === 0 ? 2.5 : 1));
      const isUp = close >= open;

      let orderBlock: 'bullish' | 'bearish' | undefined;
      let fvg: 'bullish' | 'bearish' | undefined;
      let structure: 'BOS' | 'CHoCH' | undefined;

      if (i === 7) orderBlock = 'bullish';
      if (i === 19) orderBlock = 'bearish';
      if (i === 14) fvg = 'bullish';
      if (i === 22) fvg = 'bearish';
      if (i === 12) structure = 'CHoCH';
      if (i === 24) structure = 'BOS';

      list.push({
        time: `${i + 1}`,
        open,
        high,
        low,
        close,
        volume,
        isUp,
        orderBlock,
        fvg,
        structure,
      });
      curr = close;
    }
    return list;
  }, [activeAssetObj.basePrice, timeframe, livePrice]);

  // Live Tick Simulator Loop
  useEffect(() => {
    if (!isLiveTicking) return;
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.49) * (activeAssetObj.basePrice * 0.0006);
      setLivePrice((prev) => {
        const next = Math.max(0.0001, prev + delta);
        setPriceChangeDir(delta >= 0 ? 'up' : 'down');
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isLiveTicking, activeAssetObj.basePrice]);

  // Fetch AI Structure & Educational Setup Analysis
  const fetchAnalysis = async (ticker: string, tf: string) => {
    setIsLoading(true);
    try {
      const res = await analyzeTradingChart({
        sampleAsset: ticker,
        timeframe: tf,
        currentPrice: livePrice,
      });
      setAnalysis(res);
      if (res.potential_setup) {
        setCustomStopLoss(res.potential_setup.invalidation_level);
        setCustomTakeProfit(res.potential_setup.target_levels?.[0] || null);
      }
    } catch (err: any) {
      console.error('Failed to analyze trading chart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(selectedAsset, timeframe);
  }, [selectedAsset, timeframe]);

  // Min and Max prices for chart scaling
  const minPrice = useMemo(() => Math.min(...candles.map((c) => c.low)) * 0.998, [candles]);
  const maxPrice = useMemo(() => Math.max(...candles.map((c) => c.high)) * 1.002, [candles]);
  const priceRange = maxPrice - minPrice || 1;

  const getYCoord = (price: number, height = 240) => {
    return height - ((price - minPrice) / priceRange) * height;
  };

  // Position Sizing calculations
  const stopLossPrice = customStopLoss ?? (analysis?.potential_setup?.invalidation_level || livePrice * 0.97);
  const takeProfitPrice = customTakeProfit ?? (analysis?.potential_setup?.target_levels?.[0] || livePrice * 1.05);
  const dollarRisk = (accountBalance * riskPercent) / 100;
  const priceRiskPerUnit = Math.abs(livePrice - stopLossPrice) || 0.01;
  const positionSizeUnits = dollarRisk / priceRiskPerUnit;
  const rewardDistance = Math.abs(takeProfitPrice - livePrice);
  const riskRewardCalculated = (rewardDistance / priceRiskPerUnit).toFixed(2);

  return (
    <div className="flex-1 flex flex-col bg-[#070A0F] text-slate-100 h-[calc(100vh-61px)] overflow-y-auto font-sans border-r border-slate-800">
      {/* Top Header & Ticker Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0D121D] border-b border-slate-800 select-none shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Live Market & Smart Money Structure Analysis
            </h2>
          </div>

          {/* Asset Category Groups */}
          <div className="flex items-center gap-1 bg-[#131A29] p-1 rounded-lg border border-slate-800">
            {ASSET_REGISTRY.map((a) => (
              <button
                key={a.ticker}
                onClick={() => setSelectedAsset(a.ticker)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedAsset === a.ticker
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {a.ticker}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-[#131A29] p-1 rounded-lg border border-slate-800">
            {['1m', '5m', '15m', '1H', '4H', '1D'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 text-xs font-mono font-medium rounded transition-colors ${
                  timeframe === tf ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Live Simulator Toggle & Refresh Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLiveTicking((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isLiveTicking
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isLiveTicking ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span>{isLiveTicking ? 'Live Feed: ON' : 'Live Feed: PAUSED'}</span>
          </button>

          <button
            onClick={() => fetchAnalysis(selectedAsset, timeframe)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-evaluate Structure</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Container */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Price Bar & Indicators Toggle Ribbon */}
        <div className="flex items-center justify-between bg-[#0E1422] p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white">{activeAssetObj.ticker}</span>
                <span className="text-xs text-slate-400">{activeAssetObj.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                  {activeAssetObj.category}
                </span>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span
                  className={`text-2xl font-mono font-extrabold transition-colors duration-300 ${
                    priceChangeDir === 'up'
                      ? 'text-emerald-400'
                      : priceChangeDir === 'down'
                      ? 'text-red-400'
                      : 'text-white'
                  }`}
                >
                  ${livePrice.toLocaleString(undefined, {
                    minimumFractionDigits: activeAssetObj.tickDecimals,
                    maximumFractionDigits: activeAssetObj.tickDecimals,
                  })}
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +2.14% (24h)
                </span>
              </div>
            </div>
          </div>

          {/* Indicator Overlays Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Overlays:
            </span>
            <button
              onClick={() => setShowEMA((v) => !v)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition-all ${
                showEMA ? 'bg-blue-900/60 text-blue-300 border border-blue-700/80' : 'bg-slate-900 text-slate-500'
              }`}
            >
              EMA (20/50/200)
            </button>
            <button
              onClick={() => setShowSMC((v) => !v)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition-all ${
                showSMC ? 'bg-purple-900/60 text-purple-300 border border-purple-700/80' : 'bg-slate-900 text-slate-500'
              }`}
            >
              SMC (OB / FVG / BOS)
            </button>
            <button
              onClick={() => setShowRSI((v) => !v)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition-all ${
                showRSI ? 'bg-amber-900/60 text-amber-300 border border-amber-700/80' : 'bg-slate-900 text-slate-500'
              }`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => setShowVolume((v) => !v)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition-all ${
                showVolume ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/80' : 'bg-slate-900 text-slate-500'
              }`}
            >
              Volume
            </button>
          </div>
        </div>

        {/* Dynamic Candlestick Chart Canvas (SVG Rendered) */}
        <div className="bg-[#090D15] rounded-2xl border border-slate-800 p-5 space-y-4 select-none relative overflow-hidden">
          {/* Chart Header Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2.5 font-mono">
            <div className="flex items-center gap-4">
              <span>O: ${candles[candles.length - 1]?.open.toFixed(activeAssetObj.tickDecimals)}</span>
              <span>H: ${candles[candles.length - 1]?.high.toFixed(activeAssetObj.tickDecimals)}</span>
              <span>L: ${candles[candles.length - 1]?.low.toFixed(activeAssetObj.tickDecimals)}</span>
              <span className="text-white font-bold">
                C: ${candles[candles.length - 1]?.close.toFixed(activeAssetObj.tickDecimals)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {showSMC && (
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    Order Block
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    FVG Imbalance
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                    BOS / CHoCH
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SVG Price Chart */}
          <div className="relative h-64 w-full">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-slate-700 w-full" />
              <div className="border-b border-slate-700 w-full" />
              <div className="border-b border-slate-700 w-full" />
              <div className="border-b border-slate-700 w-full" />
            </div>

            {/* Price Scale (Right Axis) */}
            <div className="absolute right-1 top-2 bottom-2 flex flex-col justify-between text-[10px] font-mono text-slate-500 pointer-events-none text-right">
              <div>${maxPrice.toFixed(activeAssetObj.tickDecimals)}</div>
              <div>${((maxPrice + minPrice) / 2).toFixed(activeAssetObj.tickDecimals)}</div>
              <div>${minPrice.toFixed(activeAssetObj.tickDecimals)}</div>
            </div>

            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Candlesticks */}
              {candles.map((c, idx) => {
                const totalCandles = candles.length;
                const candleWidthPct = 100 / totalCandles;
                const centerXPct = idx * candleWidthPct + candleWidthPct / 2;

                const yOpen = getYCoord(c.open);
                const yClose = getYCoord(c.close);
                const yHigh = getYCoord(c.high);
                const yLow = getYCoord(c.low);

                const topBody = Math.min(yOpen, yClose);
                const heightBody = Math.max(Math.abs(yOpen - yClose), 2);

                return (
                  <g key={idx}>
                    {/* SMC Zone Highlights */}
                    {showSMC && c.orderBlock && (
                      <rect
                        x={`${centerXPct - candleWidthPct * 0.7}%`}
                        y={Math.min(yHigh, yLow)}
                        width={`${candleWidthPct * 2.5}%`}
                        height={Math.abs(yHigh - yLow)}
                        fill={c.orderBlock === 'bullish' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
                        stroke={c.orderBlock === 'bullish' ? 'rgba(168, 85, 247, 0.6)' : 'rgba(239, 68, 68, 0.6)'}
                        strokeWidth="1"
                        rx="2"
                      />
                    )}

                    {showSMC && c.structure && (
                      <text
                        x={`${centerXPct}%`}
                        y={yHigh - 8}
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {c.structure}
                      </text>
                    )}

                    {/* Candlestick Wick */}
                    <line
                      x1={`${centerXPct}%`}
                      y1={yHigh}
                      x2={`${centerXPct}%`}
                      y2={yLow}
                      stroke={c.isUp ? '#10b981' : '#ef4444'}
                      strokeWidth="1.5"
                    />

                    {/* Candlestick Body */}
                    <rect
                      x={`${centerXPct - candleWidthPct * 0.35}%`}
                      y={topBody}
                      width={`${candleWidthPct * 0.7}%`}
                      height={heightBody}
                      fill={c.isUp ? '#10b981' : '#ef4444'}
                      rx="1"
                    />
                  </g>
                );
              })}

              {/* EMA 20 & 50 Simulated Overlay Splines */}
              {showEMA && (
                <>
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                    points={candles
                      .map((c, i) => {
                        const x = i * (100 / candles.length) + 100 / (2 * candles.length);
                        const emaVal = c.close * 0.995;
                        return `${(x / 100) * 800},${getYCoord(emaVal)}`;
                      })
                      .join(' ')}
                  />
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                    points={candles
                      .map((c, i) => {
                        const x = i * (100 / candles.length) + 100 / (2 * candles.length);
                        const emaVal = c.close * 0.988;
                        return `${(x / 100) * 800},${getYCoord(emaVal)}`;
                      })
                      .join(' ')}
                  />
                </>
              )}
            </svg>
          </div>

          {/* Volume Histogram Panel */}
          {showVolume && (
            <div className="h-16 w-full border-t border-slate-800/80 pt-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span>Volume Profile (Tick Aggr.)</span>
                <span>Avg: 3,420 contracts</span>
              </div>
              <div className="h-10 w-full flex items-end gap-1">
                {candles.map((c, i) => {
                  const maxVol = Math.max(...candles.map((v) => v.volume));
                  const hPct = (c.volume / maxVol) * 100;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-xs transition-all ${
                        c.isUp ? 'bg-emerald-500/40' : 'bg-red-500/40'
                      }`}
                      style={{ height: `${hPct}%` }}
                      title={`Volume: ${c.volume}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* RSI Oscillator Panel */}
          {showRSI && (
            <div className="h-16 w-full border-t border-slate-800/80 pt-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">RSI (14):</span>
                  <span className="text-slate-300 font-bold">58.4</span>
                </span>
                <span className="text-slate-500">Overbought: 70 | Oversold: 30</span>
              </div>
              <div className="h-8 w-full bg-[#06080D] rounded border border-slate-800 relative overflow-hidden flex items-center">
                <div className="absolute top-2 left-0 right-0 border-t border-dashed border-red-500/30" />
                <div className="absolute bottom-2 left-0 right-0 border-t border-dashed border-emerald-500/30" />
                <div className="h-1 bg-amber-400/80 w-full rounded" style={{ transform: 'translateY(2px)' }} />
              </div>
            </div>
          )}
        </div>

        {/* Structured Scenario & Educational Setup Analysis */}
        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bullish & Bearish Scenarios */}
            <div className="bg-[#0E1422] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-400" />
                <span>Structural Scenarios & Order Flow</span>
              </h3>

              <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Bullish Market Path</span>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  {analysis.bullish_scenario}
                </p>
              </div>

              <div className="p-3.5 bg-red-950/30 border border-red-800/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Bearish Market Path</span>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed">
                  {analysis.bearish_scenario}
                </p>
              </div>

              {/* Support & Resistance zones */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500">Key Support: </span>
                  <span className="text-emerald-400 font-bold">
                    ${analysis.support_levels.join(', $')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Key Resistance: </span>
                  <span className="text-red-400 font-bold">
                    ${analysis.resistance_levels.join(', $')}
                  </span>
                </div>
              </div>
            </div>

            {/* Position Sizing & Risk Management Framework */}
            <div className="bg-[#0E1422] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Risk Management & Position Sizing</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Fixed Fractional Risk</span>
              </h3>

              {/* Balance & Risk Controls */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-[#090D15] rounded-lg border border-slate-800">
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Account Size ($)
                  </label>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                    className="w-full bg-transparent font-mono text-white font-bold outline-none"
                  />
                </div>

                <div className="p-2.5 bg-[#090D15] rounded-lg border border-slate-800">
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Risk Per Trade (%)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[0.5, 1.0, 2.0].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRiskPercent(r)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                          riskPercent === r
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculated Position Table */}
              <div className="p-4 bg-[#090D15] border border-slate-800 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400 font-sans">Direction Bias:</span>
                  <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                    {analysis.potential_setup.direction}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Max Dollar Risk:</span>
                  <span className="font-bold text-red-400">
                    ${dollarRisk.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Stop Loss Level:</span>
                  <span className="font-bold text-red-400">
                    ${stopLossPrice.toFixed(activeAssetObj.tickDecimals)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Take-Profit Target:</span>
                  <span className="font-bold text-emerald-400">
                    ${takeProfitPrice.toFixed(activeAssetObj.tickDecimals)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Recommended Size:</span>
                  <span className="font-bold text-sky-400">
                    {positionSizeUnits.toFixed(2)} units
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-slate-400 font-sans">Risk / Reward Ratio:</span>
                  <span className="font-bold text-amber-400">1:{riskRewardCalculated}</span>
                </div>
              </div>

              {/* Major Uncertainties & News */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Macro News & Volatility Risks</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] text-slate-400 space-y-1">
                  {analysis.uncertainties_and_news_risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Regulatory & Safety Disclosure */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-3">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed select-text">
            {analysis?.disclaimer ||
              'NOTICE: Analytical scenarios are strictly educational and informational. They do not constitute financial advice, signals, or guaranteed predictions. DeskPilot AI never executes orders or places trades automatically.'}
          </p>
        </div>
      </div>
    </div>
  );
};
