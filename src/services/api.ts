import {
  AuditLogItem,
  ClosedTradeRecord,
  PositionRecord,
  ScannedSymbolItem,
  StrategyItem,
  SystemTelemetry
} from '../types/apex';

export async function fetchTelemetry(): Promise<SystemTelemetry> {
  const res = await fetch('/api/mt5/telemetry');
  if (!res.ok) throw new Error('Failed to fetch telemetry');
  return res.json();
}

export async function fetchPositions(): Promise<{
  positions: PositionRecord[];
  tradeHistory: ClosedTradeRecord[];
  totalUnrealizedPnL: number;
}> {
  const res = await fetch('/api/mt5/positions');
  if (!res.ok) throw new Error('Failed to fetch positions');
  return res.json();
}

export async function closePosition(ticket: number, reason: string = 'Manual Dashboard Close'): Promise<any> {
  const res = await fetch('/api/mt5/close-position', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket, reason }),
  });
  if (!res.ok) throw new Error('Failed to close position');
  return res.json();
}

export async function triggerEmergencyStop(action: 'HALT_AND_LIQUIDATE' | 'HALT_ENTRIES_ONLY' = 'HALT_AND_LIQUIDATE'): Promise<any> {
  const res = await fetch('/api/mt5/emergency-stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to trigger emergency stop');
  return res.json();
}

export async function resetEmergencyStop(): Promise<any> {
  const res = await fetch('/api/mt5/reset-emergency-stop', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset circuit breaker');
  return res.json();
}

export async function fetchScanner(): Promise<{
  symbols: ScannedSymbolItem[];
  scannedCount: number;
  approvedCount: number;
}> {
  const res = await fetch('/api/mt5/scanner');
  if (!res.ok) throw new Error('Failed to fetch scanner matrix');
  return res.json();
}

export async function fetchStrategies(): Promise<{ strategies: StrategyItem[] }> {
  const res = await fetch('/api/mt5/strategies');
  if (!res.ok) throw new Error('Failed to fetch strategies');
  return res.json();
}

export async function toggleStrategy(id: number, enabled: boolean): Promise<any> {
  const res = await fetch('/api/mt5/toggle-strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, enabled }),
  });
  if (!res.ok) throw new Error('Failed to toggle strategy');
  return res.json();
}

export async function setExecutionMode(mode: string, authKey?: string): Promise<any> {
  const res = await fetch('/api/mt5/set-mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, authKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to set mode' }));
    throw new Error(err.message || 'Mode switch failed');
  }
  return res.json();
}

export async function fetchAuditLogs(): Promise<{ logs: AuditLogItem[] }> {
  const res = await fetch('/api/mt5/audit-logs');
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function updateRiskConfig(config: any): Promise<any> {
  const res = await fetch('/api/mt5/update-risk-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update risk parameters');
  return res.json();
}

export async function analyzeScreenShot(screenshotBase64: string, userNotes?: string): Promise<any> {
  const res = await fetch('/api/mt5/screen-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ screenshotBase64, userNotes }),
  });
  if (!res.ok) throw new Error('Failed to analyze screenshot');
  return res.json();
}

export async function runBacktest(params: {
  symbol: string;
  months: number;
  riskPct: number;
  slippagePoints: number;
}): Promise<any> {
  const res = await fetch('/api/mt5/backtest-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to run backtest simulation');
  return res.json();
}
