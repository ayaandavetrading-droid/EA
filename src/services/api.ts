import { ExecutionResult, StepDiff, SuggestedTask, WorkflowStage } from '../types/deskpilot';

export interface WorkspaceAnalysisResult {
  detectedApp: string;
  summary: string;
  languageOrType: string;
  openResource: string;
  visibleHighlights: string[];
  suggestedTasks: SuggestedTask[];
  practiceProjectIdea?: {
    title: string;
    description: string;
    starterFile: string;
  };
}

export async function analyzeWorkspace(params: {
  appType: string;
  fileOrSheet: string;
  content: string;
  errors?: string[];
  selection?: string;
}): Promise<WorkspaceAnalysisResult> {
  const res = await fetch('/api/analyze-workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze workspace');
  }

  return res.json();
}

export async function planTask(params: {
  task: SuggestedTask;
  workspaceContext: any;
}): Promise<{ stages: WorkflowStage[]; targetFile: string }> {
  const res = await fetch('/api/plan-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to plan task');
  }

  return res.json();
}

export async function generateStepDiff(params: {
  task: SuggestedTask;
  stageNumber: number;
  stageName: string;
  currentContent: string;
  language?: string;
}): Promise<StepDiff> {
  const res = await fetch('/api/generate-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate step diff');
  }

  return res.json();
}

export async function runCode(params: {
  code: string;
  testCode?: string;
  language?: string;
}): Promise<ExecutionResult> {
  const res = await fetch('/api/run-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Execution failed');
  }

  return res.json();
}

export async function requestExcelAssist(params: {
  action: 'explain_formula' | 'generate_formula' | 'clean_data' | 'generate_summary' | 'audit_sheet';
  sheetData: any;
  selectedRange?: string;
  prompt?: string;
}): Promise<any> {
  const res = await fetch('/api/excel-assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Excel assistance failed');
  }

  return res.json();
}

export function downloadPythonPackageUrl(): string {
  return '/api/download-package';
}
