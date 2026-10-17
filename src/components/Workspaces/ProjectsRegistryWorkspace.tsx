import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  FileCode,
  Sparkles,
  RefreshCw,
  RotateCcw,
  Archive,
  Download,
  Bug,
  ChevronRight,
  Terminal,
  Check,
  AlertCircle,
  X,
  Code2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ProjectRegistryItem, ProjectLifecycleState } from '../../types/deskpilot';
import {
  fetchProjectsRegistry,
  generateAutonomousProject,
  runCode,
  transitionProjectState,
  restartProject,
  archiveProject,
  autoDebugProject,
  updateProjectFile
} from '../../services/api';

interface ProjectsRegistryWorkspaceProps {
  onLoadProjectIntoWorkspace: (project: ProjectRegistryItem) => void;
}

const LIFECYCLE_STEPS: ProjectLifecycleState[] = [
  'Planned',
  'Creating',
  'Implementing',
  'Running',
  'Testing',
  'Debugging',
  'Completed',
];

export const ProjectsRegistryWorkspace: React.FC<ProjectsRegistryWorkspaceProps> = ({
  onLoadProjectIntoWorkspace,
}) => {
  const [projects, setProjects] = useState<ProjectRegistryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<ProjectRegistryItem | null>(null);
  const [activeFileTab, setActiveFileTab] = useState<string>('');
  const [fileContentEdit, setFileContentEdit] = useState<string>('');
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<{
    stdout: string;
    stderr: string;
    exitCode: number;
    timeMs: number;
    timestamp: string;
  } | null>(null);
  const [isRunningSandbox, setIsRunningSandbox] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetchProjectsRegistry();
      const list = res.projects || [];
      setProjects(list);
      if (activeProject) {
        const updated = list.find((p: ProjectRegistryItem) => p.id === activeProject.id);
        if (updated) {
          setActiveProject(updated);
        }
      }
    } catch (err: any) {
      console.error('Failed to load projects registry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Update active file tab and editor buffer when activeProject changes
  useEffect(() => {
    if (activeProject && activeProject.files && activeProject.files.length > 0) {
      const primary =
        activeProject.files.find((f) => !f.filename.includes('test') && !f.filename.includes('README')) ||
        activeProject.files[0];
      setActiveFileTab(primary.filename);
      setFileContentEdit(primary.content);
    }
  }, [activeProject?.id]);

  const handleSelectFile = (filename: string) => {
    setActiveFileTab(filename);
    const file = activeProject?.files?.find((f) => f.filename === filename);
    if (file) {
      setFileContentEdit(file.content);
    }
  };

  const handleSaveCurrentFile = async () => {
    if (!activeProject || !activeFileTab) return;
    setIsSavingFile(true);
    try {
      await updateProjectFile(activeProject.id, activeFileTab, fileContentEdit);
      setStatusMessage(`Saved file: ${activeFileTab}`);
      setTimeout(() => setStatusMessage(null), 3000);
      await loadProjects();
    } catch (err: any) {
      alert(`Error saving file: ${err.message}`);
    } finally {
      setIsSavingFile(false);
    }
  };

  const handleGenerateNewProject = async (type: string, name: string) => {
    setIsGenerating(true);
    try {
      const newProj = await generateAutonomousProject({ projectType: type, name });
      await loadProjects();
      const updated = projects.find((p) => p.id === newProj.id) || newProj;
      setActiveProject(updated);
      setStatusMessage(`Invented project: ${newProj.name}`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(`Error generating project: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdvanceLifecycle = async (proj: ProjectRegistryItem) => {
    const currentIndex = LIFECYCLE_STEPS.indexOf(proj.status as ProjectLifecycleState);
    const nextState =
      currentIndex >= 0 && currentIndex < LIFECYCLE_STEPS.length - 1
        ? LIFECYCLE_STEPS[currentIndex + 1]
        : 'Completed';

    try {
      await transitionProjectState(proj.id, nextState, `Advanced manually via Lifecycle Engine`);
      await loadProjects();
    } catch (err: any) {
      alert(`Failed to advance state: ${err.message}`);
    }
  };

  const handleRunSandboxTests = async (proj: ProjectRegistryItem) => {
    setIsRunningSandbox(true);
    setTerminalOutput(null);

    try {
      const testFile = proj.files?.find((f) => f.filename.includes('test')) || proj.files?.[0];
      const mainFile =
        proj.files?.find((f) => !f.filename.includes('test') && !f.filename.includes('README')) ||
        proj.files?.[0];

      await transitionProjectState(proj.id, 'Testing', `Executing sandbox tests`);

      const res = await runCode({
        code: mainFile?.content || '',
        testCode: testFile ? testFile.content : '',
        language: proj.language.toLowerCase().includes('sql')
          ? 'sql'
          : proj.language.toLowerCase().includes('type')
          ? 'typescript'
          : 'python',
      });

      setTerminalOutput({
        stdout: res.stdout,
        stderr: res.stderr,
        exitCode: res.exitCode,
        timeMs: res.executionTimeMs,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (res.success) {
        await transitionProjectState(proj.id, 'Completed', `Tests passed with exit code 0`);
      } else {
        await transitionProjectState(proj.id, 'Debugging', `Test failed with exit code ${res.exitCode}`);
      }
      await loadProjects();
    } catch (err: any) {
      setTerminalOutput({
        stdout: '',
        stderr: `Execution error: ${err.message}`,
        exitCode: 1,
        timeMs: 0,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsRunningSandbox(false);
    }
  };

  const handleAutoDebug = async (proj: ProjectRegistryItem) => {
    try {
      const res = await autoDebugProject(proj.id);
      setStatusMessage(`✔ Auto-debugger: ${res.debugNote}`);
      setTimeout(() => setStatusMessage(null), 5000);
      await loadProjects();
    } catch (err: any) {
      alert(`Debug error: ${err.message}`);
    }
  };

  const handleRestart = async (proj: ProjectRegistryItem) => {
    try {
      await restartProject(proj.id);
      await loadProjects();
      setStatusMessage(`Restarted ${proj.name} to Planned state`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Restart error: ${err.message}`);
    }
  };

  const handleArchiveToggle = async (proj: ProjectRegistryItem) => {
    const isArchived = proj.status === 'Archived';
    try {
      await archiveProject(proj.id, !isArchived);
      await loadProjects();
    } catch (err: any) {
      alert(`Archive error: ${err.message}`);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Archived') return p.status === 'Archived';
    return p.status === selectedFilter;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'COMPLETED':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      case 'Testing':
        return 'text-sky-400 bg-sky-950/60 border-sky-800/60';
      case 'Running':
      case 'Implementing':
        return 'text-blue-400 bg-blue-950/60 border-blue-800/60';
      case 'Debugging':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'Failed':
        return 'text-red-400 bg-red-950/60 border-red-800/60';
      case 'Archived':
        return 'text-slate-400 bg-slate-900 border-slate-800';
      default:
        return 'text-purple-400 bg-purple-950/60 border-purple-800/60';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#080B10] text-slate-100 h-[calc(100vh-61px)] overflow-hidden font-sans border-r border-slate-800">
      {/* Top Header & Autonomous Controls */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0E131F] border-b border-slate-800/90 select-none shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-0.5">
            <FolderGit2 className="w-4 h-4" />
            <span>Autonomous Coding Studio & Multi-Project Lifecycle Engine</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Project Registry & Isolated Sandbox</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 font-mono text-slate-300">
              {projects.length} Projects Total
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {statusMessage && (
            <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/70 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          <button
            onClick={() => handleGenerateNewProject('react', 'React Real-Time Performance Monitor')}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Inventing Project...' : '+ Invent Project'}</span>
          </button>

          <button
            onClick={loadProjects}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Preset Quick-Generators */}
      <div className="px-6 py-2.5 bg-[#0B0E14] border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto shrink-0 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Quick Runtimes:</span>
        </span>
        {[
          { type: 'python', label: 'Python CSV Cleaner', name: 'Python CSV Cleaner & Deduplicator' },
          { type: 'typescript', label: 'TS LRU Cache', name: 'TypeScript Generic LRU Cache' },
          { type: 'sql', label: 'SQLite Store & Analytics', name: 'SQLite Retail Store Inventory & Analytics' },
          { type: 'csharp', label: 'C# .NET Circuit Breaker', name: 'C# .NET Resilient Circuit Breaker' },
          { type: 'react', label: 'React Perf Monitor', name: 'React Real-Time Performance Monitor' },
          { type: 'data_viz', label: 'Python ML Anomaly Detector', name: 'Python Machine Learning Anomaly Detector' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => handleGenerateNewProject(item.type, item.name)}
            disabled={isGenerating}
            className="px-2.5 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md border border-slate-800 transition-colors shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3 h-3 text-sky-400" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Lifecycle Filter Bar */}
      <div className="px-6 py-2 bg-[#0E131F]/50 border-b border-slate-800/50 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none text-xs">
        {['All', ...LIFECYCLE_STEPS, 'Archived'].map((tab) => {
          const count =
            tab === 'All'
              ? projects.length
              : projects.filter((p) => p.status === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                selectedFilter === tab
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>{tab}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-400">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Layout (Two-Pane: Projects List & Project Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Project Cards List */}
        <div className="w-1/2 border-r border-slate-800 overflow-y-auto p-4 space-y-3">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No projects found in '{selectedFilter}' state.
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const isSelected = activeProject?.id === proj.id;
              const isCompleted = proj.status === 'Completed' || proj.status === 'COMPLETED';

              return (
                <div
                  key={proj.id}
                  onClick={() => setActiveProject(proj)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-[#141B2D] border-sky-500/60 shadow-lg shadow-sky-500/5'
                      : 'bg-[#0E131F] border-slate-800 hover:border-slate-700 hover:bg-[#111726]'
                  }`}
                >
                  {/* Title & Status Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {proj.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                          {proj.language}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {proj.description}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeColor(
                          proj.status
                        )}`}
                      >
                        {proj.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {proj.testStatus}
                      </span>
                    </div>
                  </div>

                  {/* Lifecycle Stepper Bar */}
                  <div className="pt-1">
                    <div className="text-[10px] font-mono text-slate-500 mb-1 flex justify-between">
                      <span>Lifecycle Progression</span>
                      <span>{proj.status}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const stepIdx = LIFECYCLE_STEPS.indexOf(proj.status as ProjectLifecycleState);
                        const isDone = isCompleted || (stepIdx !== -1 && idx <= stepIdx);
                        const isCurrent = step === proj.status;

                        return (
                          <div
                            key={step}
                            className={`h-1.5 rounded-full transition-all ${
                              isDone
                                ? 'bg-sky-400'
                                : isCurrent
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-slate-800'
                            }`}
                            title={`Stage: ${step}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Path & Requirements */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800/80">
                    <span>Path: {proj.path}</span>
                    <span>Category: {proj.category}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdvanceLifecycle(proj);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-sky-950/70 hover:bg-sky-900/90 text-sky-300 rounded-md border border-sky-800/60 transition-colors flex items-center gap-1"
                        title="Advance to next lifecycle state"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>Advance</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunSandboxTests(proj);
                        }}
                        disabled={isRunningSandbox}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 rounded-md border border-emerald-800/60 transition-colors flex items-center gap-1"
                        title="Run tests in sandbox"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run Tests</span>
                      </button>

                      {proj.status === 'Debugging' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAutoDebug(proj);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 rounded-md border border-amber-800/60 transition-colors flex items-center gap-1"
                          title="Self-healing auto debugger"
                        >
                          <Bug className="w-3 h-3" />
                          <span>Auto Debug</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadProjectIntoWorkspace(proj);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-md transition-colors flex items-center gap-1"
                        title="Open in VS Code"
                      >
                        <FileCode className="w-3 h-3" />
                        <span>VS Code</span>
                      </button>

                      <a
                        href={`/api/projects/${proj.id}/export-zip`}
                        onClick={(e) => e.stopPropagation()}
                        download
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
                        title="Download ZIP"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestart(proj);
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
                        title="Restart Lifecycle"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveToggle(proj);
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
                        title={proj.status === 'Archived' ? 'Unarchive' : 'Archive'}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Pane: Project Inspector, File Viewer, and Terminal Output */}
        <div className="w-1/2 flex flex-col bg-[#080B10] overflow-hidden">
          {activeProject ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Active Project Title & Metadata Bar */}
              <div className="px-5 py-3 bg-[#0E131F] border-b border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-sky-400" />
                    <span>{activeProject.name}</span>
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    {activeProject.path} • {activeProject.language}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveCurrentFile}
                    disabled={isSavingFile}
                    className="px-2.5 py-1 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>{isSavingFile ? 'Saving...' : 'Save File'}</span>
                  </button>

                  <button
                    onClick={() => handleRunSandboxTests(activeProject)}
                    disabled={isRunningSandbox}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>{isRunningSandbox ? 'Testing...' : 'Run Test Suite'}</span>
                  </button>
                </div>
              </div>

              {/* Multi-File Tab Selector */}
              <div className="flex items-center bg-[#0B0E14] border-b border-slate-800 px-4 overflow-x-auto shrink-0">
                {activeProject.files?.map((f) => (
                  <button
                    key={f.filename}
                    onClick={() => handleSelectFile(f.filename)}
                    className={`px-3 py-2 text-xs font-mono transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
                      activeFileTab === f.filename
                        ? 'border-sky-400 text-white bg-slate-900/80'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-sky-400" />
                    <span>{f.filename}</span>
                  </button>
                ))}
              </div>

              {/* Code Editor Pane */}
              <div className="flex-1 flex flex-col p-3 overflow-hidden bg-[#0A0D14]">
                <textarea
                  value={fileContentEdit}
                  onChange={(e) => setFileContentEdit(e.target.value)}
                  className="w-full flex-1 bg-transparent text-slate-200 font-mono text-xs p-2 resize-none outline-none focus:ring-0 leading-relaxed overflow-y-auto selection:bg-sky-500/30"
                  spellCheck={false}
                />
              </div>

              {/* Terminal & Test Execution Output Drawer */}
              <div className="h-44 border-t border-slate-800 bg-[#06080C] flex flex-col shrink-0">
                <div className="flex items-center justify-between px-4 py-1.5 bg-[#0A0E16] border-b border-slate-800/80 text-[11px] font-mono select-none">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sandbox Terminal Output</span>
                    {terminalOutput && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          terminalOutput.exitCode === 0
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        Exit Code {terminalOutput.exitCode} ({terminalOutput.timeMs}ms)
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500">
                    {terminalOutput ? `Executed at ${terminalOutput.timestamp}` : 'Ready for test run'}
                  </div>
                </div>

                <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 space-y-1">
                  {terminalOutput ? (
                    <>
                      {terminalOutput.stdout && (
                        <div className="text-emerald-300 whitespace-pre-wrap">
                          {terminalOutput.stdout}
                        </div>
                      )}
                      {terminalOutput.stderr && (
                        <div className="text-red-400 whitespace-pre-wrap">
                          {terminalOutput.stderr}
                        </div>
                      )}
                      <div className="text-slate-500 text-[10px]">
                        ✓ Process exited with status code {terminalOutput.exitCode}. All sandbox handles closed.
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-600 text-[11px] italic">
                      Click "Run Test Suite" or "Run Tests" to execute this project inside an isolated native runtime sandbox.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-3">
              <Code2 className="w-12 h-12 text-slate-700" />
              <div className="text-sm font-semibold text-slate-400">No Project Selected</div>
              <p className="text-xs max-w-sm text-slate-500 leading-relaxed">
                Select any project from the left panel to inspect source files, review tests, execute in the isolated sandbox, or trigger the self-healing auto debugger.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
