//+------------------------------------------------------------------+
//|                                             GoldRiskManager.mqh  |
//|                         Apex Gold AI — XAUUSD Risk Engine        |
//|             Independent Hard Capital Preservation & Drawdown Cut |
//+------------------------------------------------------------------+
#property copyright "Apex Gold AI Quantitative Team"
#property link      "https://apexgold.internal"
#property strict

#include "GoldSymbolDiscovery.mqh"

struct S_GoldRiskConfig
{
   double   riskPerTradePct;          // Default: 0.25% of equity for demo safety
   double   maxDailyLossPct;          // Default: 1.00% daily loss circuit breaker
   double   maxPeakDrawdownPct;       // Default: 3.50% - 5.00% peak DD cutoff
   double   maxTotalOpenRiskPct;      // Default: 1.50% across open positions
   int      maxConcurrentGoldTrades;  // Default: 1 (or max 2 with scale-in)
   int      maxSpreadPoints;          // Default: 35 points ($0.35/oz on Gold)
   double   maxSpreadToAtrRatio;      // Default: 0.20 (20% of ATR)
   int      maxConsecutiveLosses;     // Default: 3 losses triggers cooldown
   int      cooldownMinutes;          // Default: 60 minutes
   double   minFreeMarginLevel;       // Default: 250%
   bool     equityCompounding;        // Size from equity vs initial balance
};

struct S_GoldValidationResult
{
   bool     isApproved;
   double   calculatedVolume;
   double   monetaryRisk;
   string   rejectionReason;
};

class CGoldRiskManager
{
private:
   S_GoldRiskConfig     m_config;
   CGoldSymbolDiscovery *m_symbolDiscovery;
   double               m_peakEquity;
   double               m_dayStartEquity;
   datetime             m_lastDayReset;
   int                  m_consecutiveLosses;
   datetime             m_cooldownUntil;
   bool                 m_circuitBreakerTripped;
   string               m_circuitBreakerReason;

public:
   CGoldRiskManager();
   ~CGoldRiskManager();

   void                 Init(const S_GoldRiskConfig &config, CGoldSymbolDiscovery *discovery);
   void                 UpdateMetrics();
   S_GoldValidationResult ValidateGoldOrder(const string symbol,
                                           const ENUM_ORDER_TYPE orderType,
                                           const double entryPrice,
                                           const double stopLoss,
                                           const double atrValue,
                                           const int currentSpread);

   bool                 CanOpenNewTrade(string &outReason);
   void                 OnTradeClosed(const double netPnL);
   void                 TripCircuitBreaker(const string reason);
   void                 ResetCircuitBreaker();

   // Getters
   double               GetCurrentDrawdownPct() const;
   double               GetDailyPnLPct() const;
   int                  GetConsecutiveLosses() const { return m_consecutiveLosses; }
   bool                 IsCooldownActive() const { return (TimeCurrent() < m_cooldownUntil); }
   bool                 IsCircuitBreakerTripped() const { return m_circuitBreakerTripped; }
   string               GetCircuitBreakerReason() const { return m_circuitBreakerReason; }
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CGoldRiskManager::CGoldRiskManager()
{
   m_symbolDiscovery = NULL;
   m_peakEquity = 0.0;
   m_dayStartEquity = 0.0;
   m_lastDayReset = 0;
   m_consecutiveLosses = 0;
   m_cooldownUntil = 0;
   m_circuitBreakerTripped = false;
   m_circuitBreakerReason = "";
}

CGoldRiskManager::~CGoldRiskManager()
{
}

//+------------------------------------------------------------------+
//| Initialize                                                       |
//+------------------------------------------------------------------+
void CGoldRiskManager::Init(const S_GoldRiskConfig &config, CGoldSymbolDiscovery *discovery)
{
   m_config = config;
   m_symbolDiscovery = discovery;
   m_peakEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   m_dayStartEquity = m_peakEquity;
   m_lastDayReset = TimeCurrent();
   m_consecutiveLosses = 0;
   m_cooldownUntil = 0;
   m_circuitBreakerTripped = false;
   m_circuitBreakerReason = "";
}

//+------------------------------------------------------------------+
//| Update Equity Metrics & Daily Boundary                           |
//+------------------------------------------------------------------+
void CGoldRiskManager::UpdateMetrics()
{
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);

   if(currentEquity > m_peakEquity)
   {
      m_peakEquity = currentEquity;
   }

   // Daily 00:00 server boundary check
   MqlDateTime dtCurrent, dtLast;
   TimeToStruct(TimeCurrent(), dtCurrent);
   TimeToStruct(m_lastDayReset, dtLast);

   if(dtCurrent.day != dtLast.day)
   {
      m_dayStartEquity = currentEquity;
      m_lastDayReset = TimeCurrent();
      PrintFormat("[GOLD RISK] New trading session. Day start equity baseline: $%.2f", m_dayStartEquity);
   }

   // Circuit breaker checks
   double peakDD = GetCurrentDrawdownPct();
   if(peakDD >= m_config.maxPeakDrawdownPct)
   {
      TripCircuitBreaker(StringFormat("Max Peak Drawdown Breached (%.2f%% >= %.2f%%)", peakDD, m_config.maxPeakDrawdownPct));
   }

   double dailyLoss = GetDailyPnLPct();
   if(dailyLoss <= -m_config.maxDailyLossPct)
   {
      TripCircuitBreaker(StringFormat("Daily Loss Limit Breached (%.2f%% <= -%.2f%%)", dailyLoss, m_config.maxDailyLossPct));
   }
}

double CGoldRiskManager::GetCurrentDrawdownPct() const
{
   if(m_peakEquity <= 0.0) return 0.0;
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   if(currentEquity >= m_peakEquity) return 0.0;
   return ((m_peakEquity - currentEquity) / m_peakEquity) * 100.0;
}

double CGoldRiskManager::GetDailyPnLPct() const
{
   if(m_dayStartEquity <= 0.0) return 0.0;
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   return ((currentEquity - m_dayStartEquity) / m_dayStartEquity) * 100.0;
}

bool CGoldRiskManager::CanOpenNewTrade(string &outReason)
{
   UpdateMetrics();

   if(m_circuitBreakerTripped)
   {
      outReason = "CRITICAL CIRCUIT BREAKER TRIPPED: " + m_circuitBreakerReason;
      return false;
   }

   if(IsCooldownActive())
   {
      int remainSec = (int)(m_cooldownUntil - TimeCurrent());
      outReason = StringFormat("COOLDOWN ACTIVE: %d minutes remaining after loss streak.", remainSec / 60);
      return false;
   }

   double marginLevel = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   if(marginLevel > 0.0 && marginLevel < m_config.minFreeMarginLevel)
   {
      outReason = StringFormat("FREE MARGIN LEVEL TOO LOW: %.1f%% < %.1f%%", marginLevel, m_config.minFreeMarginLevel);
      return false;
   }

   // Count open Gold positions
   int goldPosCount = 0;
   for(int i = 0; i < PositionsTotal(); i++)
   {
      if(PositionGetTicket(i) > 0)
      {
         string posSym = PositionGetString(POSITION_SYMBOL);
         if(m_symbolDiscovery && m_symbolDiscovery->IsGoldSymbol(posSym))
         {
            goldPosCount++;
         }
      }
   }

   if(goldPosCount >= m_config.maxConcurrentGoldTrades)
   {
      outReason = StringFormat("MAX CONCURRENT GOLD POSITIONS REACHED: %d / %d", goldPosCount, m_config.maxConcurrentGoldTrades);
      return false;
   }

   return true;
}

//+------------------------------------------------------------------+
//| Validate Gold Order & Calculate Strict Downward Stepped Volume   |
//+------------------------------------------------------------------+
S_GoldValidationResult CGoldRiskManager::ValidateGoldOrder(const string symbol,
                                                         const ENUM_ORDER_TYPE orderType,
                                                         const double entryPrice,
                                                         const double stopLoss,
                                                         const double atrValue,
                                                         const int currentSpread)
{
   S_GoldValidationResult res;
   res.isApproved = false;
   res.calculatedVolume = 0.0;
   res.monetaryRisk = 0.0;
   res.rejectionReason = "";

   // 1. EXCLUSIVE GOLD MODE CHECK: Block any non-gold instrument
   if(!m_symbolDiscovery || !m_symbolDiscovery->IsGoldSymbol(symbol))
   {
      res.rejectionReason = StringFormat("SECURITY BLOCK: Symbol '%s' is NOT the verified broker Gold instrument. Non-gold trades strictly prohibited.", symbol);
      PrintFormat("[GOLD RISK SECURITY] %s", res.rejectionReason);
      return res;
   }

   // 2. Global Safety Gates
   string sysReason = "";
   if(!CanOpenNewTrade(sysReason))
   {
      res.rejectionReason = sysReason;
      return res;
   }

   // 3. Stop-Loss Presence & Geometry
   if(stopLoss <= 0.0)
   {
      res.rejectionReason = "REJECTED: Protective stop-loss is mandatory. Zero stop rejected.";
      return res;
   }

   double slDistance = MathAbs(entryPrice - stopLoss);
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   int stopLevel = (int)SymbolInfoInteger(symbol, SYMBOL_TRADE_STOPS_LEVEL);

   if(stopLevel > 0 && slDistance < (stopLevel * point))
   {
      res.rejectionReason = StringFormat("REJECTED: SL distance (%.2f) tighter than broker stop level (%d points).", slDistance, stopLevel);
      return res;
   }

   if(orderType == ORDER_TYPE_BUY && stopLoss >= entryPrice)
   {
      res.rejectionReason = "REJECTED: Buy SL must be strictly below entry price.";
      return res;
   }
   if(orderType == ORDER_TYPE_SELL && stopLoss <= entryPrice)
   {
      res.rejectionReason = "REJECTED: Sell SL must be strictly above entry price.";
      return res;
   }

   // 4. Gold Spread Cost Gating
   if(currentSpread > m_config.maxSpreadPoints)
   {
      res.rejectionReason = StringFormat("REJECTED: Spread %d points exceeds gold maximum %d points (rollover/illiquidity).",
                                         currentSpread, m_config.maxSpreadPoints);
      return res;
   }

   if(atrValue > 0.0)
   {
      double spreadPrice = currentSpread * point;
      double spreadToAtr = spreadPrice / atrValue;
      if(spreadToAtr > m_config.maxSpreadToAtrRatio)
      {
         res.rejectionReason = StringFormat("REJECTED: Spread/ATR ratio %.2f exceeds max %.2f (execution friction excessive).",
                                            spreadToAtr, m_config.maxSpreadToAtrRatio);
         return res;
      }
   }

   // 5. Gold Adaptive Position Sizing
   const S_GoldContractSpec *spec = m_symbolDiscovery->GetContractSpec();
   double equity = m_config.equityCompounding ? AccountInfoDouble(ACCOUNT_EQUITY) : AccountInfoDouble(ACCOUNT_BALANCE);
   double maxTradeDollarRisk = equity * (m_config.riskPerTradePct / 100.0);

   double tickSize = spec->tickSize;
   double tickValue = spec->tickValue;
   double minLot = spec->minVolume;
   double maxLot = spec->maxVolume;
   double lotStep = spec->volumeStep;

   if(tickSize <= 0.0 || tickValue <= 0.0)
   {
      res.rejectionReason = "REJECTED: Broker gold tick specifications unavailable.";
      return res;
   }

   double ticksAtRisk = slDistance / tickSize;
   double riskPerLot = ticksAtRisk * tickValue;

   if(riskPerLot <= 0.0)
   {
      res.rejectionReason = "REJECTED: Mathematical risk per lot calculation failed.";
      return res;
   }

   // Calculate raw lot size and round DOWN to nearest step
   double rawVolume = maxTradeDollarRisk / riskPerLot;
   double steppedVolume = MathFloor(rawVolume / lotStep) * lotStep;

   // 6. MANDATORY MINIMUM LOT RISK REJECTION
   if(steppedVolume < minLot)
   {
      double minLotRiskDollars = minLot * riskPerLot;
      res.rejectionReason = StringFormat("REJECTED FOR CAPITAL PRESERVATION: Minimum permitted lot (%.2f) risks $%.2f, which exceeds authorized budget $%.2f (%.2f%% equity). Trade skipped.",
                                         minLot, minLotRiskDollars, maxTradeDollarRisk, m_config.riskPerTradePct);
      PrintFormat("[GOLD RISK] %s", res.rejectionReason);
      return res;
   }

   if(steppedVolume > maxLot) steppedVolume = maxLot;
   if(steppedVolume > 20.0) steppedVolume = 20.0; // Absolute safety lot ceiling on gold

   double finalRisk = steppedVolume * riskPerLot;
   if(finalRisk > maxTradeDollarRisk * 1.02)
   {
      res.rejectionReason = StringFormat("REJECTED: Volume %.2f risk $%.2f exceeds limit $%.2f.", steppedVolume, finalRisk, maxTradeDollarRisk);
      return res;
   }

   // 7. Margin verification
   double reqMargin = 0.0;
   if(OrderCalcMargin(orderType, symbol, steppedVolume, entryPrice, reqMargin))
   {
      double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
      if(reqMargin > freeMargin * 0.50) // Demand 50% margin safety buffer on Gold
      {
         res.rejectionReason = StringFormat("REJECTED: Insufficient free margin buffer for gold trade. Required: $%.2f, Free: $%.2f", reqMargin, freeMargin);
         return res;
      }
   }

   res.isApproved = true;
   res.calculatedVolume = steppedVolume;
   res.monetaryRisk = finalRisk;
   res.rejectionReason = "APPROVED";
   return res;
}

void CGoldRiskManager::OnTradeClosed(const double netPnL)
{
   if(netPnL < 0.0)
   {
      m_consecutiveLosses++;
      PrintFormat("[GOLD RISK] Trade closed with loss ($%.2f). Streak: %d / %d", netPnL, m_consecutiveLosses, m_config.maxConsecutiveLosses);
      if(m_consecutiveLosses >= m_config.maxConsecutiveLosses)
      {
         m_cooldownUntil = TimeCurrent() + (m_config.cooldownMinutes * 60);
         PrintFormat("[GOLD RISK] MANDATORY COOLDOWN TRIGGERED until %s (%d mins).",
                     TimeToString(m_cooldownUntil, TIME_DATE|TIME_SECONDS), m_config.cooldownMinutes);
      }
   }
   else
   {
      if(m_consecutiveLosses > 0)
      {
         PrintFormat("[GOLD RISK] Profitable trade ($%.2f). Loss streak reset to 0.", netPnL);
         m_consecutiveLosses = 0;
      }
   }
   UpdateMetrics();
}

void CGoldRiskManager::TripCircuitBreaker(const string reason)
{
   m_circuitBreakerTripped = true;
   m_circuitBreakerReason = reason;
   Alert("[APEX GOLD CRITICAL] CIRCUIT BREAKER TRIPPED: " + reason);
   PrintFormat("[APEX GOLD CRITICAL] CIRCUIT BREAKER TRIPPED: %s", reason);
}

void CGoldRiskManager::ResetCircuitBreaker()
{
   m_circuitBreakerTripped = false;
   m_circuitBreakerReason = "";
   m_peakEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   m_dayStartEquity = m_peakEquity;
   m_consecutiveLosses = 0;
   m_cooldownUntil = 0;
   Print("[GOLD RISK] Circuit Breaker reset by user authorization.");
}
