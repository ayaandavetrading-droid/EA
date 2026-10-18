import {
  AuditLogItem,
  GoldClosedTradeRecord,
  GoldPositionRecord,
  GoldRiskConfig,
  GoldSystemTelemetry,
  GoldTimeframe,
  MobileTab,
  MT5AccountProfile,
  StrategyItem
} from '../types/apex';

export async function fetchGoldTelemetry(): Promise<GoldSystemTelemetry> {
  const res = await fetch('/api/gold/telemetry');
  if (!res.ok) throw new Error('Failed to fetch gold telemetry');
  return res.json();
}

export async function fetchGoldPositions(): Promise<{
  positions: GoldPositionRecord[];
  tradeHistory: GoldClosedTradeRecord[];
  totalUnrealizedPnL: number;
}> {
  const res = await fetch('/api/gold/positions');
  if (!res.ok) throw new Error('Failed to fetch gold positions');
  return res.json();
}

export async function closeGoldPosition(ticket: number, reason: string = 'Manual Close'): Promise<any> {
  const res = await fetch('/api/gold/close-position', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket, reason }),
  });
  if (!res.ok) throw new Error('Failed to close gold position');
  return res.json();
}

export async function startGoldScanning(): Promise<any> {
  const res = await fetch('/api/gold/start-scanning', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to start autonomous gold scanning');
  return res.json();
}

export async function stopGoldTrading(procedure: 'HALT_NEW_ENTRIES' | 'HALT_AND_CLOSE' = 'HALT_NEW_ENTRIES'): Promise<any> {
  const res = await fetch('/api/gold/stop-trading', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ procedure }),
  });
  if (!res.ok) throw new Error('Failed to pause trading');
  return res.json();
}

export async function triggerGoldEmergencyStop(action: 'HALT_AND_LIQUIDATE' | 'HALT_ENTRIES_ONLY' = 'HALT_AND_LIQUIDATE'): Promise<any> {
  const res = await fetch('/api/gold/emergency-stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to trigger emergency stop');
  return res.json();
}

export async function resetGoldEmergencyStop(): Promise<any> {
  const res = await fetch('/api/gold/reset-emergency-stop', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset circuit breaker');
  return res.json();
}

export async function executeScreenAction(actionType: string, payload?: any): Promise<any> {
  const res = await fetch('/api/gold/screen-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType, payload }),
  });
  if (!res.ok) throw new Error('Failed to execute screen action');
  return res.json();
}

export async function analyzeMobileScreenVision(screenshotBase64: string, userNotes?: string): Promise<any> {
  const res = await fetch('/api/gold/screen-observe-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ screenshotBase64, userNotes }),
  });
  if (!res.ok) throw new Error('Failed to analyze screen vision');
  return res.json();
}

export async function switchGoldAccount(targetLogin: number): Promise<any> {
  const res = await fetch('/api/gold/switch-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetLogin }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to switch account' }));
    throw new Error(err.message || 'Account switch rejected');
  }
  return res.json();
}

export async function fetchGoldStrategies(): Promise<{ strategies: StrategyItem[] }> {
  const res = await fetch('/api/gold/strategies');
  if (!res.ok) throw new Error('Failed to fetch gold strategies');
  return res.json();
}

export async function toggleGoldStrategy(id: number, enabled: boolean): Promise<any> {
  const res = await fetch('/api/gold/toggle-strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, enabled }),
  });
  if (!res.ok) throw new Error('Failed to toggle strategy');
  return res.json();
}

export async function fetchGoldAuditLogs(): Promise<{ logs: AuditLogItem[] }> {
  const res = await fetch('/api/gold/audit-logs');
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function updateGoldRiskConfig(config: any): Promise<any> {
  const res = await fetch('/api/gold/update-risk-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update gold risk config');
  return res.json();
}

export async function setGoldExecutionMode(mode: string, authKey?: string): Promise<any> {
  const res = await fetch('/api/gold/set-mode', {
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

export async function runGoldBacktest(params: {
  symbol?: string;
  months?: number;
  riskPct?: number;
  slippageDollars?: number;
  slippagePoints?: number;
}): Promise<any> {
  const payload = {
    months: params.months ?? 6,
    riskPct: params.riskPct ?? 0.25,
    slippageDollars: params.slippageDollars ?? (params.slippagePoints ? params.slippagePoints / 10 : 0.15),
  };
  const res = await fetch('/api/gold/backtest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to run gold backtest simulation');
  return res.json();
}

// Aliases for compatibility
export const fetchTelemetry = fetchGoldTelemetry;
export const fetchPositions = fetchGoldPositions;
export const closePosition = closeGoldPosition;
export const triggerEmergencyStop = triggerGoldEmergencyStop;
export const resetEmergencyStop = resetGoldEmergencyStop;
export const fetchStrategies = fetchGoldStrategies;
export const toggleStrategy = toggleGoldStrategy;
export const fetchAuditLogs = fetchGoldAuditLogs;
export const updateRiskConfig = updateGoldRiskConfig;
export const setExecutionMode = setGoldExecutionMode;
export const runBacktest = runGoldBacktest;
export const analyzeScreenShot = analyzeMobileScreenVision;
