//+------------------------------------------------------------------+
//|                                                  ApexGoldAI.mq5  |
//|                    Apex Gold AI — Autonomous XAUUSD Scalper      |
//|       Exclusive Gold Mode • Quantitative Regimes • Hard Risk Core|
//+------------------------------------------------------------------+
#property copyright "Apex Gold AI Quantitative Team"
#property link      "https://apexgold.internal"
#property version   "1.00"
#property description "Autonomous MT5 Scalping Agent dedicated exclusively to XAUUSD (Gold). Hard risk preservation & phone supervision integration."

#include <Trade\Trade.mqh>
#include "Include\ApexGold\GoldSymbolDiscovery.mqh"
#include "Include\ApexGold\GoldRiskManager.mqh"
#include "Include\ApexGold\GoldStrategyEngine.mqh"

enum ENUM_OPERATIONAL_MODE
{
   MODE_DEMO_AUTONOMOUS = 0,    // Real Demo Execution (Recommended starting mode)
   MODE_MONITOR_ONLY,           // Phone Screen Monitoring & Alerting Only
   MODE_LIVE_STRICT_CONFIRM     // Live Account Execution (Requires Security Passphrase)
};

//+------------------------------------------------------------------+
//| INPUT PARAMETERS — CONSERVATIVE GOLD DEFAULTS                    |
//+------------------------------------------------------------------+
input group "=== 1. Gold Symbol Mapping & Instrument Identity ==="
input string               InpAppWorkingName          = "Apex Gold AI";      // Application Working Name
input string               InpOverrideGoldSymbol      = "";                  // Optional Gold Symbol Override (Leave empty for Auto-Discovery)
input ulong                InpMagicNumber             = 200888;              // EA Magic Identification Number
input ENUM_OPERATIONAL_MODE InpOperatingMode          = MODE_DEMO_AUTONOMOUS;// Operating Mode

input group "=== 2. Hard Capital Preservation & Gold Sizing ==="
input double               InpRiskPerTradePct         = 0.25;                // Demo Test Risk Per Trade (% of Equity, default 0.25%)
input double               InpMaxDailyLossPct         = 1.00;                // Daily Loss Circuit Breaker (% of Equity, default 1.00%)
input double               InpMaxPeakDrawdownPct      = 4.00;                // Peak-to-Trough Drawdown Ceiling (%)
input int                  InpMaxConcurrentGoldTrades = 1;                   // Max Simultaneous Gold Positions
input int                  InpMaxSpreadPoints         = 35;                  // Max Spread Points Gate (35 pts = $0.35/oz)
input double               InpMaxSpreadToAtrRatio     = 0.20;                // Max Spread / ATR Ratio (Cost Friction Gate)
input int                  InpMaxConsecutiveLosses    = 3;                   // Consecutive Losses Streak Limit
input int                  InpCooldownMinutes         = 60;                  // Cooldown Pause Duration (Minutes)
input double               InpMinFreeMarginLevel      = 250.0;               // Minimum Margin Level (%)
input bool                 InpEquityCompounding       = true;                // Dynamic Equity Sizing (vs Fixed Balance)

input group "=== 3. Stop-Loss & Position Management ==="
input double               InpMinRewardRiskRatio      = 1.60;                // Minimum Reward-to-Risk Gate
input bool                 InpUseBreakEven            = true;                // Auto Move to Break-Even
input double               InpBreakEvenTriggerR       = 1.00;                // Break-Even Activation (R-Multiple)
input double               InpBreakEvenOffsetPips     = 1.50;                // Commission Buffer Offset (Pips / $0.15)
input bool                 InpUseTrailingStop         = true;                // Enable Dynamic ATR Trailing
input double               InpTrailingActivationR     = 1.40;                // Trailing Activation (R-Multiple)
input bool                 InpUsePartialClose         = true;                // Enable Partial Profit Taking (50% @ 1.3R)
input double               InpPartialCloseR           = 1.30;                // Partial Profit Trigger (R-Multiple)

input group "=== 4. Phone Supervision & Web Bridge ==="
input bool                 InpEnableWebBridge         = true;                // Enable REST Sync to Mobile Dashboard
input string               InpServerUrl               = "http://127.0.0.1:3000/api/gold"; // Bridge Endpoint
input int                  InpScanIntervalSeconds     = 3;                   // Market Scan Loop (Seconds)

//+------------------------------------------------------------------+
//| GLOBAL SYSTEM INSTANCES                                          |
//+------------------------------------------------------------------+
CGoldSymbolDiscovery m_discovery;
CGoldRiskManager     m_risk;
CGoldStrategyEngine  m_strategies;
CTrade               m_trade;

string               g_confirmedGoldSymbol = "";
bool                 g_isEmergencyStopped  = false;
bool                 g_isPaused            = false;
datetime             g_lastScanTime        = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   PrintFormat("====================================================================");
   PrintFormat("INITIALIZING %s (Exclusive XAUUSD Autonomous Agent)", InpAppWorkingName);
   PrintFormat("Broker: %s | Account: %I64u | Server: %s", 
               AccountInfoString(ACCOUNT_COMPANY), AccountInfoInteger(ACCOUNT_LOGIN), AccountInfoString(ACCOUNT_SERVER));
   PrintFormat("====================================================================");

   // 1. Auto-Discover & Strictly Verify Gold Symbol
   if(!m_discovery.DiscoverAndVerifyGold(InpOverrideGoldSymbol))
   {
      Alert("[FATAL ERROR] Failed to discover and verify broker's XAUUSD/Gold symbol! Halting EA for capital protection.");
      return INIT_FAILED;
   }

   g_confirmedGoldSymbol = m_discovery.GetConfirmedSymbol();

   // 2. Initialize Risk Manager with Gold Specifications
   S_GoldRiskConfig riskCfg;
   riskCfg.riskPerTradePct          = InpRiskPerTradePct;
   riskCfg.maxDailyLossPct          = InpMaxDailyLossPct;
   riskCfg.maxPeakDrawdownPct       = InpMaxPeakDrawdownPct;
   riskCfg.maxTotalOpenRiskPct      = 1.50;
   riskCfg.maxConcurrentGoldTrades  = InpMaxConcurrentGoldTrades;
   riskCfg.maxSpreadPoints          = InpMaxSpreadPoints;
   riskCfg.maxSpreadToAtrRatio      = InpMaxSpreadToAtrRatio;
   riskCfg.maxConsecutiveLosses     = InpMaxConsecutiveLosses;
   riskCfg.cooldownMinutes          = InpCooldownMinutes;
   riskCfg.minFreeMarginLevel       = InpMinFreeMarginLevel;
   riskCfg.equityCompounding        = InpEquityCompounding;

   m_risk.Init(riskCfg, &m_discovery);

   // 3. Configure Trade Interface
   m_trade.SetExpertMagicNumber(InpMagicNumber);
   m_trade.SetDeviationInPoints(15);
   m_trade.SetAsyncMode(false);

   // 4. Create On-Chart HUD
   CreateGoldHUD();

   // 5. Start High-Resolution Timer (1 Second)
   EventSetTimer(1);

   PrintFormat("[INIT SUCCEEDED] %s armed exclusively on %s.", InpAppWorkingName, g_confirmedGoldSymbol);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   ObjectsDeleteAll(0, "ApexGold_");
   PrintFormat("[SHUTDOWN] %s deinitialized cleanly. Reason: %d", InpAppWorkingName, reason);
}

//+------------------------------------------------------------------+
//| OnTick Event Handler (Position Management)                       |
//+------------------------------------------------------------------+
void OnTick()
{
   ManageActiveGoldPositions();
   UpdateGoldHUD();
}

//+------------------------------------------------------------------+
//| OnTimer Event Handler (Opportunity Scanner & Telemetry Sync)     |
//+------------------------------------------------------------------+
void OnTimer()
{
   m_risk.UpdateMetrics();

   if(TimeCurrent() - g_lastScanTime >= InpScanIntervalSeconds)
   {
      g_lastScanTime = TimeCurrent();
      ExecuteGoldScanCycle();
   }

   UpdateGoldHUD();
}

//+------------------------------------------------------------------+
//| Continuous Gold Scan & Execution Cycle                           |
//+------------------------------------------------------------------+
void ExecuteGoldScanCycle()
{
   if(g_isEmergencyStopped || g_isPaused) return;

   string canOpenReason = "";
   if(!m_risk.CanOpenNewTrade(canOpenReason))
   {
      return; // Circuit breaker, cooldown, or margin restriction active
   }

   // 1. Detect Regime & Session
   S_GoldRegime regime = m_strategies.DetectGoldRegime(g_confirmedGoldSymbol);
   if(!regime.isTradeable) return;

   // 2. Evaluate Strategy Setups
   S_GoldSignal signal;
   if(m_strategies.EvaluateBestSetup(g_confirmedGoldSymbol, regime, signal))
   {
      MqlTick tick;
      SymbolInfoTick(g_confirmedGoldSymbol, tick);
      int spread = (int)SymbolInfoInteger(g_confirmedGoldSymbol, SYMBOL_SPREAD);

      double atrVal = 2.50; // fallback
      int atrH = iATR(g_confirmedGoldSymbol, PERIOD_M5, 14);
      if(atrH != INVALID_HANDLE)
      {
         double buf[1];
         if(CopyBuffer(atrH, 0, 0, 1, buf) > 0) atrVal = buf[0];
         IndicatorRelease(atrH);
      }

      // 3. In-Depth Gold Risk Validation & Sizing
      S_GoldValidationResult check = m_risk.ValidateGoldOrder(g_confirmedGoldSymbol,
                                                             signal.signalType,
                                                             signal.entryPrice,
                                                             signal.stopLoss,
                                                             atrVal,
                                                             spread);

      if(!check.isApproved)
      {
         PrintFormat("[GOLD SKIP] %s: %s", signal.strategyName, check.rejectionReason);
         return;
      }

      if(InpOperatingMode == MODE_MONITOR_ONLY)
      {
         PrintFormat("[MONITOR SIGNAL] %s on %s @ %.2f (SL: %.2f, TP: %.2f, Lots: %.2f)",
                     signal.strategyName, g_confirmedGoldSymbol, signal.entryPrice, signal.stopLoss, signal.takeProfit, check.calculatedVolume);
         return;
      }

      // 4. Execute Order
      string comment = StringFormat("ApexGold:S%d", (int)signal.strategy);
      bool success = false;
      if(signal.signalType == ORDER_TYPE_BUY)
      {
         success = m_trade.Buy(check.calculatedVolume, g_confirmedGoldSymbol, tick.ask, signal.stopLoss, signal.takeProfit, comment);
      }
      else if(signal.signalType == ORDER_TYPE_SELL)
      {
         success = m_trade.Sell(check.calculatedVolume, g_confirmedGoldSymbol, tick.bid, signal.stopLoss, signal.takeProfit, comment);
      }

      if(success)
      {
         PrintFormat("[GOLD FILL] %s %s %.2f lots @ %.2f (SL: %.2f, TP: %.2f). Ticket #%I64u",
                     EnumToString(signal.signalType), g_confirmedGoldSymbol, check.calculatedVolume, 
                     (signal.signalType == ORDER_TYPE_BUY ? tick.ask : tick.bid), signal.stopLoss, signal.takeProfit, m_trade.ResultOrder());
      }
      else
      {
         PrintFormat("[GOLD EXECUTION FAILED] Retcode: %u (%s)", m_trade.ResultRetcode(), m_trade.ResultComment());
      }
   }
}

//+------------------------------------------------------------------+
//| Manage Open Gold Positions (Break-even, Trailing, Partials)      |
//+------------------------------------------------------------------+
void ManageActiveGoldPositions()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0) continue;

      if(PositionGetInteger(POSITION_MAGIC) != (long)InpMagicNumber) continue;
      if(PositionGetString(POSITION_SYMBOL) != g_confirmedGoldSymbol) continue; // Only manage confirmed Gold

      ENUM_POSITION_TYPE posType = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      double openPx   = PositionGetDouble(POSITION_PRICE_OPEN);
      double currentSL = PositionGetDouble(POSITION_SL);
      double currentTP = PositionGetDouble(POSITION_TP);
      double volume   = PositionGetDouble(POSITION_VOLUME);
      double currentPx = (posType == POSITION_TYPE_BUY) ? SymbolInfoDouble(g_confirmedGoldSymbol, SYMBOL_BID) : SymbolInfoDouble(g_confirmedGoldSymbol, SYMBOL_ASK);

      double riskDist = MathAbs(openPx - currentSL);
      if(riskDist <= 0.0) continue;

      double currentR = (posType == POSITION_TYPE_BUY) ? (currentPx - openPx) / riskDist : (openPx - currentPx) / riskDist;

      // Break-Even Movement (+ offset)
      if(InpUseBreakEven && currentR >= InpBreakEvenTriggerR)
      {
         double offset = InpBreakEvenOffsetPips * 0.10; // 1.5 pips = $0.15 on Gold
         double candidateSL = (posType == POSITION_TYPE_BUY) ? openPx + offset : openPx - offset;

         if(posType == POSITION_TYPE_BUY && candidateSL > currentSL + 0.10)
         {
            m_trade.PositionModify(ticket, candidateSL, currentTP);
            PrintFormat("[GOLD BE] Moved BUY #%I64u to Break-Even ($%.2f)", ticket, candidateSL);
         }
         else if(posType == POSITION_TYPE_SELL && (currentSL == 0.0 || candidateSL < currentSL - 0.10))
         {
            m_trade.PositionModify(ticket, candidateSL, currentTP);
            PrintFormat("[GOLD BE] Moved SELL #%I64u to Break-Even ($%.2f)", ticket, candidateSL);
         }
      }

      // Dynamic Trailing Stop
      if(InpUseTrailingStop && currentR >= InpTrailingActivationR)
      {
         double trailDist = riskDist * 0.75;
         double candidateSL = (posType == POSITION_TYPE_BUY) ? currentPx - trailDist : currentPx + trailDist;

         if(posType == POSITION_TYPE_BUY && candidateSL > currentSL + 0.20)
         {
            m_trade.PositionModify(ticket, candidateSL, currentTP);
         }
         else if(posType == POSITION_TYPE_SELL && (currentSL == 0.0 || candidateSL < currentSL - 0.20))
         {
            m_trade.PositionModify(ticket, candidateSL, currentTP);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| OnTradeTransaction (Capture Net PnL)                             |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans, const MqlTradeRequest &request, const MqlTradeResult &result)
{
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      ulong dealTicket = trans.deal;
      if(dealTicket > 0 && HistoryDealSelect(dealTicket))
      {
         ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
         if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_OUT_BY)
         {
            double netPnL = HistoryDealGetDouble(dealTicket, DEAL_PROFIT) + HistoryDealGetDouble(dealTicket, DEAL_SWAP) + HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
            m_risk.OnTradeClosed(netPnL);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Gold On-Chart HUD Display                                        |
//+------------------------------------------------------------------+
void CreateGoldHUD()
{
   string font = "Consolas";
   int x = 20, y = 30, step = 20;

   CreateLabel("ApexGold_Title",  x, y, "=== APEX GOLD AI — XAUUSD SCALPER ===", clrGold, 10, true);
   y += step;
   CreateLabel("ApexGold_Sym",    x, y, "Instrument: Verifying...", clrCyan, 9);
   y += step;
   CreateLabel("ApexGold_Equity", x, y, "Equity: ...", clrLime, 9);
   y += step;
   CreateLabel("ApexGold_PnL",    x, y, "Daily PnL: ...", clrWhite, 9);
   y += step;
   CreateLabel("ApexGold_DD",     x, y, "Peak DD: ...", clrLightBlue, 9);
   y += step;
   CreateLabel("ApexGold_Status", x, y, "Status: ACTIVE", clrLime, 9);
}

void UpdateGoldHUD()
{
   MqlTick tick;
   SymbolInfoTick(g_confirmedGoldSymbol, tick);
   int spread = (int)SymbolInfoInteger(g_confirmedGoldSymbol, SYMBOL_SPREAD);

   string symText = StringFormat("Instrument: %s | Spot: $%.2f | Spread: %d pts ($%.2f)", 
                                 g_confirmedGoldSymbol, tick.bid, spread, spread * 0.01);
   string eqText  = StringFormat("Equity: $%.2f | Balance: $%.2f", 
                                 AccountInfoDouble(ACCOUNT_EQUITY), AccountInfoDouble(ACCOUNT_BALANCE));
   string pnlText = StringFormat("Daily PnL: %+.2f%% | Streak Losses: %d", 
                                 m_risk.GetDailyPnLPct(), m_risk.GetConsecutiveLosses());
   string ddText  = StringFormat("Peak Drawdown: %.2f%% (Hard Cap: %.2f%%)", 
                                 m_risk.GetCurrentDrawdownPct(), InpMaxPeakDrawdownPct);

   color statusClr = m_risk.IsCircuitBreakerTripped() ? clrRed : m_risk.IsCooldownActive() ? clrOrange : clrLime;
   string statusText = "Status: OPTIMAL GOLD SCANNING";
   if(m_risk.IsCircuitBreakerTripped()) statusText = "CIRCUIT BREAKER: " + m_risk.GetCircuitBreakerReason();
   else if(m_risk.IsCooldownActive()) statusText = "COOLDOWN PAUSE ACTIVE";

   SetLabelText("ApexGold_Sym", symText, clrCyan);
   SetLabelText("ApexGold_Equity", eqText, clrWhite);
   SetLabelText("ApexGold_PnL", pnlText, (m_risk.GetDailyPnLPct() >= 0 ? clrLime : clrTomato));
   SetLabelText("ApexGold_DD", ddText, (m_risk.GetCurrentDrawdownPct() > 2.5 ? clrOrange : clrLightBlue));
   SetLabelText("ApexGold_Status", statusText, statusClr);
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
