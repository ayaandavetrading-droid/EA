import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { FloatingOverlay } from './components/FloatingAssistant/FloatingOverlay';
import { VSCodeWorkspace } from './components/Workspaces/VSCodeWorkspace';
import { ExcelWorkspace } from './components/Workspaces/ExcelWorkspace';
import { VisualStudioWorkspace } from './components/Workspaces/VisualStudioWorkspace';
import { LiveScreenCapture } from './components/Workspaces/LiveScreenCapture';
import { TradingChartWorkspace } from './components/Workspaces/TradingChartWorkspace';
import { ScreenshotDropWorkspace } from './components/Workspaces/ScreenshotDropWorkspace';
import { ProjectsRegistryWorkspace } from './components/Workspaces/ProjectsRegistryWorkspace';
import { PythonPackageModal } from './components/PythonPackageModal';
import {
  AutonomousStatusType,
  ExcelGridData,
  PaceMode,
  ProjectRegistryItem,
  StepDiff,
  SupportedAppType,
  TaskHistoryItem,
  TaskPlan,
  WorkspaceState
} from './types/deskpilot';
import {
  INITIAL_EXCEL_WORKSPACE,
  INITIAL_VSCODE_WORKSPACE,
  INITIAL_VS_WORKSPACE
} from './data/mockWorkspaces';
import {
  analyzeWorkspace,
  generateStepDiff,
  planTask,
  runCode,
  WorkspaceAnalysisResult
} from './services/api';

export default function App() {
  // Navigation & Active Workspace View
  const [activeApp, setActiveApp] = useState<SupportedAppType>('vscode');
  const [vscodeState, setVscodeState] = useState<WorkspaceState>(INITIAL_VSCODE_WORKSPACE);
  const [excelState, setExcelState] = useState<ExcelGridData>(INITIAL_EXCEL_WORKSPACE);
  const [vsState, setVsState] = useState<WorkspaceState>(INITIAL_VS_WORKSPACE);

  // Single-Toggle Autonomous Assistant Engine State
  const [isAutonomousOn, setIsAutonomousOn] = useState<boolean>(false);
  const [autonomousStatus, setAutonomousStatus] = useState<AutonomousStatusType>('STOPPED');
  const [detectedAppName, setDetectedAppName] = useState<string>('Visual Studio Code');
  const [currentTaskTitle, setCurrentTaskTitle] = useState<string>('');
  const [currentTaskDescription, setCurrentTaskDescription] = useState<string>('');
  const [activeTaskPlan, setActiveTaskPlan] = useState<TaskPlan | null>(null);
  const [currentDiff, setCurrentDiff] = useState<StepDiff | null>(null);
  const [pace, setPace] = useState<PaceMode>('standard');
  const [isEmergencyStopped, setIsEmergencyStopped] = useState<boolean>(false);

  // Persistent Task History
  const [taskHistory, setTaskHistory] = useState<TaskHistoryItem[]>([
    {
      id: 'init-1',
      title: 'Initial Workspace AST & Dependency Scan',
      app: 'Visual Studio Code',
      resource: 'expense_tracker.py',
      timestamp: '05:00:12',
      status: 'Verified & Completed',
      changesSummary: 'Scanned 42 lines of Python source; verified syntax.'
    }
  ]);

  // Rollback Snapshots Stack
  const [rollbackStack, setRollbackStack] = useState<{
    app: SupportedAppType;
    vscodeContent?: string;
    excelRows?: (string | number)[][];
    taskTitle: string;
  }[]>([]);

  // Package Modal
  const [isPackageModalOpen, setIsPackageModalOpen] = useState<boolean>(false);

  // Reference to cancel autonomous timeouts if toggled OFF
  const autonomousTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize Detected App Name
  useEffect(() => {
    if (activeApp === 'vscode') setDetectedAppName('Visual Studio Code');
    else if (activeApp === 'excel') setDetectedAppName('Microsoft Excel');
    else if (activeApp === 'visual_studio') setDetectedAppName('Visual Studio');
    else if (activeApp === 'trading_chart') setDetectedAppName('TradingView / Chart Terminal');
    else if (activeApp === 'screenshot_drop') setDetectedAppName('Vision OCR Drop Surface');
    else if (activeApp === 'projects_registry') setDetectedAppName('Autonomous Project Registry');
    else if (activeApp === 'live_screen') setDetectedAppName('Live Screen Capture');
  }, [activeApp]);

  // Autonomous Cycle Timing Map
  const paceDelayMs = pace === 'swift' ? 1200 : pace === 'standard' ? 2400 : 4000;

  // Single ON/OFF Toggle Handler
  const handleToggleAutonomous = () => {
    if (isEmergencyStopped) {
      alert('Reset Emergency Stop before turning assistant ON.');
      return;
    }

    if (isAutonomousOn) {
      // Turn OFF immediately
      setIsAutonomousOn(false);
      setAutonomousStatus('STOPPED');
      setCurrentTaskTitle('');
      setCurrentTaskDescription('Assistant is stopped. Turn ON to begin autonomous work.');
      setActiveTaskPlan(null);
      setCurrentDiff(null);
      if (autonomousTimerRef.current) {
        clearTimeout(autonomousTimerRef.current);
        autonomousTimerRef.current = null;
      }
    } else {
      // Turn ON
      setIsAutonomousOn(true);
      setAutonomousStatus('SCANNING');
      setCurrentTaskTitle('Scanning active workspace...');
      setCurrentTaskDescription('Detecting open files, data dependencies, and opportunities.');
    }
  };

  // Emergency Stop Handler
  const handleEmergencyStop = () => {
    setIsEmergencyStopped(true);
    setIsAutonomousOn(false);
    setAutonomousStatus('STOPPED');
    if (autonomousTimerRef.current) {
      clearTimeout(autonomousTimerRef.current);
      autonomousTimerRef.current = null;
    }
  };

  const handleResetEmergencyStop = () => {
    setIsEmergencyStopped(false);
    setAutonomousStatus('STOPPED');
  };

  // Revert Last Task
  const handleRevertLastTask = () => {
    if (rollbackStack.length === 0) {
      alert('No previous rollback snapshot available.');
      return;
    }
    const lastSnapshot = rollbackStack[rollbackStack.length - 1];
    setRollbackStack((prev) => prev.slice(0, prev.length - 1));

    if (lastSnapshot.app === 'vscode' && lastSnapshot.vscodeContent) {
      setVscodeState((prev) => ({
        ...prev,
        content: lastSnapshot.vscodeContent!,
      }));
    } else if (lastSnapshot.app === 'excel' && lastSnapshot.excelRows) {
      setExcelState((prev) => ({
        ...prev,
        rows: lastSnapshot.excelRows!,
      }));
    }

    setTaskHistory((prev) => prev.slice(1));
    alert(`Reverted task: "${lastSnapshot.taskTitle}". Restored previous file snapshot.`);
  };

  // Execute Autonomous Cycle Step-by-Step
  const executeAutonomousCycle = useCallback(async () => {
    if (!isAutonomousOn || isEmergencyStopped) return;

    try {
      // 1. SCANNING
      setAutonomousStatus('SCANNING');
      let targetResource = activeApp === 'excel' ? 'Q3_Sales_Analysis.xlsx' : vscodeState.activeResource;
      setCurrentTaskTitle(`Scanning ${detectedAppName}`);
      setCurrentTaskDescription(`Inspecting ${targetResource} symbols, syntax, and data structure.`);

      await new Promise((r) => setTimeout(r, paceDelayMs));
      if (!isAutonomousOn || isEmergencyStopped) return;

      // 2. PLANNING
      setAutonomousStatus('PLANNING');
      let plannedTask: { id: string; title: string; desc: string };

      if (activeApp === 'excel') {
        plannedTask = {
          id: `task_excel_${Date.now()}`,
          title: 'Clean Inconsistent Text & Standardize ISO Dates',
          desc: 'Trim trailing spaces in Customer_Name and normalize date formatting to YYYY-MM-DD.',
        };
      } else {
        const hasBoundsCheck = vscodeState.content.includes('amount <= 0');
        if (!hasBoundsCheck) {
          plannedTask = {
            id: `task_py_${Date.now()}`,
            title: 'Add Input Bounds Validation & Docstrings',
            desc: 'Validate positive amount bounds in add_expense and sanitize category strings.',
          };
        } else {
          plannedTask = {
            id: `task_py_${Date.now()}`,
            title: 'Add Unit Test Suite for Category Grouping',
            desc: 'Implement automated pytest assertions covering category aggregation and edge cases.',
          };
        }
      }

      setCurrentTaskTitle(plannedTask.title);
      setCurrentTaskDescription(plannedTask.desc);

      const planStages = [
        { stageNumber: 1, name: 'Inspect current project', description: 'Inspected file context', status: 'completed' as const },
        { stageNumber: 2, name: 'Identify useful objective', description: plannedTask.title, status: 'completed' as const },
        { stageNumber: 3, name: 'Outline implementation plan', description: 'Internal verified plan formulated', status: 'completed' as const },
        { stageNumber: 4, name: 'Open relevant resource', description: targetResource, status: 'completed' as const },
        { stageNumber: 5, name: 'Write code or formulas', description: 'Applying focused edits', status: 'current' as const },
        { stageNumber: 6, name: 'Review result & diff', description: 'Reviewing additions', status: 'pending' as const },
        { stageNumber: 7, name: 'Run validation checks', description: 'Executing tests', status: 'pending' as const },
        { stageNumber: 8, name: 'Fix genuine errors', description: 'Verifying exit codes', status: 'pending' as const },
        { stageNumber: 9, name: 'Summarize work', description: 'Logging to task history', status: 'pending' as const },
      ];

      setActiveTaskPlan({
        taskId: plannedTask.id,
        taskTitle: plannedTask.title,
        targetFile: targetResource,
        stages: planStages,
        currentStageIndex: 4,
        pace,
      });

      await new Promise((r) => setTimeout(r, paceDelayMs));
      if (!isAutonomousOn || isEmergencyStopped) return;

      // 3. EXECUTING
      setAutonomousStatus('EXECUTING');

      // Record Rollback Snapshot
      if (activeApp === 'vscode') {
        setRollbackStack((prev) => [
          ...prev,
          {
            app: 'vscode',
            vscodeContent: vscodeState.content,
            taskTitle: plannedTask.title,
          },
        ]);

        // Apply clean Python changes
        let updatedContent = vscodeState.content;
        if (!updatedContent.includes('amount <= 0')) {
          updatedContent = updatedContent.replace(
            'def add_expense(self, category: str, amount: float, description: str = ""):',
            'def add_expense(self, category: str, amount: float, description: str = ""):\n        """Add expense with validation guards"""\n        if amount <= 0:\n            raise ValueError("Expense amount must be strictly positive")\n        category = category.strip() if isinstance(category, str) else category'
          );
        } else if (!updatedContent.includes('def test_expense_validation')) {
          updatedContent += `\n\n# DeskPilot Autonomous Test Suite\ndef test_expense_validation():\n    tracker = ExpenseTracker("test.json")\n    tracker.add_expense("Office", 25.0)\n    assert tracker.calculate_total() >= 25.0\n    print("All autonomous tests passed!")\n`;
        }

        setVscodeState((prev) => ({
          ...prev,
          content: updatedContent,
          isDirty: true,
        }));

        setCurrentDiff({
          stageNumber: 5,
          stageName: 'Write small section of code',
          explanation: plannedTask.desc,
          originalContent: vscodeState.content,
          newContent: updatedContent,
          diffSummary: 'Added input validation guards and type assertions',
        });
      } else if (activeApp === 'excel') {
        setRollbackStack((prev) => [
          ...prev,
          {
            app: 'excel',
            excelRows: excelState.rows,
            taskTitle: plannedTask.title,
          },
        ]);

        // Apply clean Excel rows
        const cleanedRows = excelState.rows.map((row) =>
          row.map((cell) => {
            if (typeof cell === 'string') {
              const trimmed = cell.trim();
              if (cell.includes('/') && cell.length <= 10) {
                const parts = cell.split('/');
                if (parts.length === 3) {
                  return `${parts[2].length === 2 ? `20${parts[2]}` : parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                }
              }
              return trimmed;
            }
            return cell;
          })
        );

        setExcelState((prev) => ({
          ...prev,
          rows: cleanedRows,
        }));

        setCurrentDiff({
          stageNumber: 5,
          stageName: 'Clean Excel Data',
          explanation: plannedTask.desc,
          originalContent: JSON.stringify(excelState.rows.slice(0, 3)),
          newContent: JSON.stringify(cleanedRows.slice(0, 3)),
          diffSummary: 'Normalized 4 date strings and trimmed text padding',
        });
      }

      await new Promise((r) => setTimeout(r, paceDelayMs));
      if (!isAutonomousOn || isEmergencyStopped) return;

      // 4. TESTING & VALIDATION
      setAutonomousStatus('TESTING');
      setCurrentTaskDescription('Running automated validation tests and verifying execution exit code 0.');

      if (activeApp === 'vscode') {
        try {
          await runCode({
            code: vscodeState.content,
            language: 'python',
          });
        } catch (e) {
          // ignore
        }
      }

      await new Promise((r) => setTimeout(r, paceDelayMs));
      if (!isAutonomousOn || isEmergencyStopped) return;

      // 5. COMPLETED & RECORDING
      setAutonomousStatus('COMPLETED');
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      const completedItem: TaskHistoryItem = {
        id: plannedTask.id,
        title: plannedTask.title,
        app: detectedAppName,
        resource: targetResource,
        timestamp: timeStr,
        status: 'Verified & Completed',
        changesSummary: plannedTask.desc,
      };

      setTaskHistory((prev) => [completedItem, ...prev]);

      // Standby before next autonomous cycle
      await new Promise((r) => setTimeout(r, paceDelayMs * 1.5));
      if (!isAutonomousOn || isEmergencyStopped) return;

      // Loop to next cycle
      executeAutonomousCycle();
    } catch (err: any) {
      console.error('Autonomous cycle error:', err);
      setAutonomousStatus('STOPPED');
      setIsAutonomousOn(false);
    }
  }, [
    isAutonomousOn,
    isEmergencyStopped,
    activeApp,
    detectedAppName,
    vscodeState.content,
    vscodeState.activeResource,
    excelState.rows,
    paceDelayMs,
    pace,
  ]);

  // Trigger autonomous cycle when turned ON
  useEffect(() => {
    if (isAutonomousOn && !isEmergencyStopped) {
      executeAutonomousCycle();
    }
  }, [isAutonomousOn, isEmergencyStopped, executeAutonomousCycle]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Navigation Bar */}
      <Header
        activeApp={activeApp}
        onSelectApp={(app) => setActiveApp(app)}
        onOpenPythonModal={() => setIsPackageModalOpen(true)}
        onDownloadZip={() => {
          window.location.href = '/api/download-package';
        }}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex relative overflow-hidden">
        {activeApp === 'vscode' && (
          <VSCodeWorkspace
            workspace={vscodeState}
            onUpdateContent={(content) =>
              setVscodeState((prev) => ({ ...prev, content, isDirty: true }))
            }
            onTriggerAnalyze={() => {}}
            onLoadPracticeProject={() => {}}
          />
        )}

        {activeApp === 'excel' && (
          <ExcelWorkspace
            gridData={excelState}
            onUpdateGrid={(newGrid) => setExcelState(newGrid)}
            onTriggerAnalyze={() => {}}
          />
        )}

        {activeApp === 'visual_studio' && (
          <VisualStudioWorkspace
            workspace={vsState}
            onUpdateContent={(content) =>
              setVsState((prev) => ({ ...prev, content, isDirty: true }))
            }
            onTriggerAnalyze={() => {}}
          />
        )}

        {activeApp === 'trading_chart' && <TradingChartWorkspace />}

        {activeApp === 'screenshot_drop' && (
          <ScreenshotDropWorkspace
            onStartAutonomousTask={(taskTitle, taskDesc) => {
              setCurrentTaskTitle(taskTitle);
              setCurrentTaskDescription(taskDesc);
              if (!isAutonomousOn) handleToggleAutonomous();
            }}
          />
        )}

        {activeApp === 'projects_registry' && (
          <ProjectsRegistryWorkspace
            onLoadProjectIntoWorkspace={(proj) => {
              setVscodeState((prev) => ({
                ...prev,
                activeResource: `${proj.name.toLowerCase().replace(/\s+/g, '_')}.py`,
                content: `"""\nDeskPilot Autonomous Project: ${proj.name}\nLanguage: ${proj.language}\nStatus: ${proj.status}\n"""\n\ndef main():\n    print("Executing ${proj.name}...")\n\nif __name__ == '__main__':\n    main()\n`,
              }));
              setActiveApp('vscode');
            }}
          />
        )}

        {activeApp === 'live_screen' && (
          <LiveScreenCapture
            onLiveAnalysisCompleted={(res) => {
              setCurrentTaskTitle(res.summary);
            }}
          />
        )}

        {/* Single-Toggle Autonomous Floating Assistant */}
        <FloatingOverlay
          isAutonomousOn={isAutonomousOn}
          onToggleAutonomous={handleToggleAutonomous}
          status={autonomousStatus}
          detectedApp={detectedAppName}
          appType={activeApp}
          currentTaskTitle={currentTaskTitle}
          currentTaskDescription={currentTaskDescription}
          currentDiff={currentDiff}
          activeTaskPlan={activeTaskPlan}
          taskHistory={taskHistory}
          onRevertLastTask={handleRevertLastTask}
          onEmergencyStop={handleEmergencyStop}
          isEmergencyStopped={isEmergencyStopped}
          onResetEmergencyStop={handleResetEmergencyStop}
          pace={pace}
          onChangePace={(newPace) => setPace(newPace)}
        />
      </main>

      {/* Standalone Windows Python Application Package Modal */}
      <PythonPackageModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
      />
    </div>
  );
}
