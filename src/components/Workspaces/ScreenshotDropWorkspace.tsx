import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  Clipboard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  ArrowRight
} from 'lucide-react';
import { analyzeScreenshot } from '../../services/api';

interface ScreenshotDropWorkspaceProps {
  onStartAutonomousTask: (taskTitle: string, taskDesc: string) => void;
}

export const ScreenshotDropWorkspace: React.FC<ScreenshotDropWorkspaceProps> = ({
  onStartAutonomousTask,
}) => {
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Clipboard paste listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                const base64 = event.target.result as string;
                setScreenshotData(base64);
                triggerAnalysis(base64, userNotes);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [userNotes]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          setScreenshotData(base64);
          triggerAnalysis(base64, userNotes);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const triggerAnalysis = async (base64: string, notes: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await analyzeScreenshot({
        screenshotBase64: base64,
        userNotes: notes,
      });
      setAnalysisResult(res);
    } catch (err: any) {
      alert(`Error analyzing screenshot: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSampleScreenshot = (type: 'vscode_bug' | 'excel_sheet' | 'trading_chart') => {
    // Generate SVG data-url for instant visual testing
    let svgContent = '';
    if (type === 'vscode_bug') {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350">
        <rect width="600" height="350" fill="#1E1E1E"/>
        <text x="30" y="50" fill="#38BDF8" font-family="monospace" font-size="16">● expense_tracker.py — Visual Studio Code</text>
        <text x="30" y="100" fill="#E2E8F0" font-family="monospace" font-size="14">def add_expense(category, amount):</text>
        <text x="50" y="130" fill="#EF4444" font-family="monospace" font-size="14">    # BUG: missing validation guards</text>
        <text x="50" y="160" fill="#E2E8F0" font-family="monospace" font-size="14">    expenses.append({"amount": amount})</text>
        <rect x="30" y="240" width="540" height="70" fill="#252526" rx="6"/>
        <text x="45" y="270" fill="#FCA5A5" font-family="monospace" font-size="12">AssertionError: Negative amount -15.0 was logged</text>
      </svg>`;
    } else if (type === 'excel_sheet') {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350">
        <rect width="600" height="350" fill="#107C41"/>
        <text x="30" y="50" fill="#FFFFFF" font-family="sans-serif" font-size="18" font-weight="bold">Microsoft Excel - Sales_2026.xlsx</text>
        <rect x="30" y="80" width="540" height="230" fill="#FFFFFF" rx="4"/>
        <text x="45" y="120" fill="#334155" font-family="sans-serif" font-size="13">Order_ID | Customer | Units | Total</text>
        <text x="45" y="160" fill="#334155" font-family="sans-serif" font-size="13">ORD-101  | Acme Corp  | 140   | $5,985</text>
        <text x="45" y="200" fill="#DC2626" font-family="sans-serif" font-size="13">ORD-107  | Delta Co   | 50    | #DIV/0! (Error)</text>
      </svg>`;
    } else {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350">
        <rect width="600" height="350" fill="#0B0E14"/>
        <text x="30" y="45" fill="#38BDF8" font-family="monospace" font-size="18">BTC/USDT 4H — TradingView</text>
        <text x="30" y="80" fill="#34D399" font-family="monospace" font-size="22" font-weight="bold">$68,420.00 (+4.2%)</text>
        <path d="M 50 250 L 120 220 L 180 240 L 260 180 L 340 190 L 420 140 L 520 110" stroke="#10B981" stroke-width="4" fill="none"/>
        <line x1="30" y1="110" x2="570" y2="110" stroke="#EF4444" stroke-dasharray="4"/>
        <line x1="30" y1="240" x2="570" y2="240" stroke="#10B981" stroke-dasharray="4"/>
      </svg>`;
    }

    const base64 = `data:image/svg+xml;base64,${btoa(svgContent)}`;
    setScreenshotData(base64);
    triggerAnalysis(base64, userNotes);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0E14] text-slate-100 h-[calc(100vh-61px)] overflow-y-auto font-sans p-6 border-r border-slate-800">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
              <Clipboard className="w-4 h-4" />
              <span>Universal Vision & OCR Interpretation</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Screenshot Drag & Drop / Clipboard Paste
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Paste (<kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Ctrl+V</kbd>) or drag & drop any window screenshot. DeskPilot extracts visible context and formulates autonomous actions.
            </p>
          </div>

          {/* Quick preset samples */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Presets:</span>
            <button
              onClick={() => loadSampleScreenshot('vscode_bug')}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 rounded font-medium transition-colors"
            >
              VS Code Bug
            </button>
            <button
              onClick={() => loadSampleScreenshot('excel_sheet')}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded font-medium transition-colors"
            >
              Excel Table
            </button>
            <button
              onClick={() => loadSampleScreenshot('trading_chart')}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-medium transition-colors"
            >
              Trading Chart
            </button>
          </div>
        </div>

        {/* Drop Zone Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            isDragOver
              ? 'border-sky-400 bg-sky-950/20'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          {screenshotData ? (
            <div className="space-y-4">
              <img
                src={screenshotData}
                alt="Uploaded Screenshot"
                className="max-h-72 mx-auto rounded-xl border border-slate-700 shadow-md object-contain"
              />
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setScreenshotData(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Clear Screenshot
                </button>
                <button
                  onClick={() => triggerAnalysis(screenshotData, userNotes)}
                  disabled={isAnalyzing}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAnalyzing ? 'Analyzing with Vision AI...' : 'Re-Analyze Screenshot'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-6">
              <UploadCloud className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">
                Drag and drop screenshot here, or press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">Ctrl+V</kbd> to paste
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Supports screenshots from any IDE, spreadsheet, trading terminal, or browser window.
              </p>
            </div>
          )}
        </div>

        {/* Analysis Results & Task Proposals */}
        {analysisResult && (
          <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Vision AI Workspace Interpretation</h3>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                {analysisResult.detectedApp || 'Detected Workspace'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {analysisResult.summary}
            </p>

            {/* Extracted Text Snippets */}
            {analysisResult.extractedText && (
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                  OCR Text Stream Extracted
                </div>
                <div className="text-xs font-mono text-slate-300 space-y-0.5">
                  {analysisResult.extractedText.map((t: string, i: number) => (
                    <div key={i} className="truncate">{t}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Autonomous Tasks */}
            {analysisResult.suggestedTasks && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Proposed Autonomous Tasks
                </h4>
                <div className="space-y-2">
                  {analysisResult.suggestedTasks.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{t.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{t.description}</div>
                      </div>
                      <button
                        onClick={() => onStartAutonomousTask(t.title, t.description)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shrink-0"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Execute Autonomously</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
