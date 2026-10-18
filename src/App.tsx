import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { OneTapGoldTrader } from './components/OneTapGoldTrader';
import { CockpitTab } from './components/CockpitTab';
import { PhoneScreenAgentTab } from './components/PhoneScreenAgentTab';
import { StrategyDeckTab } from './components/StrategyDeckTab';
import { RiskFortressTab } from './components/RiskFortressTab';
import { BacktestLabTab } from './components/BacktestLabTab';
import { DeploymentTab } from './components/DeploymentTab';
import { SetupGuideModal } from './components/SetupGuideModal';
import {
  Smartphone,
  Activity,
  Layers,
  ShieldAlert,
  BarChart3,
  Download,
  RefreshCw,
  Coins,
  Zap
} from 'lucide-react';
import {
  AuditLogItem,
  ExecutionMode,
  GoldClosedTradeRecord,
  GoldPositionRecord,
  GoldRiskConfig,
  GoldSystemTelemetry,
  StrategyItem
} from './types/apex';
import {
  closeGoldPosition,
  fetchGoldAuditLogs,
  fetchGoldPositions,
  fetchGoldStrategies,
  fetchGoldTelemetry,
  resetGoldEmergencyStop,
  setGoldExecutionMode,
  toggleGoldStrategy,
  triggerGoldEmergencyStop,
  updateGoldRiskConfig
} from './services/api';

type TabKey = 'onetap' | 'phone' | 'cockpit' | 'strategies' | 'risk' | 'backtest' | 'deployment';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('onetap');
  const [appName, setAppName] = useState<string>('Apex Gold AI');
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState<boolean>(false);

  // Application Data States
  const [telemetry, setTelemetry] = useState<GoldSystemTelemetry | null>(null);
  const [positions, setPositions] = useState<GoldPositionRecord[]>([]);
  const [tradeHistory, setTradeHistory] = useState<GoldClosedTradeRecord[]>([]);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Polling data function
  const refreshData = useCallback(async () => {
    try {
      const [tel, pos, strats, logs] = await Promise.all([
        fetchGoldTelemetry().catch(() => null),
        fetchGoldPositions().catch(() => ({ positions: [], tradeHistory: [], totalUnrealizedPnL: 0 })),
        fetchGoldStrategies().catch(() => ({ strategies: [] })),
        fetchGoldAuditLogs().catch(() => ({ logs: [] })),
      ]);

      if (tel) {
        setTelemetry(tel);
        if (tel.appName && appName === 'Apex Gold AI') setAppName(tel.appName);
      }
      if (pos) {
        setPositions(pos.positions);
        setTradeHistory(pos.tradeHistory);
      }
      if (strats) {
        setStrategies(strats.strategies);
      }
      if (logs) {
        setAuditLogs(logs.logs);
      }
    } catch (err) {
      console.warn('Telemetry refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [appName]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Handlers
  const handleEmergencyStop = async (action: 'HALT_AND_LIQUIDATE' | 'HALT_ENTRIES_ONLY') => {
    try {
      await triggerGoldEmergencyStop(action);
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger emergency stop');
    }
  };

  const handleResetEmergencyStop = async () => {
    try {
      await resetGoldEmergencyStop();
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset emergency stop');
    }
  };

  const handleModeChange = async (mode: ExecutionMode, authKey?: string) => {
    await setGoldExecutionMode(mode, authKey);
    await refreshData();
  };

  const handleClosePosition = async (ticket: number) => {
    try {
      await closeGoldPosition(ticket, 'User Dashboard Close');
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to close gold position');
    }
  };

  const handleToggleStrategy = async (id: number, enabled: boolean) => {
    try {
      await toggleGoldStrategy(id, enabled);
      setStrategies((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle strategy');
    }
  };

  const handleUpdateRiskConfig = async (newConfig: GoldRiskConfig) => {
    try {
      await updateGoldRiskConfig(newConfig);
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update gold risk parameters');
    }
  };

  const handleRenameApp = (newName: string) => {
    setAppName(newName);
  };

  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { key: 'onetap', label: 'One-Tap Trader', icon: Zap },
    { key: 'phone', label: 'Phone Screen Agent', icon: Smartphone },
    { key: 'cockpit', label: 'Gold Cockpit', icon: Activity, count: positions.length },
    { key: 'strategies', label: '12 Strategies', icon: Layers, count: strategies.filter((s) => s.enabled).length },
    { key: 'risk', label: 'Risk Fortress', icon: ShieldAlert },
    { key: 'backtest', label: 'Backtest Lab', icon: BarChart3 },
    { key: 'deployment', label: 'MQL5 EA & VPS', icon: Download },
  ];

  const defaultScreenAgent = {
    connected: true,
    device: 'iPhone 15 Pro / iOS 18 (MT5 Mobile)',
    activeTab: 'CHART' as const,
    selectedTimeframe: 'M5' as const,
    zoomLevel: 'STANDARD_LATEST',
    lastObservedAction: 'Observed M5 Gold Chart: Retesting 21 EMA support ($2,725.50)',
    proposedAction: 'Maintain position monitoring; dynamic break-even armed at $2,726.00',
    verificationStatus: 'Screen verified: Symbol is XAUUSD, account intact',
    lastVerifiedTimestamp: new Date().toLocaleTimeString(),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Universal Top Header */}
      <Header
        telemetry={telemetry}
        onEmergencyStop={handleEmergencyStop}
        onResetEmergencyStop={handleResetEmergencyStop}
        onModeChange={handleModeChange}
        appName={appName}
        onRenameApp={handleRenameApp}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-5">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 overflow-x-auto gap-2">
          <nav className="flex space-x-1 sm:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-slate-950 text-amber-400 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <button
            onClick={refreshData}
            title="Refresh market data"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Primary One-Tap Mobile Experience */}
        {activeTab === 'onetap' && (
          <OneTapGoldTrader
            telemetry={telemetry}
            positions={positions}
            onRefresh={refreshData}
            onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
          />
        )}

        {/* 2. Phone Screen Agent Simulator & Multimodal Inspector */}
        {activeTab === 'phone' && (
          <PhoneScreenAgentTab
            screenAgent={telemetry?.screenAgent || defaultScreenAgent}
            operationalState={telemetry?.operationalState || 'READY'}
            spotPrice={telemetry?.market?.spotPrice || 2727.35}
            openPositions={positions}
            onRefresh={refreshData}
          />
        )}

        {/* 3. Gold Cockpit & Trades */}
        {activeTab === 'cockpit' && (
          <CockpitTab
            telemetry={telemetry}
            positions={positions}
            tradeHistory={tradeHistory}
            auditLogs={auditLogs}
            onClosePosition={handleClosePosition}
          />
        )}

        {/* 4. Strategy Deck */}
        {activeTab === 'strategies' && (
          <StrategyDeckTab strategies={strategies} onToggleStrategy={handleToggleStrategy} />
        )}

        {/* 5. Risk Fortress */}
        {activeTab === 'risk' && telemetry && (
          <RiskFortressTab
            riskConfig={telemetry.riskConfig}
            onUpdateRiskConfig={handleUpdateRiskConfig}
          />
        )}

        {/* 6. Backtest Lab */}
        {activeTab === 'backtest' && <BacktestLabTab />}

        {/* 7. MQL5 Deployment & VPS */}
        {activeTab === 'deployment' && <DeploymentTab />}
      </main>

      {/* Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 justify-center">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <strong className="text-slate-300">{appName}</strong> • Autonomous XAUUSD Scalping Agent • Native MQL5 Core
          </span>
          <span>Capital Preservation First • Hard ATR Stop-Loss • Non-Gold Execution Blocked</span>
        </div>
      </footer>
    </div>
  );
}
