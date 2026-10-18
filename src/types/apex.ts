export type ExecutionMode = 'SCAN_ONLY' | 'PAPER_SIMULATION' | 'DEMO_EXECUTION' | 'LIVE_STRICT_AUTH';

export interface AccountMetrics {
  login: number;
  broker: string;
  server: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  dailyPnL: number;
  dailyPnLPct: number;
  weeklyPnL: number;
  weeklyPnLPct: number;
  peakEquity: number;
  currentDrawdownPct: number;
  maxDrawdownPct: number;
}

export interface RiskConfig {
  maxRiskPerTradePct: number;
  maxTotalOpenRiskPct: number;
  maxDailyLossPct: number;
  maxWeeklyLossPct: number;
  maxPeakDrawdownPct: number;
  minFreeMarginLevel: number;
  maxSpreadPoints: number;
  maxSpreadToAtrRatio: number;
  maxSimultaneousTrades: number;
  maxTradesPerSymbol: number;
  maxCorrelatedCurrency: number;
  maxConsecutiveLosses: number;
  cooldownMinutes: number;
  equityCompounding: boolean;
  minLotPermitted: number;
}

export interface PositionRecord {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPnL: number;
  pnlPips: number;
  currentR: number;
  breakEvenActivated: boolean;
  trailingActive: boolean;
  strategyName: string;
  regime: string;
  openTime: string;
  comment: string;
}

export interface ClosedTradeRecord {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  closePrice: number;
  netProfit: number;
  pnlPips: number;
  resultR: number;
  strategy: string;
  regime: string;
  closeReason: string;
  timestamp: string;
}

export interface ScannedSymbolItem {
  symbol: string;
  bid: number;
  ask: number;
  spreadPoints: number;
  spreadCostUSD: number;
  atr14: number;
  spreadToAtrRatio: number;
  regime: string;
  regimeKey: string;
  uncertainty: number;
  bestStrategy: string;
  action: string;
  opportunityScore: number;
  passesRiskFilters: boolean;
  riskNotes: string;
}

export interface StrategyItem {
  id: number;
  name: string;
  category: string;
  enabled: boolean;
  winRate: number;
  profitFactor: number;
  tradesCount: number;
  avgRR: number;
  timeframe: string;
  indicators: string;
  description: string;
  failureMode: string;
  costSensitivity: string;
}

export interface AuditLogItem {
  timestamp: string;
  symbol: string;
  event: string;
  strategy: string;
  regime: string;
  details: string;
}

export interface SystemTelemetry {
  appName: string;
  version: string;
  mode: ExecutionMode;
  isEmergencyStopped: boolean;
  isPaused: boolean;
  consecutiveLosses: number;
  cooldownUntil: number;
  circuitBreakerTripped: boolean;
  circuitBreakerReason: string;
  account: AccountMetrics;
  riskConfig: RiskConfig;
  connection: {
    terminalConnected: boolean;
    terminalVersion: string;
    pingMs: number;
    lastHeartbeat: number;
    eaStatus: string;
  };
  openPositionsCount: number;
}
