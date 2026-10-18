import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CockpitTab } from './components/CockpitTab';
import { ScannerTab } from './components/ScannerTab';
import { StrategyDeckTab } from './components/StrategyDeckTab';
import { RiskFortressTab } from './components/RiskFortressTab';
import { VisionInspectorTab } from './components/VisionInspectorTab';
import { BacktestLabTab } from './components/BacktestLabTab';
import { DeploymentTab } from './components/DeploymentTab';
import {
  Activity,
  Radar,
  Layers,
  ShieldAlert,
  Eye,
  BarChart3,
  Download,
  Terminal,
  RefreshCw
} from 'lucide-react';
import {
  AuditLogItem,
  ClosedTradeRecord,
  ExecutionMode,
  PositionRecord,
  RiskConfig,
  ScannedSymbolItem,
  StrategyItem,
  SystemTelemetry
} from './types/apex';
import {
  closePosition,
  fetchAuditLogs,
  fetchPositions,
  fetchScanner,
  fetchStrategies,
  fetchTelemetry,
  resetEmergencyStop,
  setExecutionMode,
  toggleStrategy,
  triggerEmergencyStop,
  updateRiskConfig
} from './services/api';

type TabKey = 'cockpit' | 'scanner' | 'strategies' | 'risk' | 'vision' | 'backtest' | 'deployment';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('cockpit');
  const [appName, setAppName] = useState<string>('Apex AI Trader');

  // Application Data States
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [positions, setPositions] = useState<PositionRecord[]>([]);
  const [tradeHistory, setTradeHistory] = useState<ClosedTradeRecord[]>([]);
  const [scannerSymbols, setScannerSymbols] = useState<ScannedSymbolItem[]>([]);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Polling data function
  const refreshData = useCallback(async () => {
    try {
      const [tel, pos, scan, strats, logs] = await Promise.all([
        fetchTelemetry().catch(() => null),
        fetchPositions().catch(() => ({ positions: [], tradeHistory: [], totalUnrealizedPnL: 0 })),
        fetchScanner().catch(() => ({ symbols: [], scannedCount: 0, approvedCount: 0 })),
        fetchStrategies().catch(() => ({ strategies: [] })),
        fetchAuditLogs().catch(() => ({ logs: [] })),
      ]);

      if (tel) {
        setTelemetry(tel);
        if (tel.appName && appName === 'Apex AI Trader') setAppName(tel.appName);
      }
      if (pos) {
        setPositions(pos.positions);
        setTradeHistory(pos.tradeHistory);
      }
      if (scan) {
        setScannerSymbols(scan.symbols);
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
      await triggerEmergencyStop(action);
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger emergency stop');
    }
  };

  const handleResetEmergencyStop = async () => {
    try {
      await resetEmergencyStop();
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset emergency stop');
    }
  };

  const handleModeChange = async (mode: ExecutionMode, authKey?: string) => {
    await setExecutionMode(mode, authKey);
    await refreshData();
  };

  const handleClosePosition = async (ticket: number) => {
    try {
      await closePosition(ticket, 'User Dashboard Close');
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to close position');
    }
  };

  const handleToggleStrategy = async (id: number, enabled: boolean) => {
    try {
      await toggleStrategy(id, enabled);
      setStrategies((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle strategy');
    }
  };

  const handleUpdateRiskConfig = async (newConfig: RiskConfig) => {
    try {
      await updateRiskConfig(newConfig);
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update risk parameters');
    }
  };

  const handleRenameApp = (newName: string) => {
    setAppName(newName);
  };

  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { key: 'cockpit', label: 'Cockpit & Trades', icon: Activity, count: positions.length },
    { key: 'scanner', label: 'Market Scanner', icon: Radar, count: scannerSymbols.filter((s) => s.passesRiskFilters).length },
    { key: 'strategies', label: '15 Strategy Library', icon: Layers, count: strategies.filter((s) => s.enabled).length },
    { key: 'risk', label: 'Risk Fortress', icon: ShieldAlert },
    { key: 'vision', label: 'Visual AI Inspector', icon: Eye },
    { key: 'backtest', label: 'Backtest & Monte Carlo', icon: BarChart3 },
    { key: 'deployment', label: 'MQL5 EA Package & Docs', icon: Download },
  ];

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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 overflow-x-auto gap-2">
          <nav className="flex space-x-1 lg:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 font-bold'
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
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab View Contents */}
        {activeTab === 'cockpit' && (
          <CockpitTab
            telemetry={telemetry}
            positions={positions}
            tradeHistory={tradeHistory}
            auditLogs={auditLogs}
            onClosePosition={handleClosePosition}
          />
        )}

        {activeTab === 'scanner' && <ScannerTab symbols={scannerSymbols} />}

        {activeTab === 'strategies' && (
          <StrategyDeckTab strategies={strategies} onToggleStrategy={handleToggleStrategy} />
        )}

        {activeTab === 'risk' && telemetry && (
          <RiskFortressTab
            riskConfig={telemetry.riskConfig}
            onUpdateRiskConfig={handleUpdateRiskConfig}
          />
        )}

        {activeTab === 'vision' && <VisionInspectorTab />}

        {activeTab === 'backtest' && <BacktestLabTab />}

        {activeTab === 'deployment' && <DeploymentTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-600 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{appName} • Autonomous MT5 Algorithmic Scalping System • Local Native Safety Core</span>
          <span>Capital Preservation First • Hard ATR Stops • Zero Martingale</span>
        </div>
      </footer>
    </div>
  );
}
