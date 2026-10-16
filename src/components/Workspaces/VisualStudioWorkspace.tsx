import React, { useState } from 'react';
import {
  Code,
  FolderTree,
  Play,
  Hammer,
  CheckCircle,
  FileCode,
  Sparkles,
  RefreshCw,
  Layers
} from 'lucide-react';
import { WorkspaceState } from '../../types/deskpilot';

interface VisualStudioWorkspaceProps {
  workspace: WorkspaceState;
  onUpdateContent: (newContent: string) => void;
  onTriggerAnalyze: () => void;
}

export const VisualStudioWorkspace: React.FC<VisualStudioWorkspaceProps> = ({
  workspace,
  onUpdateContent,
  onTriggerAnalyze,
}) => {
  const [activeFile, setActiveFile] = useState(workspace.activeResource);
  const [buildLogs, setBuildLogs] = useState<string[]>([
    '------ Build started: Project: DeskPilot.Enterprise, Configuration: Debug Any CPU ------',
    'OrderProcessor.cs(12,18): info CS8019: Unnecessary using directive.',
    'DeskPilot.Enterprise -> bin\\Debug\\net8.0\\DeskPilot.Enterprise.dll',
    '========== Build: 1 succeeded, 0 failed, 0 up-to-date, 0 skipped =========='
  ]);
  const [isBuilding, setIsBuilding] = useState(false);

  const handleBuild = () => {
    setIsBuilding(true);
    setBuildLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Rebuilding solution DeskPilot.sln...`,
      'Compiling C# symbols and checking invariants...',
      '========== Build: 1 succeeded, 0 failed =========='
    ]);
    setTimeout(() => setIsBuilding(false), 800);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#2D2D30] text-[#DCDCDC] h-[calc(100vh-61px)] overflow-hidden font-sans border-r border-slate-800">
      {/* Visual Studio Top Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#2D2D30] text-xs select-none border-b border-[#3F3F46]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-white">Visual Studio 2026 Enterprise</span>
          <span className="text-slate-400 font-mono text-[11px]">
            DeskPilot.sln — {workspace.activeResource}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBuild}
            disabled={isBuilding}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#007ACC] hover:bg-[#1C97EA] text-white rounded font-medium transition-colors"
          >
            <Hammer className="w-3 h-3" />
            <span>{isBuilding ? 'Building...' : 'Build Solution'}</span>
          </button>

          <button
            onClick={onTriggerAnalyze}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-700 hover:bg-purple-600 text-white rounded font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>AI Inspect Context</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Solution Explorer Sidebar */}
        <div className="w-60 bg-[#252526] border-r border-[#3F3F46] flex flex-col select-none text-xs">
          <div className="flex items-center justify-between px-3 py-2 bg-[#2D2D30] border-b border-[#3F3F46] font-semibold text-slate-300">
            <span>Solution Explorer</span>
            <FolderTree className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="p-2 space-y-1 overflow-y-auto">
            <div className="text-slate-400 font-medium px-1 py-0.5 text-[11px]">
              Solution 'DeskPilot' (1 of 1 project)
            </div>
            <div className="pl-3 space-y-1">
              <div className="text-purple-300 font-medium text-[11px]">
                DeskPilot.Enterprise
              </div>
              <div className="pl-3 space-y-0.5">
                {(workspace.openFiles || ['OrderProcessor.cs', 'OrderProcessorTests.cs', 'App.config']).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFile(f)}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left ${
                      activeFile === f
                        ? 'bg-[#37373D] text-white font-medium'
                        : 'text-slate-400 hover:bg-[#2A2D2E] hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-purple-400" />
                    <span className="truncate">{f}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Code Editor Area */}
        <div className="flex-1 flex flex-col bg-[#1E1E1E]">
          {/* Document Tab */}
          <div className="flex items-center bg-[#2D2D30] border-b border-[#3F3F46] px-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1E1E1E] text-white text-xs border-t-2 border-purple-500 font-medium">
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>{workspace.activeResource}</span>
            </div>
          </div>

          {/* C# Code Area */}
          <div className="flex-1 flex overflow-hidden font-mono text-xs">
            <div className="w-10 bg-[#1E1E1E] text-[#858585] py-3 pr-2 text-right select-none border-r border-[#2D2D2D] leading-5 shrink-0">
              {workspace.content.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <textarea
              value={workspace.content}
              onChange={(e) => onUpdateContent(e.target.value)}
              className="flex-1 p-3 bg-transparent text-[#D4D4D4] resize-none focus:outline-none font-mono leading-5 overflow-auto select-text selection:bg-[#264F78]"
              spellCheck={false}
            />
          </div>

          {/* Build Output Window */}
          <div className="h-40 bg-[#1E1E1E] border-t border-[#3F3F46] flex flex-col text-xs font-mono">
            <div className="px-3 py-1 bg-[#2D2D30] text-slate-300 font-semibold border-b border-[#3F3F46] flex items-center justify-between">
              <span>Output: Build</span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Ready</span>
              </span>
            </div>
            <div className="flex-1 p-2 overflow-y-auto space-y-1 select-text text-slate-400">
              {buildLogs.map((log, i) => (
                <div key={i} className={log.includes('succeeded') ? 'text-emerald-400' : ''}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
