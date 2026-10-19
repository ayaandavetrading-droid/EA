export type GoldOperationalState =
  | 'DISCONNECTED'
  | 'OBSERVING'
  | 'ANALYZING'
  | 'READY'
  | 'EXECUTING'
  | 'MANAGING POSITION'
  | 'PAUSED'
  | 'EMERGENCY STOP';

export type ExecutionMode = 'DEMO_AUTONOMOUS' | 'MONITOR_ONLY' | 'LIVE_STRICT_CONFIRM';

export type MobileTab = 'QUOTES' | 'CHART' | 'TRADE' | 'HISTORY' | 'SETTINGS';
export type GoldTimeframe = 'M1' | 'M5' | 'M15' | 'H1';

export interface GoldMarketData {
  symbol: string;
  spotPrice: number;
  bid: number;
  ask: number;
  spreadPoints: number;
  spreadDollars: number;
  atr14: number;
  spreadToAtrRatio: number;
  sessionPhase: string;
  regimeName: string;
  regimeUncertainty: number;
  activeStrategyRecommendation: string;
  highImpactNews: {
    title: string;
    timeRemainingMinutes: number;
    impact: string;
    isPreNewsPauseActive: boolean;
  };
}

export interface GoldScreenAgentState {
  connected: boolean;
  device: string;
  activeTab: MobileTab;
  selectedTimeframe: GoldTimeframe;
  zoomLevel: string;
  lastObservedAction: string;
  proposedAction: string;
  verificationStatus: string;
  lastVerifiedTimestamp: string;
}

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
  connected?: boolean;
  pingMs?: number;
  lastSync?: string;
}

export interface GoldRiskConfig {
  riskPerTradePct: number;
  maxDailyLossPct: number;
  maxPeakDrawdownPct: number;
  maxConcurrentGoldTrades: number;
  maxSpreadPoints: number;
  maxSpreadToAtrRatio: number;
  maxConsecutiveLosses: number;
  cooldownMinutes: number;
  minFreeMarginLevel: number;
  equityCompounding: boolean;
  minLotPermitted: number;
}

export interface GoldPositionRecord {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPnL: number;
  pnlDollarsPerOz: number;
  currentR: number;
  breakEvenActivated: boolean;
  trailingActive: boolean;
  strategyName: string;
  regime: string;
  openTime: string;
  comment: string;
}

export interface GoldClosedTradeRecord {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  closePrice: number;
  netProfit: number;
  pnlDollarsPerOz: number;
  resultR: number;
  strategy: string;
  regime: string;
  closeReason: string;
  timestamp: string;
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
  details: string;
}

export interface GoldSystemTelemetry {
  appName: string;
  version: string;
  instrument: string;
  confirmedSymbol: string;
  contractSizeOz: number;
  tickSize: number;
  tickValue: number;
  operationalState: GoldOperationalState;
  mode: ExecutionMode;
  isEmergencyStopped: boolean;
  isPaused: boolean;
  consecutiveLosses: number;
  cooldownUntil: number;
  circuitBreakerTripped: boolean;
  circuitBreakerReason: string;
  market: GoldMarketData;
  account: AccountMetrics;
  screenAgent: GoldScreenAgentState;
  riskConfig: GoldRiskConfig;
  openPositionsCount: number;
  timestamp: string;
}

export interface MT5AccountProfile {
  login: number;
  broker: string;
  server: string;
  type: string;
  balance: number;
  equity: number;
  currency: string;
  isCurrent: boolean;
  goldSymbol: string;
}
