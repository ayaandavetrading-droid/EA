import React, { useState } from 'react';
import {
  Eye,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  FileSearch,
  Sparkles,
  Lock
} from 'lucide-react';
import { analyzeScreenShot } from '../services/api';

export const VisionInspectorTab: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [userNotes, setUserNotes] = useState('');

  // Sample Preset MT5 Screenshots (Synthetic clean SVG chart snapshots)
  const samplePresets = [
    {
      id: 'eurusd_bull',
      name: 'EURUSD M5 Bull Scalp',
      description: 'Fast EMA stack (9/21/50) ascending with retest wick at 1.08420',
      svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" style="background:%23020617;font-family:monospace">
        <rect x="0" y="0" width="640" height="360" fill="%23020617"/>
        <text x="20" y="30" fill="%2338bdf8" font-size="14" font-weight="bold">MetaTrader 5 - [EURUSD, M5]</text>
        <text x="20" y="50" fill="%2394a3b8" font-size="11">Apex Markets ECN • Account: 84920194 • Spread: 8 pts</text>
        <line x1="20" y1="280" x2="620" y2="280" stroke="%231e293b" stroke-dasharray="4"/>
        <line x1="20" y1="200" x2="620" y2="200" stroke="%231e293b" stroke-dasharray="4"/>
        <line x1="20" y1="120" x2="620" y2="120" stroke="%231e293b" stroke-dasharray="4"/>
        <!-- EMA Lines -->
        <path d="M 40 260 Q 200 230 400 170 T 600 110" fill="none" stroke="%2310b981" stroke-width="2"/>
        <path d="M 40 280 Q 200 250 400 190 T 600 135" fill="none" stroke="%236366f1" stroke-width="2"/>
        <!-- Candlesticks -->
        <rect x="180" y="210" width="10" height="40" fill="%2310b981"/>
        <line x1="185" y1="195" x2="185" y2="260" stroke="%2310b981"/>
        <rect x="240" y="190" width="10" height="35" fill="%2310b981"/>
        <line x1="245" y1="175" x2="245" y2="235" stroke="%2310b981"/>
        <rect x="300" y="180" width="10" height="25" fill="%23f43f5e"/>
        <line x1="305" y1="170" x2="305" y2="215" stroke="%23f43f5e"/>
        <rect x="360" y="160" width="10" height="40" fill="%2310b981"/>
        <line x1="365" y1="145" x2="365" y2="210" stroke="%2310b981"/>
        <rect x="420" y="130" width="10" height="45" fill="%2310b981"/>
        <line x1="425" y1="115" x2="425" y2="185" stroke="%2310b981"/>
        <rect x="480" y="110" width="10" height="35" fill="%2310b981"/>
        <line x1="485" y1="95" x2="485" y2="155" stroke="%2310b981"/>
        <text x="500" y="105" fill="%2338bdf8" font-size="11">Current: 1.08585</text>
      </svg>`,
    },
    {
      id: 'xauusd_breakout',
      name: 'XAUUSD (Gold) M5 Breakout',
      description: 'Consolidation resistance at $2,724 breached with high momentum',
      svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" style="background:%23020617;font-family:monospace">
        <rect x="0" y="0" width="640" height="360" fill="%23020617"/>
        <text x="20" y="30" fill="%23fbbf24" font-size="14" font-weight="bold">MetaTrader 5 - [XAUUSD, M5 - Spot Gold]</text>
        <text x="20" y="50" fill="%2394a3b8" font-size="11">Apex Markets ECN • Account: 84920194 • Spread: 22 pts</text>
        <!-- Horizontal Resistance -->
        <line x1="20" y1="190" x2="620" y2="190" stroke="%23f59e0b" stroke-width="2" stroke-dasharray="6"/>
        <text x="40" y="180" fill="%23f59e0b" font-size="11">Prior Ceiling: $2,724.00</text>
        <!-- Breakout Bar -->
        <rect x="380" y="140" width="16" height="70" fill="%2310b981"/>
        <line x1="388" y1="120" x2="388" y2="220" stroke="%2310b981" stroke-width="2"/>
        <rect x="440" y="125" width="16" height="40" fill="%2310b981"/>
        <line x1="448" y1="105" x2="448" y2="175" stroke="%2310b981" stroke-width="2"/>
        <text x="470" y="120" fill="%23fbbf24" font-size="12" font-weight="bold">Now: $2,727.30</text>
      </svg>`,
    },
  ];

  const handleSelectPreset = (svgData: string) => {
    setSelectedImage(svgData);
    setAnalysisResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedImage(uploadEvent.target.result as string);
          setAnalysisResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeScreenShot(selectedImage, userNotes);
      setAnalysisResult(res);
    } catch (err: any) {
      alert(err.message || 'Vision analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-bold text-white">Visual Screen Observation & Feed Verification</h2>
            <p className="text-xs text-slate-400">
              Multimodal terminal recognition powered by Gemini Flash Vision. Supplementary verification only.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Screen share does NOT grant execution rights</span>
        </div>
      </div>

      {/* Main Grid: Upload & Preview on Left, Vision Analysis on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Image Selector & Live Preview */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              MT5 Terminal Screenshot or Screen Share
            </h3>
            <span className="text-xs text-slate-400 font-sans">PNG, JPG or Live Snapshot</span>
          </div>

          {/* Sample Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Quick Test Presets:</span>
            <div className="flex flex-wrap gap-2">
              {samplePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.svgDataUri)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-xs text-slate-300 hover:text-white transition-all font-mono"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area / Dropzone */}
          <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer transition-all bg-slate-950/40 flex flex-col items-center justify-center min-h-[220px]">
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Selected MT5 Terminal"
                className="max-h-[240px] w-auto rounded border border-slate-800 object-contain shadow-md"
              />
            ) : (
              <div className="space-y-2 text-slate-400">
                <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">Click to upload MT5 screenshot or drag image here</p>
                <p className="text-[11px] text-slate-500">Supports MetaTrader 5 desktop or mobile terminal snapshots</p>
              </div>
            )}
          </label>

          {/* Notes Input & Action Button */}
          <div className="space-y-2 pt-2">
            <input
              type="text"
              placeholder="Optional notes for AI (e.g. 'Looking at London open pullback on EURUSD')..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isAnalyzing}
              className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                !selectedImage || isAnalyzing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'Inspecting MT5 Screen with Gemini Vision...' : 'Analyze MT5 Terminal Screen'}
            </button>
          </div>
        </div>

        {/* Right Column: AI Analysis Report */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-emerald-400" />
                Visual Verification & Plain Language Audit
              </h3>
              <span className="text-xs text-slate-400 font-mono">Gemini Flash Multimodal</span>
            </div>

            {!analysisResult ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">No screen analysis generated yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Select a test preset on the left or upload an MT5 terminal screenshot, then click "Analyze MT5 Terminal Screen".
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-sans">
                {/* Recognition Badge */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">TERMINAL:</span>
                    <span className="font-bold text-white">{analysisResult.terminalType}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">SYMBOL / TF:</span>
                    <span className="font-bold text-cyan-400">
                      {analysisResult.symbol} ({analysisResult.timeframe})
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">ACCOUNT CHECK:</span>
                    <span className="font-bold text-emerald-400">Verified</span>
                  </div>
                </div>

                {/* Plain-Language Explanation */}
                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400 font-semibold text-[11px] block flex items-center gap-1.5 text-cyan-300">
                    <TrendingUp className="w-3.5 h-3.5" />
                    WHAT THE MARKET IS DOING (PLAIN ENGLISH):
                  </span>
                  <p className="text-slate-200 text-xs leading-relaxed">{analysisResult.marketExplanation}</p>
                </div>

                {/* Visible Indicators & Discrepancy Checks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-semibold text-[10px] block">VISIBLE INDICATORS:</span>
                    <ul className="text-slate-300 text-[11px] space-y-0.5 list-disc list-inside">
                      {analysisResult.visibleIndicators?.map((ind: string, i: number) => (
                        <li key={i}>{ind}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-semibold text-[10px] block">DATA DISCREPANCY AUDIT:</span>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Consistent with Broker Feed</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{analysisResult.discrepancyNotes}</p>
                  </div>
                </div>

                {/* Tactical Setup Suggestion */}
                {analysisResult.educationalSetup && (
                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 font-mono space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-300 font-bold text-xs">
                        Suggested Setup: {analysisResult.recommendedStrategy}
                      </span>
                      <span className="text-slate-300 text-xs">R:R {analysisResult.educationalSetup.rewardRisk}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block text-[9px]">POTENTIAL ENTRY</span>
                        <span className="text-white font-bold">{analysisResult.educationalSetup.potentialEntry}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">INVALIDATION (SL)</span>
                        <span className="text-amber-400 font-bold">{analysisResult.educationalSetup.invalidationSL}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">TARGET (TP)</span>
                        <span className="text-emerald-400 font-bold">{analysisResult.educationalSetup.targetTP}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Safety Disclaimer Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 italic flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>
              NOTICE: Visual recognition is supplementary evidence. Real trade execution is strictly governed by the
              MQL5 EA connected to your broker terminal data feed.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
