/**
 * Core type definitions for DeskPilot AI Universal Desktop Agent
 */

export type SupportedAppType =
  | 'vscode'
  | 'excel'
  | 'visual_studio'
  | 'trading_chart'
  | 'screenshot_drop'
  | 'projects_registry'
  | 'live_screen';

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
  category:
    | 'Feature'
    | 'Bug Fix'
    | 'Data Cleaning'
    | 'Formulas'
    | 'Refactoring'
    | 'Testing'
    | 'Excel Modeling'
    | 'Reporting & Charts'
    | 'Market Analysis';
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

export interface ExcelGridData {
  title: string;
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
  formulas: Record<string, string>;
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  success: boolean;
  diagnostics: string[];
}

export interface TradingChartAnalysis {
  instrument: string;
  timeframe: string;
  current_price: number;
  market_bias: string;
  support_levels: number[];
  resistance_levels: number[];
  bullish_scenario: string;
  bearish_scenario: string;
  potential_setup: {
    direction: string;
    potential_entry: number;
    invalidation_level: number;
    target_levels: number[];
    risk_reward_ratio: string;
  };
  uncertainties_and_news_risks: string[];
  disclaimer: string;
}

export interface ProjectRegistryItem {
  id: string;
  name: string;
  path: string;
  language: string;
  category: string;
  status: string;
  testStatus: string;
  completedAt: string | null;
  description: string;
}
