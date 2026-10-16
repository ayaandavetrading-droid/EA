import React, { useState, useEffect, useRef } from 'react';
import {
  Power,
  GripHorizontal,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Sliders,
  ShieldAlert,
  Terminal,
  Zap
} from 'lucide-react';
import {
  AutonomousStatusType,
  PaceMode,
  StepDiff,
  SupportedAppType,
  TaskHistoryItem,
  TaskPlan
} from '../../types/deskpilot';

interface FloatingOverlayProps {
  isAutonomousOn: boolean;
  onToggleAutonomous: () => void;
  status: AutonomousStatusType;
  detectedApp: string;
  appType: SupportedAppType;
  currentTaskTitle: string;
  currentTaskDescription: string;
  currentDiff: StepDiff | null;
  activeTaskPlan: TaskPlan | null;
  taskHistory: TaskHistoryItem[];
  onRevertLastTask: () => void;
  onEmergencyStop: () => void;
  isEmergencyStopped: boolean;
  onResetEmergencyStop: () => void;
  onAuthorizeDestructiveAction?: () => void;
  pace: PaceMode;
  onChangePace: (pace: PaceMode) => void;
}

export const FloatingOverlay: React.FC<FloatingOverlayProps> = ({
  isAutonomousOn,
  onToggleAutonomous,
  status,
  detectedApp,
  appType,
  currentTaskTitle,
  currentTaskDescription,
  currentDiff,
  activeTaskPlan,
  taskHistory,
  onRevertLastTask,
  onEmergencyStop,
  isEmergencyStopped,
  onResetEmergencyStop,
  onAuthorizeDestructiveAction,
  pace,
  onChangePace,
}) => {
  // Draggable window state
  const [position, setPosition] = useState({ x: 28, y: 76 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPosX: 0, startPosY: 0 });

  // Widget settings
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [showPaceMenu, setShowPaceMenu] = useState(false);

  // Keyboard shortcut listener for Emergency Stop (Esc or Ctrl+Alt+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.ctrlKey && e.altKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        onEmergencyStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEmergencyStop]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 390, dragStartRef.current.startPosX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 100, dragStartRef.current.startPosY + dy)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Dynamic Status Badge
  const getStatusBadge = () => {
    if (isEmergencyStopped) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-700">
          EMERGENCY STOP
        </span>
      );
    }
    switch (status) {
      case 'STOPPED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
            STOPPED
          </span>
        );
      case 'SCANNING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800 animate-pulse">
            SCANNING
          </span>
        );
      case 'PLANNING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
            PLANNING
          </span>
        );
      case 'EXECUTING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700 animate-pulse">
            EXECUTING
          </span>
        );
      case 'TESTING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-700">
            TESTING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
            COMPLETED
          </span>
        );
      case 'PAUSED_FOR_AUTHORIZATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-700">
            AUTH REQUIRED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: alwaysOnTop ? 50 : 20,
      }}
      className="fixed w-[370px] max-w-[calc(100vw-20px)] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans select-none"
    >
      {/* Title Bar & Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-800 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-sky-400 tracking-tight">
            DeskPilot AI
          </span>
          <span className="text-[10px] text-slate-500 font-mono">AUTONOMOUS</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Always on top toggle */}
          <button
            onClick={() => setAlwaysOnTop(!alwaysOnTop)}
            title={alwaysOnTop ? 'Always on Top (Active)' : 'Always on Top (Off)'}
            className={`p-1 rounded text-[11px] transition-colors ${
              alwaysOnTop ? 'text-sky-400 bg-sky-950/60' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Expand */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Single-Toggle Control Box */}
      <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <button
          onClick={onToggleAutonomous}
          className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-200 shadow-md ${
            isAutonomousOn
              ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400'
              : 'bg-sky-500 hover:bg-sky-400 text-slate-950 border border-sky-300 font-bold'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                isAutonomousOn ? 'bg-red-700/80 text-white' : 'bg-sky-600/30 text-slate-950'
              }`}
            >
              <Power className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <div className="text-sm font-extrabold uppercase tracking-wide">
                {isAutonomousOn ? 'TURN OFF ASSISTANT' : 'TURN ON ASSISTANT'}
              </div>
              <div
                className={`text-[11px] font-medium ${
                  isAutonomousOn ? 'text-red-100' : 'text-slate-800'
                }`}
              >
                {isAutonomousOn
                  ? 'Autonomous workflow active (background loop)'
                  : 'Start hands-free coding & Excel engine'}
              </div>
            </div>
          </div>

          <div
            className={`w-4 h-4 rounded-full border-2 transition-transform duration-300 ${
              isAutonomousOn
                ? 'bg-emerald-400 border-white shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-slate-700 border-slate-500'
            }`}
          />
        </button>

        {/* Current State Indicator Strip */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Status:</span>
            {getStatusBadge()}
          </div>

          {/* Pace selector */}
          <div className="relative">
            <button
              onClick={() => setShowPaceMenu(!showPaceMenu)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60"
            >
              <Sliders className="w-3 h-3 text-slate-400" />
              <span className="capitalize">{pace} pace</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {showPaceMenu && (
              <div className="absolute right-0 top-6 w-32 bg-slate-950 border border-slate-800 rounded-md shadow-xl py-1 z-30 text-xs">
                {(['swift', 'standard', 'deliberate'] as PaceMode[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      onChangePace(p);
                      setShowPaceMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 capitalize hover:bg-slate-800 transition-colors ${
                      pace === p ? 'text-sky-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsed State Bar */}
      {isCollapsed ? (
        <div className="px-4 py-2 flex items-center justify-between text-xs bg-slate-950 text-slate-400">
          <span className="truncate max-w-[220px]">
            {isAutonomousOn ? currentTaskTitle || 'Autonomous cycle running...' : 'Assistant Standing By'}
          </span>
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-[11px] text-sky-400 hover:underline"
          >
            Expand
          </button>
        </div>
      ) : (
        /* Full Expanded Assistant Body */
        <div className="p-3.5 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Emergency Stop Alert Banner if Triggered */}
          {isEmergencyStopped && (
            <div className="p-3 bg-red-950/90 border border-red-600 rounded-xl text-xs text-red-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>EMERGENCY STOP TRIGGERED</span>
              </div>
              <p className="text-[11px] text-red-300/90 leading-relaxed">
                All background execution, keystrokes, and file writes were instantly halted.
              </p>
              <button
                onClick={onResetEmergencyStop}
                className="w-full py-1.5 bg-red-800 hover:bg-red-700 text-white rounded text-[11px] font-semibold transition-colors mt-1"
              >
                Reset Emergency Stop & Resume
              </button>
            </div>
          )}

          {/* Destructive Authorization Prompt if Paused */}
          {status === 'PAUSED_FOR_AUTHORIZATION' && (
            <div className="p-3 bg-amber-950/90 border border-amber-600 rounded-xl text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Authorization Required for Destructive Action</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                The next planned action modifies project structure or overwrites existing data. DeskPilot requires authorization before continuing.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onAuthorizeDestructiveAction}
                  className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-[11px]"
                >
                  Authorize Action
                </button>
                <button
                  onClick={onToggleAutonomous}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Active Application & Workspace Box */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <span className="text-slate-400">Target Workspace:</span>
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {detectedApp}
            </span>
          </div>

          {/* Current Autonomous Task Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-sky-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>CURRENT TASK</span>
              </span>
              {activeTaskPlan && (
                <span className="text-slate-400">
                  Stage {activeTaskPlan.currentStageIndex + 1}/9
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-100">
                {currentTaskTitle || 'Awaiting activation...'}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {currentTaskDescription ||
                  'Turn ON the assistant to begin autonomous workspace scanning, task formulation, and verifiable execution.'}
              </p>
            </div>

            {/* Stage Progress Bar */}
            {isAutonomousOn && activeTaskPlan && (
              <div className="space-y-1 pt-1">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full transition-all duration-300"
                    style={{
                      width: `${((activeTaskPlan.currentStageIndex + 1) / 9) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>
                    {activeTaskPlan.stages[activeTaskPlan.currentStageIndex]?.name || 'Working...'}
                  </span>
                  <span>Autonomous Pace</span>
                </div>
              </div>
            )}

            {/* Diff Preview Summary */}
            {currentDiff && (
              <div className="p-2 bg-slate-900 border border-slate-800/80 rounded text-[11px] font-mono text-emerald-300 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">
                  Pending Autonomous Edit
                </div>
                <div className="truncate text-slate-300">{currentDiff.diffSummary}</div>
              </div>
            )}
          </div>

          {/* Persistent Task History */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Autonomous Task History</span>
              </div>

              {taskHistory.length > 0 && (
                <button
                  onClick={onRevertLastTask}
                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  title="Revert last completed task"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Revert Last</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {taskHistory.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-[11px] bg-slate-950/60 rounded-lg border border-slate-800/60">
                  No tasks recorded yet. Completed work will appear here.
                </div>
              ) : (
                taskHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-slate-200 truncate">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {item.app} &middot; {item.resource}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Emergency Stop Shortcut Bar */}
          <div className="pt-1">
            <button
              onClick={onEmergencyStop}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-red-200 bg-red-950/80 hover:bg-red-900 border border-red-700/80 rounded-xl transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>EMERGENCY STOP (Esc / Ctrl+Alt+S)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
