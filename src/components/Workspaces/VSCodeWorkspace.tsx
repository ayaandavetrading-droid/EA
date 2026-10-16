import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  Play,
  CheckCircle,
  AlertCircle,
  Terminal as TermIcon,
  RefreshCw,
  Sparkles,
  Save,
  Check
} from 'lucide-react';
import { ExecutionResult, WorkspaceState } from '../../types/deskpilot';
import { runCode } from '../../services/api';

interface VSCodeWorkspaceProps {
  workspace: WorkspaceState;
  onUpdateContent: (newContent: string) => void;
  onTriggerAnalyze: () => void;
  onLoadPracticeProject: () => void;
}

export const VSCodeWorkspace: React.FC<VSCodeWorkspaceProps> = ({
  workspace,
  onUpdateContent,
  onTriggerAnalyze,
  onLoadPracticeProject,
}) => {
  const [activeTab, setActiveTab] = useState(workspace.activeResource);
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'problems' | 'output'>('terminal');
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<ExecutionResult | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'DeskPilot VS Code Environment v1.0.0 (Windows x64)',
    'Type python3 expense_tracker.py or click "Run Code" to execute in sandbox.'
  ]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setTerminalHistory((prev) => [...prev, `$ python3 ${workspace.activeResource}`]);

    try {
      const result = await runCode({
        code: workspace.content,
        language: 'python',
      });
      setExecutionOutput(result);

      if (result.stdout) {
        setTerminalHistory((prev) => [...prev, result.stdout]);
      }
      if (result.stderr) {
        setTerminalHistory((prev) => [...prev, `[stderr] ${result.stderr}`]);
      }
      setTerminalHistory((prev) => [
        ...prev,
        `[Process finished with exit code ${result.exitCode} (${result.executionTimeMs}ms)]`
      ]);
    } catch (err: any) {
      setTerminalHistory((prev) => [...prev, `[Execution Error] ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunTests = async () => {
    setIsRunning(true);
    setTerminalHistory((prev) => [...prev, `$ python3 -m unittest test_tracker.py`]);

    const unitTestCode = `
import unittest

# Import active workspace code
class TestExpenseTracker(unittest.TestCase):
    def test_basic_expense(self):
        tracker = ExpenseTracker("temp_test.json")
        entry = tracker.add_expense("Travel", 20.0, "Subway")
        self.assertEqual(entry["amount"], 20.0)
        self.assertEqual(entry["category"], "Travel")

    def test_total_calculation(self):
        tracker = ExpenseTracker("temp_test.json")
        tracker.add_expense("Food", 10.0)
        tracker.add_expense("Food", 15.0)
        self.assertEqual(tracker.calculate_total(), 25.0)

if __name__ == '__main__':
    unittest.main()
`;

    try {
      const result = await runCode({
        code: workspace.content,
        testCode: unitTestCode,
        language: 'python',
      });
      setExecutionOutput(result);

      if (result.stdout) setTerminalHistory((prev) => [...prev, result.stdout]);
      if (result.stderr) setTerminalHistory((prev) => [...prev, result.stderr]);
      setTerminalHistory((prev) => [
        ...prev,
        result.success ? '✔ All unit tests passed successfully!' : '✖ Tests failed. See traceback.'
      ]);
    } catch (err: any) {
      setTerminalHistory((prev) => [...prev, `[Test Error] ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1E1E1E] text-[#D4D4D4] h-[calc(100vh-61px)] overflow-hidden font-sans border-r border-slate-800">
      {/* VS Code Window Top Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#323233] text-xs select-none border-b border-[#252526]">
        <div className="flex items-center gap-2 text-slate-300">
          <FileCode className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-white">Visual Studio Code</span>
          <span className="text-slate-500 font-mono text-[11px]">
            {workspace.activeResource} — DeskPilot_Workspace
          </span>
          {workspace.isDirty && (
            <span className="w-2 h-2 rounded-full bg-slate-400" title="Unsaved changes" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLoadPracticeProject}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-[#2D2D2D] hover:bg-[#3E3E42] text-sky-300 rounded border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Load Practice Project</span>
          </button>

          <button
            onClick={onTriggerAnalyze}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Analyze Workspace</span>
          </button>
        </div>
      </div>

      {/* Main VS Code Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Activity Bar */}
        <div className="w-12 bg-[#333333] flex flex-col items-center py-3 gap-4 border-r border-[#252526] select-none text-slate-400">
          <button className="text-white hover:text-white p-1 border-l-2 border-white pl-2">
            <Folder className="w-5 h-5" />
          </button>
          <button className="hover:text-white p-1">
            <Play className="w-5 h-5" />
          </button>
          <button className="hover:text-white p-1">
            <TermIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Explorer Sidebar */}
        <div className="w-56 bg-[#252526] border-r border-[#1E1E1E] flex flex-col select-none text-xs">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#333333]">
            Explorer: Workspace
          </div>
          <div className="p-2 space-y-1">
            {(workspace.openFiles || ['expense_tracker.py', 'test_tracker.py', 'requirements.txt']).map((file) => (
              <button
                key={file}
                onClick={() => setActiveTab(file)}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left ${
                  activeTab === file
                    ? 'bg-[#37373D] text-white font-medium'
                    : 'text-slate-400 hover:bg-[#2A2D2E] hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{file}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto p-3 bg-[#1E1E1E] border-t border-[#333333] text-[11px] text-slate-400">
            <div className="font-semibold text-slate-300 mb-1">DeskPilot Bridge</div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              <span>Accessibility & UIA Connected</span>
            </div>
          </div>
        </div>

        {/* Center Code Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1E1E1E]">
          {/* File Tab Bar */}
          <div className="flex items-center bg-[#252526] border-b border-[#1E1E1E] overflow-x-auto select-none">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] text-white text-xs border-t-2 border-sky-400 font-medium">
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span>{workspace.activeResource}</span>
            </div>

            <div className="ml-auto pr-3 flex items-center gap-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
              >
                <Play className="w-3 h-3" />
                <span>{isRunning ? 'Running...' : 'Run Python'}</span>
              </button>

              <button
                onClick={handleRunTests}
                disabled={isRunning}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Run Unit Tests</span>
              </button>
            </div>
          </div>

          {/* Code Textarea with line numbers */}
          <div className="flex-1 flex overflow-hidden font-mono text-xs">
            {/* Line numbers gutter */}
            <div className="w-12 bg-[#1E1E1E] text-[#858585] py-3 pr-3 text-right select-none border-r border-[#2D2D2D] leading-5 shrink-0">
              {workspace.content.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editable code text */}
            <textarea
              value={workspace.content}
              onChange={(e) => onUpdateContent(e.target.value)}
              className="flex-1 p-3 bg-transparent text-[#D4D4D4] resize-none focus:outline-none font-mono leading-5 overflow-auto select-text selection:bg-[#264F78]"
              spellCheck={false}
            />
          </div>

          {/* Bottom Panel (Terminal / Problems) */}
          <div className="h-48 bg-[#181818] border-t border-[#333333] flex flex-col">
            {/* Bottom Tab Bar */}
            <div className="flex items-center justify-between px-3 bg-[#252526] text-xs border-b border-[#333333]">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveBottomTab('terminal')}
                  className={`py-1.5 font-medium border-b-2 ${
                    activeBottomTab === 'terminal'
                      ? 'text-white border-sky-400'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  Terminal
                </button>
                <button
                  onClick={() => setActiveBottomTab('problems')}
                  className={`py-1.5 font-medium border-b-2 flex items-center gap-1.5 ${
                    activeBottomTab === 'problems'
                      ? 'text-white border-sky-400'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  <span>Problems</span>
                  {workspace.diagnostics.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                      {workspace.diagnostics.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                bash / python3 (Linux sandbox)
              </div>
            </div>

            {/* Bottom Tab Content */}
            <div className="flex-1 p-2.5 overflow-y-auto font-mono text-xs select-text">
              {activeBottomTab === 'terminal' ? (
                <div className="space-y-1">
                  {terminalHistory.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.startsWith('$')
                          ? 'text-sky-300 font-bold'
                          : line.includes('Error') || line.includes('stderr')
                          ? 'text-red-400'
                          : line.includes('✔')
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-300'
                      }
                    >
                      {line}
                    </div>
                  ))}
                  {isRunning && (
                    <div className="text-amber-400 flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span>Executing Python subprocess...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {workspace.diagnostics.length === 0 ? (
                    <div className="text-slate-500">No problems detected in workspace.</div>
                  ) : (
                    workspace.diagnostics.map((diag, i) => (
                      <div key={i} className="flex items-start gap-2 text-amber-300/90 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                        <span>{diag}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
