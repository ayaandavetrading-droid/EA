import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  BarChart2,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Info
} from 'lucide-react';
import { TradingChartAnalysis } from '../../types/deskpilot';
import { analyzeTradingChart } from '../../services/api';

const SAMPLE_ASSETS = [
  { ticker: 'BTC/USDT', name: 'Bitcoin / Tether', price: 68420.0, trend: 'bullish' },
  { ticker: 'ETH/USD', name: 'Ethereum / US Dollar', price: 3540.0, trend: 'bullish' },
  { ticker: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0845, trend: 'bearish' },
  { ticker: 'AAPL', name: 'Apple Inc.', price: 228.5, trend: 'neutral' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 138.8, trend: 'bullish' },
  { ticker: 'SPY', name: 'S&P 500 ETF Trust', price: 576.2, trend: 'bullish' },
];

export const TradingChartWorkspace: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('4H');
  const [analysis, setAnalysis] = useState<TradingChartAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalysis = async (ticker: string, tf: string) => {
    setIsLoading(true);
    try {
      const asset = SAMPLE_ASSETS.find((a) => a.ticker === ticker);
      const res = await analyzeTradingChart({
        sampleAsset: ticker,
        timeframe: tf,
        currentPrice: asset?.price,
      });
      setAnalysis(res);
    } catch (err: any) {
      console.error('Failed to analyze trading chart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(selectedAsset, timeframe);
  }, [selectedAsset, timeframe]);

  const asset = SAMPLE_ASSETS.find((a) => a.ticker === selectedAsset) || SAMPLE_ASSETS[0];

  return (
    <div className="flex-1 flex flex-col bg-[#0B0E14] text-slate-100 h-[calc(100vh-61px)] overflow-y-auto font-sans border-r border-slate-800">
      {/* Top Header & Ticker Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#111622] border-b border-slate-800 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Trading & Financial Chart Analysis
            </h2>
          </div>

          {/* Asset Selector */}
          <div className="flex items-center gap-1 bg-[#1A202E] p-1 rounded-lg border border-slate-700/60">
            {SAMPLE_ASSETS.map((a) => (
              <button
                key={a.ticker}
                onClick={() => setSelectedAsset(a.ticker)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedAsset === a.ticker
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {a.ticker}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-[#1A202E] p-1 rounded-lg border border-slate-700/60">
            {['15m', '1H', '4H', '1D'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 text-xs font-mono font-medium rounded transition-colors ${
                  timeframe === tf ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Main Content Area */}
      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Ticker Snapshot & Candlestick Visualization */}
        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-white">{asset.ticker}</span>
                <span className="text-xs text-slate-400">{asset.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                  {timeframe}
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-sky-400 mt-1">
                ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {analysis && (
              <div className="text-right">
                <div className="text-xs text-slate-400">Market Bias</div>
                <div
                  className={`text-sm font-bold flex items-center gap-1.5 justify-end mt-0.5 ${
                    analysis.market_bias.toLowerCase().includes('bullish')
                      ? 'text-emerald-400'
                      : analysis.market_bias.toLowerCase().includes('bearish')
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }`}
                >
                  {analysis.market_bias.toLowerCase().includes('bullish') ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{analysis.market_bias}</span>
                </div>
              </div>
            )}
          </div>

          {/* Simulated Interactive Candlestick Chart Canvas */}
          <div className="h-48 w-full bg-[#080B10] rounded-xl border border-slate-800/80 p-4 flex flex-col justify-between relative overflow-hidden select-none">
            {/* Price Level Guides */}
            <div className="absolute right-3 top-3 text-[10px] font-mono text-slate-500">
              Res: ${analysis?.resistance_levels[0]?.toLocaleString() || '---'}
            </div>
            <div className="absolute right-3 bottom-3 text-[10px] font-mono text-slate-500">
              Sup: ${analysis?.support_levels[0]?.toLocaleString() || '---'}
            </div>

            {/* Stylized Candlestick Chart Bars */}
            <div className="flex-1 flex items-end justify-between gap-1.5 pt-4 pb-2 px-2">
              {[42, 55, 48, 62, 58, 70, 65, 82, 75, 88, 92, 85, 96, 90, 102, 110, 105, 118].map(
                (h, idx) => {
                  const isUp = idx % 3 !== 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                      {/* Wick */}
                      <div
                        className={`w-[1px] ${isUp ? 'bg-emerald-500/60' : 'bg-red-500/60'}`}
                        style={{ height: `${Math.min(h + 12, 100)}%` }}
                      />
                      {/* Body */}
                      <div
                        className={`w-full max-w-[14px] rounded-xs ${
                          isUp ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]' : 'bg-red-500'
                        }`}
                        style={{ height: `${h * 0.7}%` }}
                      />
                    </div>
                  );
                }
              )}
            </div>

            {/* Support / Resistance Line overlays */}
            <div className="border-t border-dashed border-red-500/40 absolute top-10 left-0 right-16 pointer-events-none" />
            <div className="border-b border-dashed border-emerald-500/40 absolute bottom-10 left-0 right-16 pointer-events-none" />
          </div>
        </div>

        {/* Structured Scenario & Setup Analysis */}
        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bullish & Bearish Scenarios */}
            <div className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-400" />
                <span>Market Scenarios</span>
              </h3>

              <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Bullish Scenario</span>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  {analysis.bullish_scenario}
                </p>
              </div>

              <div className="p-3.5 bg-red-950/30 border border-red-800/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Bearish Scenario</span>
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

            {/* Potential Setup & Risk Framework */}
            <div className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Educational Trade Setup Framework</span>
              </h3>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400 font-sans">Direction Bias:</span>
                  <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                    {analysis.potential_setup.direction}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Potential Entry Area:</span>
                  <span className="font-bold text-sky-400">
                    ${analysis.potential_setup.potential_entry.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Invalidation Level (Stop):</span>
                  <span className="font-bold text-red-400">
                    ${analysis.potential_setup.invalidation_level.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Target Take-Profit:</span>
                  <span className="font-bold text-emerald-400">
                    ${analysis.potential_setup.target_levels.join(', $')}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-slate-400 font-sans">Est. Risk / Reward:</span>
                  <span className="font-bold text-amber-400">
                    {analysis.potential_setup.risk_reward_ratio}
                  </span>
                </div>
              </div>

              {/* Uncertainties & Macro News Risks */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Major Uncertainties & News Risks</span>
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
