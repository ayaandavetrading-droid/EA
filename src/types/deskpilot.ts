/**
 * Core type definitions for DeskPilot AI
 */

export type SupportedAppType = 'vscode' | 'excel' | 'visual_studio' | 'live_screen';

export type PaceMode = 'swift' | 'standard' | 'deliberate';

export type AutonomousStatusType =
  | 'STOPPED'
  | 'SCANNING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'TESTING'
  | 'COMPLETED'
  | 'PAUSED_FOR_AUTHORIZATION';

export interface TaskHistoryItem {
  id: string;
  title: string;
  app: string;
  resource: string;
  timestamp: string;
  status: string;
  changesSummary?: string;
}

export interface WorkspaceState {
  appType: SupportedAppType;
  appName: string;
  activeResource: string;
  isDirty?: boolean;
  content: string;
  diagnostics: string[];
  selection?: string;
  openFiles?: string[];
}

export interface SuggestedTask {
  id: string;
  title: string;
  description: string;
  category: 'Feature' | 'Bug Fix' | 'Data Cleaning' | 'Formulas' | 'Refactoring' | 'Testing' | 'Excel Modeling' | 'Reporting & Charts';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedSteps: number;
}

export interface WorkflowStage {
  stageNumber: number;
  name: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'failed';
  requiresApproval?: boolean;
}

export interface TaskPlan {
  taskId: string;
  taskTitle: string;
  targetFile: string;
  stages: WorkflowStage[];
  currentStageIndex: number;
  pace: PaceMode;
}

export interface StepDiff {
  stageNumber: number;
  stageName: string;
  explanation: string;
  originalContent: string;
  newContent: string;
  diffSummary: string;
  testCommand?: string;
  suggestedTest?: string;
}

export interface ExcelCellData {
  value: string | number;
  formula?: string;
  formatted?: string;
  isHeader?: boolean;
  hasError?: boolean;
}

export interface ExcelGridData {
  title: string;
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
  formulas: Record<string, string>; // e.g. "G2": "=E2*F2"
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  success: boolean;
  diagnostics: string[];
}
