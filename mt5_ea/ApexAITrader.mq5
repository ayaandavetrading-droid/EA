//+------------------------------------------------------------------+
//|                                                ApexAITrader.mq5  |
//|                                  Apex AI Trader Autonomous Bot   |
//|               Professional AI MT5 Algorithmic Scalping System    |
//+------------------------------------------------------------------+
#property copyright "Apex AI Quantitative Team"
#property link      "https://apexaitrader.internal"
#property version   "1.00"
#property description "Autonomous AI MT5 Scalping Bot with Multi-Regime Strategy Framework and Hard Risk Preservation."

//--- Required MetaTrader 5 Trading Libraries
#include <Trade\Trade.mqh>
#include "Include\Apex\RiskManager.mqh"
#include "Include\Apex\StopManager.mqh"
#include "Include\Apex\TradeExecution.mqh"
#include "Include\Apex\MarketScanner.mqh"
#include "Include\Apex\RegimeDetector.mqh"
#include "Include\Apex\StrategyLibrary.mqh"
#include "Include\Apex\AuditLogger.mqh"
#include "Include\Apex\WebBridge.mqh"

//--- Execution Mode Enumeration
enum ENUM_EXECUTION_MODE
{
   EXEC_MODE_SCAN_ONLY = 0,      // Scan market and report only (no orders)
   EXEC_MODE_PAPER_SIMULATION,   // Virtual simulation mode
   EXEC_MODE_DEMO_EXECUTION,     // Real demo account execution
   EXEC_MODE_LIVE_STRICT_AUTH    // Live account execution (strictly requires confirmation key)
};

//+------------------------------------------------------------------+
//| INPUT PARAMETERS WITH CONSERVATIVE DEFAULTS                      |
//+------------------------------------------------------------------+
input group "=== 1. Core Operating Settings ==="
input string               InpAppWorkingName          = "Apex AI Trader"; // Application Title
input ulong                InpMagicNumber             = 100991;           // EA Magic Identification Number
input ENUM_EXECUTION_MODE  InpExecutionMode           = EXEC_MODE_DEMO_EXECUTION; // Execution Mode
input string               InpLiveAuthorizationKey    = "";               // Mandatory Safety Key for Live Execution
input string               InpScanSymbolsList         = "EURUSD,GBPUSD,USDJPY,AUDUSD,USDCAD,USDCHF,NZDUSD,EURJPY,GBPJPY,XAUUSD,BTCUSD"; // Symbols Matrix

input group "=== 2. Capital & Hard Risk Preservation ==="
input double               InpMaxRiskPerTradePct      = 0.75;             // Max Risk Per Trade (% of Equity)
input double               InpMaxTotalOpenRiskPct     = 3.00;             // Max Cumulative Risk (% of Equity)
input double               InpMaxDailyLossPct         = 2.00;             // Daily Loss Circuit Breaker (%)
input double               InpMaxWeeklyLossPct        = 5.00;             // Weekly Loss Circuit Breaker (%)
input double               InpMaxPeakDrawdownPct      = 5.00;             // Max Peak-to-Trough Drawdown (%)
input double               InpMinFreeMarginLevel      = 250.0;            // Minimum Margin Level (%)
input int                  InpMaxSpreadPoints         = 25;               // Max Allowable Spread (Points)
input double               InpMaxSpreadToAtrRatio     = 0.20;             // Max Spread / ATR Ratio (Cost Gate)
input int                  InpMaxSimultaneousTrades   = 3;                // Max Concurrent Positions Total
input int                  InpMaxTradesPerSymbol      = 1;                // Max Concurrent Positions Per Symbol
input int                  InpMaxCorrelatedCurrency   = 2;                // Max Correlated Currency Exposure
input int                  InpMaxConsecutiveLosses    = 3;                // Consecutive Losses Cooldown Trigger
input int                  InpCooldownMinutes         = 90;               // Cooldown Duration (Minutes)
input bool                 InpEquityCompounding       = true;             // Equity Compounding Sizing (vs Balance)

input group "=== 3. Stop-Loss & Take-Profit Governance ==="
input double               InpAtrMultiplierSL         = 1.50;             // ATR Multiplier for Stop Loss
input double               InpAtrMultiplierTP         = 2.50;             // ATR Multiplier for Take Profit
input double               InpMinRewardRiskRatio      = 1.50;             // Minimum Reward-to-Risk Threshold
input bool                 InpUseBreakEven            = true;             // Enable Automated Break-Even
input double               InpBreakEvenTriggerR       = 1.00;             // Break-Even Trigger (R-Multiple)
input double               InpBreakEvenOffsetPips     = 1.50;             // Break-Even Offset to Cover Costs (Pips)
input bool                 InpUseTrailingStop         = true;             // Enable ATR Trailing Stop
input double               InpTrailingActivationR     = 1.50;             // Trailing Activation (R-Multiple)
input bool                 InpUsePartialProfitTaking  = true;             // Enable Partial Profit Taking
input double               InpPartialCloseR           = 1.30;             // Partial Profit Trigger (R-Multiple)
input double               InpPartialClosePct         = 50.0;             // Partial Volume Close Percentage (%)
input int                  InpMaxHoldingBarsM5        = 36;               // Stagnation Exit (M5 bars, 0 = disabled)

input group "=== 4. Remote Dashboard & AI Service Bridge ==="
input bool                 InpEnableWebBridge         = true;             // Enable Dashboard REST Bridge
input string               InpServerUrl               = "http://127.0.0.1:3000/api/mt5"; // Dashboard URL
input string               InpApiKey                  = "apex_demo_key_99"; // Bridge Authentication Key
input int                  InpScanIntervalSeconds     = 5;                // Opportunity Scanning Frequency (Sec)

//+------------------------------------------------------------------+
//| GLOBAL SYSTEM INSTANCES                                          |
//+------------------------------------------------------------------+
CRiskManager      ExtRisk;
CStopManager      ExtStopMgr;
CTradeExecution   ExtExec;
CMarketScanner    ExtScanner;
CAuditLogger      ExtAudit;
CWebBridge        ExtBridge;

bool              ExtIsEmergencyStopped = false;
bool              ExtIsPaused = false;
datetime          ExtLastScanTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   PrintFormat("====================================================================");
   PrintFormat("Initializing %s v1.00 (Build 2026)", InpAppWorkingName);
   PrintFormat("Account: %I64u | Currency: %s | Leverage: 1:%d", 
               AccountInfoInteger(ACCOUNT_LOGIN), 
               AccountInfoString(ACCOUNT_CURRENCY), 
               (int)AccountInfoInteger(ACCOUNT_LEVERAGE));
   PrintFormat("====================================================================");

   // 1. Live Account Safety Gate
   bool isRealAccount = (AccountInfoInteger(ACCOUNT_TRADE_MODE) == ACCOUNT_TRADE_MODE_REAL);
   if(isRealAccount && InpExecutionMode == EXEC_MODE_LIVE_STRICT_AUTH)
   {
      if(InpLiveAuthorizationKey != "AUTHORIZED_LIVE_APEX_2026")
      {
         Alert("[CRITICAL SAFETY ERROR] Live trading selected on REAL account without valid Authorization Key! Halting EA for capital protection.");
         Print("[SAFETY] Live trading prevented. Please verify key or switch to DEMO mode.");
         return INIT_FAILED;
      }
   }
   else if(isRealAccount && InpExecutionMode == EXEC_MODE_DEMO_EXECUTION)
   {
      Alert("[SAFETY WARNING] REAL account detected with DEMO mode input. Forcing SCAN_ONLY mode.");
      // Force safe scan mode
   }

   // 2. Initialize Risk Manager
   S_RiskConfig riskCfg;
   riskCfg.maxRiskPerTradePct    = InpMaxRiskPerTradePct;
   riskCfg.maxTotalOpenRiskPct   = InpMaxTotalOpenRiskPct;
   riskCfg.maxDailyLossPct       = InpMaxDailyLossPct;
   riskCfg.maxWeeklyLossPct      = InpMaxWeeklyLossPct;
   riskCfg.maxAccountDrawdownPct = InpMaxPeakDrawdownPct;
   riskCfg.minFreeMarginRatio    = InpMinFreeMarginLevel;
   riskCfg.maxSpreadPoints       = InpMaxSpreadPoints;
   riskCfg.maxSpreadToAtrRatio   = InpMaxSpreadToAtrRatio;
   riskCfg.maxSlippagePoints     = 10;
   riskCfg.maxSimultaneousTrades = InpMaxSimultaneousTrades;
   riskCfg.maxTradesPerSymbol    = InpMaxTradesPerSymbol;
   riskCfg.maxCorrelatedCurrency = InpMaxCorrelatedCurrency;
   riskCfg.maxConsecutiveLosses  = InpMaxConsecutiveLosses;
   riskCfg.cooldownPeriodMinutes = InpCooldownMinutes;
   riskCfg.equityCompounding     = InpEquityCompounding;
   riskCfg.minLotSizePermitted   = 0.01;
   riskCfg.maxLotSizeCap         = 5.0;

   ExtRisk.Init(riskCfg);

   // 3. Initialize Stop Manager
   S_StopConfig stopCfg;
   stopCfg.atrMultiplierSL       = InpAtrMultiplierSL;
   stopCfg.atrMultiplierTP       = InpAtrMultiplierTP;
   stopCfg.minRewardRiskRatio    = InpMinRewardRiskRatio;
   stopCfg.useBreakEven          = InpUseBreakEven;
   stopCfg.breakEvenTriggerR     = InpBreakEvenTriggerR;
   stopCfg.breakEvenOffsetPips   = InpBreakEvenOffsetPips;
   stopCfg.useTrailingStop       = InpUseTrailingStop;
   stopCfg.trailingAtrMultiplier = 1.20;
   stopCfg.trailingActivationR   = InpTrailingActivationR;
   stopCfg.usePartialClose       = InpUsePartialProfitTaking;
   stopCfg.partialCloseR         = InpPartialCloseR;
   stopCfg.partialClosePct       = InpPartialClosePct;
   stopCfg.maxHoldingBarsM5      = InpMaxHoldingBarsM5;

   ExtStopMgr.Init(stopCfg, InpMagicNumber);

   // 4. Initialize Execution Engine
   ExtExec.Init(InpMagicNumber, 10);

   // 5. Initialize Scanner
   ExtScanner.Init(InpScanSymbolsList);

   // 6. Initialize Audit Logger
   ExtAudit.Init("Apex_Audit");

   // 7. Initialize Remote Bridge
   if(InpEnableWebBridge)
   {
      ExtBridge.Init(InpServerUrl, InpApiKey, 3);
   }

   // 8. Create HUD Panel on Chart
   CreateOnChartHUD();

   // 9. Start High-Resolution Timer (1 Second)
   EventSetTimer(1);

   Print("[INIT SUCCESS] Apex AI Trader fully armed and operational.");
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   ExtAudit.Close();
   ObjectsDeleteAll(0, "ApexHUD_");
   PrintFormat("[SHUTDOWN] %s deinitialized cleanly. Reason code: %d", InpAppWorkingName, reason);
}

//+------------------------------------------------------------------+
//| OnTick Event Handler (High-frequency position management)        |
//+------------------------------------------------------------------+
void OnTick()
{
   // Always manage open positions (Trailing stop, Break-even, Partial close)
   ExtStopMgr.ManageOpenPositions(InpMagicNumber);

   // Update chart HUD
   UpdateOnChartHUD();
}

//+------------------------------------------------------------------+
//| OnTimer Event Handler (Periodic Scanner & Bridge Sync)           |
//+------------------------------------------------------------------+
void OnTimer()
{
   ExtRisk.UpdateEquityMetrics();

   // 1. Sync Telemetry and Check Remote Commands
   if(InpEnableWebBridge)
   {
      S_BridgeCommand cmd;
      if(ExtBridge.SendHeartbeatAndTelemetry(ExtRisk, cmd))
      {
         if(cmd.hasCommand)
         {
            if(cmd.emergencyStopRequested)
            {
               ExtIsEmergencyStopped = true;
               ExtExec.CloseAllPositions("Remote Dashboard Emergency Stop");
               ExtRisk.TripCircuitBreaker("Remote Dashboard Emergency Stop Command Received");
            }
            if(cmd.pauseTradingRequested) ExtIsPaused = true;
            if(cmd.resumeTradingRequested)
            {
               ExtIsPaused = false;
               ExtIsEmergencyStopped = false;
               ExtRisk.ResetCircuitBreaker();
            }
         }
      }
   }

   // 2. Periodic Multi-Symbol Opportunity Scanner Cycle
   if(TimeCurrent() - ExtLastScanTime >= InpScanIntervalSeconds)
   {
      ExtLastScanTime = TimeCurrent();
      ExecuteScannerCycle();
   }

   UpdateOnChartHUD();
}

//+------------------------------------------------------------------+
//| Run Scanner and Execute Valid Opportunities                      |
//+------------------------------------------------------------------+
void ExecuteScannerCycle()
{
   if(ExtIsEmergencyStopped || ExtIsPaused) return;

   string canOpenReason = "";
   if(!ExtRisk.CanOpenNewPositions(canOpenReason))
   {
      return; // Risk limit, cooldown, or circuit breaker active
   }

   S_ScannedSymbol opportunities[];
   int count = ExtScanner.ScanAll(ExtStopMgr, opportunities);

   if(count == 0) return;

   // Inspect top opportunity
   S_ScannedSymbol top = opportunities[0];

   // Verify signal quality threshold (minimum score 75/100)
   if(top.opportunityScore >= 75.0 && top.bestSignal.signalType != (ENUM_ORDER_TYPE)-1 && top.passesRiskFilters)
   {
      // In-depth risk sizing check
      S_RiskCheckResult riskCheck = ExtRisk.ValidateOrder(top.symbol, 
                                                          top.bestSignal.signalType, 
                                                          top.bestSignal.proposedEntry, 
                                                          top.bestSignal.proposedSL, 
                                                          top.atr14, 
                                                          top.spreadPoints);

      if(!riskCheck.isApproved)
      {
         ExtAudit.LogDecision(top.symbol, 
                              "TRADE_REJECTED", 
                              top.bestSignal.strategyName, 
                              top.regime.regimeName, 
                              0.0, 
                              top.bestSignal.proposedEntry, 
                              top.bestSignal.proposedSL, 
                              top.bestSignal.proposedTP, 
                              riskCheck.rejectionReason);
         return;
      }

      // If in SCAN_ONLY or PAPER mode, do not transmit live order
      if(InpExecutionMode == EXEC_MODE_SCAN_ONLY)
      {
         ExtAudit.LogDecision(top.symbol, 
                              "SCAN_ONLY_SIGNAL", 
                              top.bestSignal.strategyName, 
                              top.regime.regimeName, 
                              riskCheck.calculatedVolume, 
                              top.bestSignal.proposedEntry, 
                              top.bestSignal.proposedSL, 
                              top.bestSignal.proposedTP, 
                              StringFormat("Potential trade identified. Score: %.1f", top.opportunityScore));
         return;
      }

      // Prepare Execution Request
      S_OrderRequest req;
      req.symbol = top.symbol;
      req.orderType = top.bestSignal.signalType;
      req.volume = riskCheck.calculatedVolume;
      req.price = top.bestSignal.proposedEntry;
      req.stopLoss = top.bestSignal.proposedSL;
      req.takeProfit = top.bestSignal.proposedTP;
      req.strategyName = top.bestSignal.strategyName;
      req.strategyId = top.bestSignal.strategyId;
      req.regimeTag = top.regime.regimeName;
      req.maxSlippagePoints = 10;

      S_OrderResponse resp = ExtExec.ExecuteMarketOrder(req);

      if(resp.success)
      {
         ExtAudit.LogDecision(top.symbol, 
                              "ORDER_FILLED", 
                              top.bestSignal.strategyName, 
                              top.regime.regimeName, 
                              req.volume, 
                              resp.executedPrice, 
                              req.stopLoss, 
                              req.takeProfit, 
                              StringFormat("Ticket: #%I64u | Slippage: %.1f pts", resp.orderTicket, resp.slippagePoints));
      }
      else
      {
         ExtAudit.LogDecision(top.symbol, 
                              "EXECUTION_FAILED", 
                              top.bestSignal.strategyName, 
                              top.regime.regimeName, 
                              req.volume, 
                              req.price, 
                              req.stopLoss, 
                              req.takeProfit, 
                              resp.brokerComment);
      }
   }
}

//+------------------------------------------------------------------+
//| OnTradeTransaction Event (Capture PnL on position closes)        |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans, 
                        const MqlTradeRequest &request, 
                        const MqlTradeResult &result)
{
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      ulong dealTicket = trans.deal;
      if(dealTicket > 0 && HistoryDealSelect(dealTicket))
      {
         ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
         if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_OUT_BY)
         {
            double profit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
            double swap = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
            double comm = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
            double netPnL = profit + swap + comm;
            string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);

            ExtRisk.OnTradeClosed(netPnL > 0 ? netPnL : 0.0, netPnL < 0 ? netPnL : 0.0);

            ExtAudit.LogDecision(symbol, 
                                 "DEAL_CLOSED", 
                                 "Apex Position Exit", 
                                 "N/A", 
                                 HistoryDealGetDouble(dealTicket, DEAL_VOLUME), 
                                 HistoryDealGetDouble(dealTicket, DEAL_PRICE), 
                                 0.0, 
                                 0.0, 
                                 StringFormat("Net PnL: $%.2f", netPnL), 
                                 netPnL);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Chart HUD Panel Display                                          |
//+------------------------------------------------------------------+
void CreateOnChartHUD()
{
   string font = "Consolas";
   int x = 20, y = 30, step = 20;

   CreateLabel("ApexHUD_Title",  x, y, "=== APEX AI TRADER v1.00 ===", clrGold, 10, true);
   y += step;
   CreateLabel("ApexHUD_Mode",   x, y, "Mode: Initializing...", clrWhite, 9);
   y += step;
   CreateLabel("ApexHUD_Equity", x, y, "Equity: ...", clrLime, 9);
   y += step;
   CreateLabel("ApexHUD_PnL",    x, y, "Daily PnL: ...", clrWhite, 9);
   y += step;
   CreateLabel("ApexHUD_DD",     x, y, "Peak DD: ...", clrWhite, 9);
   y += step;
   CreateLabel("ApexHUD_Status", x, y, "Engine Status: Active", clrCyan, 9);
}

void UpdateOnChartHUD()
{
   string modeStr = EnumToString(InpExecutionMode);
   if(ExtIsEmergencyStopped) modeStr = "EMERGENCY STOPPED";
   else if(ExtIsPaused) modeStr = "PAUSED";

   string equityStr = StringFormat("Balance: $%.2f | Equity: $%.2f", AccountInfoDouble(ACCOUNT_BALANCE), AccountInfoDouble(ACCOUNT_EQUITY));
   string pnlStr    = StringFormat("Daily PnL: %+.2f%% | Consecutive Losses: %d", ExtRisk.GetDailyPnLPct(), ExtRisk.GetConsecutiveLosses());
   string ddStr     = StringFormat("Peak Drawdown: %.2f%% (Max: %.2f%%)", ExtRisk.GetCurrentDrawdownPct(), InpMaxPeakDrawdownPct);

   color pnlColor = (ExtRisk.GetDailyPnLPct() >= 0) ? clrLime : clrTomato;
   color statusColor = ExtRisk.IsCircuitBreakerTripped() ? clrRed : ExtRisk.IsCooldownActive() ? clrOrange : clrSpringGreen;

   string statusStr = "Status: OPTIMAL SCANNING";
   if(ExtRisk.IsCircuitBreakerTripped()) statusStr = "CIRCUIT BREAKER: " + ExtRisk.GetCircuitBreakerReason();
   else if(ExtRisk.IsCooldownActive()) statusStr = "COOLDOWN PAUSE ACTIVE";

   SetLabelText("ApexHUD_Mode", "Execution Mode: " + modeStr, (ExtIsEmergencyStopped ? clrRed : clrGold));
   SetLabelText("ApexHUD_Equity", equityStr, clrWhite);
   SetLabelText("ApexHUD_PnL", pnlStr, pnlColor);
   SetLabelText("ApexHUD_DD", ddStr, (ExtRisk.GetCurrentDrawdownPct() > 3.0 ? clrOrange : clrLightBlue));
   SetLabelText("ApexHUD_Status", statusStr, statusColor);
}

void CreateLabel(string name, int x, int y, string text, color clr, int size = 9, bool bold = false)
{
   ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, size);
   ObjectSetString(0, name, OBJPROP_FONT, "Consolas");
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

void SetLabelText(string name, string text, color clr)
{
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
}
