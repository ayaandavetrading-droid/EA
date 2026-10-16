import React from 'react';
import { Download, Monitor, Terminal } from 'lucide-react';
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
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-slate-100 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-7 h-7 rounded-md bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
          <Terminal className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          DeskPilot AI
        </span>
      </div>

      {/* Zone 2: 4–5 clean single-line navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectApp('vscode')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeApp === 'vscode'
              ? 'text-sky-400 border-sky-400 font-semibold'
              : 'border-transparent'
          }`}
        >
          VS Code Studio
        </button>
        <button
          onClick={() => onSelectApp('excel')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeApp === 'excel'
              ? 'text-emerald-400 border-emerald-400 font-semibold'
              : 'border-transparent'
          }`}
        >
          Excel Intelligence
        </button>
        <button
          onClick={() => onSelectApp('visual_studio')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeApp === 'visual_studio'
              ? 'text-purple-400 border-purple-400 font-semibold'
              : 'border-transparent'
          }`}
        >
          Visual Studio IDE
        </button>
        <button
          onClick={() => onSelectApp('live_screen')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeApp === 'live_screen'
              ? 'text-amber-400 border-amber-400 font-semibold'
              : 'border-transparent'
          }`}
        >
          Live Screen Capture
        </button>
        <button
          onClick={onOpenPythonModal}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 text-slate-400 hover:text-slate-200"
        >
          Python Source & Tests
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onDownloadZip}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Windows App .zip</span>
        </button>
      </div>
    </header>
  );
};
