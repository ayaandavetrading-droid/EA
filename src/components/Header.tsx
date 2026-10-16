import React from 'react';
import { Download, Terminal } from 'lucide-react';
import { SupportedAppType } from '../types/deskpilot';

interface HeaderProps {
  activeApp: SupportedAppType;
  onSelectApp: (app: SupportedAppType) => void;
  onOpenPythonModal: () => void;
  onDownloadZip: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeApp,
  onSelectApp,
  onOpenPythonModal,
  onDownloadZip,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3 bg-[#0E131F] border-b border-slate-800 text-slate-100 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
          <Terminal className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          DeskPilot AI
        </span>
      </div>

      {/* Zone 2: Clean single-line navigation links */}
      <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-400 overflow-x-auto">
        <button
          onClick={() => onSelectApp('vscode')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeApp === 'vscode'
              ? 'text-sky-400 border-sky-400'
              : 'border-transparent'
          }`}
        >
          VS Code Studio
        </button>
        <button
          onClick={() => onSelectApp('excel')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeApp === 'excel'
              ? 'text-emerald-400 border-emerald-400'
              : 'border-transparent'
          }`}
        >
          Excel Intelligence
        </button>
        <button
          onClick={() => onSelectApp('trading_chart')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeApp === 'trading_chart'
              ? 'text-amber-400 border-amber-400'
              : 'border-transparent'
          }`}
        >
          Trading Chart Analysis
        </button>
        <button
          onClick={() => onSelectApp('screenshot_drop')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeApp === 'screenshot_drop'
              ? 'text-cyan-400 border-cyan-400'
              : 'border-transparent'
          }`}
        >
          Screenshot OCR & Drop
        </button>
        <button
          onClick={() => onSelectApp('projects_registry')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeApp === 'projects_registry'
              ? 'text-purple-400 border-purple-400'
              : 'border-transparent'
          }`}
        >
          Projects Registry
        </button>
        <button
          onClick={() => onSelectApp('live_screen')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeApp === 'live_screen'
              ? 'text-rose-400 border-rose-400'
              : 'border-transparent'
          }`}
        >
          Live Screen
        </button>
        <button
          onClick={onOpenPythonModal}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 text-slate-400"
        >
          Python & Tests
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onDownloadZip}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Windows App .zip</span>
        </button>
      </div>
    </header>
  );
};
