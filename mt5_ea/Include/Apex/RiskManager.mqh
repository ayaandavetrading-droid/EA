//+------------------------------------------------------------------+
//|                                                  RiskManager.mqh |
//|                                  Apex AI Trader Risk Engine v1.0 |
//|                         Independent Hard Capital Preservation    |
//+------------------------------------------------------------------+
#property copyright "Apex AI Quantitative Team"
#property link      "https://apexaitrader.internal"
#property strict

//--- Risk Control Settings Structure
struct S_RiskConfig
{
   double   maxRiskPerTradePct;       // e.g. 0.75% of account equity
   double   maxTotalOpenRiskPct;      // e.g. 3.00% across all positions
   double   maxDailyLossPct;          // e.g. 2.00% daily loss circuit breaker
   double   maxWeeklyLossPct;         // e.g. 5.00% weekly loss circuit breaker
   double   maxAccountDrawdownPct;    // e.g. 6.00% peak-to-trough circuit breaker
   double   minFreeMarginRatio;       // e.g. 250.0% minimum margin level
   int      maxSpreadPoints;          // Max allowable spread in points
   double   maxSpreadToAtrRatio;      // Max allowable spread as % of ATR (e.g. 0.25)
   int      maxSlippagePoints;        // Max execution slippage
   int      maxSimultaneousTrades;    // Max open trades across all symbols
   int      maxTradesPerSymbol;       // Max trades on any single symbol (hedging/netting)
   int      maxCorrelatedCurrency;    // Max positions sharing base/quote currency (e.g. 2)
   int      maxConsecutiveLosses;     // Streak limit triggering cooldown
   int      cooldownPeriodMinutes;    // Mandatory cooling off period in minutes
   bool     equityCompounding;        // If true, sizes from current equity; else initial balance
   double   minLotSizePermitted;      // Configurable broker minimum (0.01 or 0.05)
   double   maxLotSizeCap;            // Absolute safety lot ceiling
};

//--- Trade Decision Validation Result
struct S_RiskCheckResult
{
   bool     isApproved;
   double   calculatedVolume;
   double   monetaryRisk;
   string   rejectionReason;
};

//+------------------------------------------------------------------+
//| Class CRiskManager                                               |
//| Enforces independent, immutable capital protection rules         |
//+------------------------------------------------------------------+
class CRiskManager
{
private:
   S_RiskConfig      m_config;
   double            m_peakEquity;
   double            m_dayStartEquity;
   datetime          m_lastDayReset;
   int               m_consecutiveLosses;
   datetime          m_cooldownUntil;
   bool              m_circuitBreakerTripped;
   string            m_circuitBreakerReason;

public:
   CRiskManager();
   ~CRiskManager();

   void              Init(const S_RiskConfig &config);
   void              UpdateEquityMetrics();
   S_RiskCheckResult ValidateOrder(const string symbol, 
                                   const ENUM_ORDER_TYPE orderType, 
                                   const double entryPrice, 
                                   const double stopLoss, 
                                   const double currentAtr,
                                   const int currentSpread);
                                   
   bool              CanOpenNewPositions(string &outReason);
   void              OnTradeClosed(const double profit, const double loss);
   void              TripCircuitBreaker(const string reason);
   void              ResetCircuitBreaker();
   
   //--- Getters
   double            GetPeakEquity() const { return m_peakEquity; }
   double            GetCurrentDrawdownPct() const;
   double            GetDailyPnLPct() const;
   int               GetConsecutiveLosses() const { return m_consecutiveLosses; }
   bool              IsCooldownActive() const { return (TimeCurrent() < m_cooldownUntil); }
   datetime          GetCooldownExpiry() const { return m_cooldownUntil; }
   bool              IsCircuitBreakerTripped() const { return m_circuitBreakerTripped; }
   string            GetCircuitBreakerReason() const { return m_circuitBreakerReason; }
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CRiskManager::CRiskManager()
{
   m_peakEquity = 0.0;
   m_dayStartEquity = 0.0;
   m_lastDayReset = 0;
   m_consecutiveLosses = 0;
   m_cooldownUntil = 0;
   m_circuitBreakerTripped = false;
   m_circuitBreakerReason = "";
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CRiskManager::~CRiskManager()
{
}

//+------------------------------------------------------------------+
//| Initialize Config & State                                        |
//+------------------------------------------------------------------+
void CRiskManager::Init(const S_RiskConfig &config)
{
   m_config = config;
   m_peakEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   m_dayStartEquity = m_peakEquity;
   m_lastDayReset = TimeCurrent();
   m_consecutiveLosses = 0;
   m_cooldownUntil = 0;
   m_circuitBreakerTripped = false;
   m_circuitBreakerReason = "";
}

//+------------------------------------------------------------------+
//| Track High-Water Mark and Day Boundary Daily PnL                 |
//+------------------------------------------------------------------+
void CRiskManager::UpdateEquityMetrics()
{
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   
   // Track peak equity (high-water mark)
   if(currentEquity > m_peakEquity)
   {
      m_peakEquity = currentEquity;
   }
   
   // Day boundary check (00:00 server time reset)
   MqlDateTime dtCurrent, dtLast;
   TimeToStruct(TimeCurrent(), dtCurrent);
   TimeToStruct(m_lastDayReset, dtLast);
   
   if(dtCurrent.day != dtLast.day)
   {
      m_dayStartEquity = currentEquity;
      m_lastDayReset = TimeCurrent();
      PrintFormat("[RISK ENGINE] New trading day initialized. Baseline Equity: %.2f", m_dayStartEquity);
   }
   
   // Verify Circuit Breakers
   double peakDD = GetCurrentDrawdownPct();
   if(peakDD >= m_config.maxAccountDrawdownPct)
   {
      TripCircuitBreaker(StringFormat("Max Peak Drawdown Breached (%.2f%% >= %.2f%%)", peakDD, m_config.maxAccountDrawdownPct));
   }
   
   double dailyLoss = GetDailyPnLPct();
   if(dailyLoss <= -m_config.maxDailyLossPct)
   {
      TripCircuitBreaker(StringFormat("Daily Loss Limit Breached (%.2f%% <= -%.2f%%)", dailyLoss, m_config.maxDailyLossPct));
   }
}

//+------------------------------------------------------------------+
//| Calculate Current Peak-to-Trough Drawdown Percentage              |
//+------------------------------------------------------------------+
double CRiskManager::GetCurrentDrawdownPct() const
{
   if(m_peakEquity <= 0.0) return 0.0;
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   if(currentEquity >= m_peakEquity) return 0.0;
   return ((m_peakEquity - currentEquity) / m_peakEquity) * 100.0;
}

//+------------------------------------------------------------------+
//| Calculate Current Day PnL Percentage                             |
//+------------------------------------------------------------------+
double CRiskManager::GetDailyPnLPct() const
{
   if(m_dayStartEquity <= 0.0) return 0.0;
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   return ((currentEquity - m_dayStartEquity) / m_dayStartEquity) * 100.0;
}

//+------------------------------------------------------------------+
//| Check if New Positions are Allowed System-Wide                   |
//+------------------------------------------------------------------+
bool CRiskManager::CanOpenNewPositions(string &outReason)
{
   UpdateEquityMetrics();

   if(m_circuitBreakerTripped)
   {
      outReason = "CRITICAL CIRCUIT BREAKER TRIPPED: " + m_circuitBreakerReason;
      return false;
   }

   if(IsCooldownActive())
   {
      int remainSec = (int)(m_cooldownUntil - TimeCurrent());
      outReason = StringFormat("COOLDOWN ACTIVE (%d minutes remaining after %d consecutive losses)", 
                               remainSec / 60, m_consecutiveLosses);
      return false;
   }

   // Margin level safety
   double marginLevel = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   if(marginLevel > 0.0 && marginLevel < m_config.minFreeMarginRatio)
   {
      outReason = StringFormat("FREE MARGIN LEVEL TOO LOW (%.1f%% < %.1f%%)", marginLevel, m_config.minFreeMarginRatio);
      return false;
   }

   // Total positions count
   int totalPositions = PositionsTotal();
   if(totalPositions >= m_config.maxSimultaneousTrades)
   {
      outReason = StringFormat("MAX SIMULTANEOUS TRADES REACHED (%d / %d)", totalPositions, m_config.maxSimultaneousTrades);
      return false;
   }

   return true;
}

//+------------------------------------------------------------------+
//| Validate Specific Order: Stop-Loss, Volume, Risk, Spread, ATR    |
//+------------------------------------------------------------------+
S_RiskCheckResult CRiskManager::ValidateOrder(const string symbol, 
                                             const ENUM_ORDER_TYPE orderType, 
                                             const double entryPrice, 
                                             const double stopLoss, 
                                             const double currentAtr,
                                             const int currentSpread)
{
   S_RiskCheckResult res;
   res.isApproved = false;
   res.calculatedVolume = 0.0;
   res.monetaryRisk = 0.0;
   res.rejectionReason = "";

   // 1. Check Global System Conditions
   string sysReason = "";
   if(!CanOpenNewPositions(sysReason))
   {
      res.rejectionReason = sysReason;
      return res;
   }

   // 2. Protective Stop-Loss Presence & Validity
   if(stopLoss <= 0.0)
   {
      res.rejectionReason = "REJECTED: Zero or negative Stop-Loss. Protective SL is strictly mandatory.";
      return res;
   }

   double slDistance = MathAbs(entryPrice - stopLoss);
   if(slDistance <= Point())
   {
      res.rejectionReason = "REJECTED: Stop-Loss distance is too close to entry or zero.";
      return res;
   }

   // Directional SL orientation
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

   // 3. Spread vs Volatility Constraint
   if(currentSpread > m_config.maxSpreadPoints)
   {
      res.rejectionReason = StringFormat("REJECTED: Spread %d points exceeds maximum ceiling %d points.", 
                                         currentSpread, m_config.maxSpreadPoints);
      return res;
   }

   if(currentAtr > 0.0)
   {
      double spreadInPrice = currentSpread * SymbolInfoDouble(symbol, SYMBOL_POINT);
      double spreadToAtr = spreadInPrice / currentAtr;
      if(spreadToAtr > m_config.maxSpreadToAtrRatio)
      {
         res.rejectionReason = StringFormat("REJECTED: Spread/ATR ratio %.2f exceeds max allowable %.2f (execution cost too high).",
                                            spreadToAtr, m_config.maxSpreadToAtrRatio);
         return res;
      }
   }

   // 4. Broker Symbol Stop Level & Freeze Level Checks
   int stopLevel = (int)SymbolInfoInteger(symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double pointVal = SymbolInfoDouble(symbol, SYMBOL_POINT);
   if(stopLevel > 0 && slDistance < (stopLevel * pointVal))
   {
      res.rejectionReason = StringFormat("REJECTED: Stop distance (%.5f) is tighter than broker stop level (%d points).",
                                         slDistance, stopLevel);
      return res;
   }

   // 5. Symbol & Correlation Exposure Caps
   int symbolPosCount = 0;
   int currencyExposure = 0;
   string baseCurr = SymbolInfoString(symbol, SYMBOL_CURRENCY_BASE);
   string quoteCurr = SymbolInfoString(symbol, SYMBOL_CURRENCY_PROFIT);

   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         string posSymbol = PositionGetString(POSITION_SYMBOL);
         if(posSymbol == symbol) symbolPosCount++;
         
         string posBase = SymbolInfoString(posSymbol, SYMBOL_CURRENCY_BASE);
         string posQuote = SymbolInfoString(posSymbol, SYMBOL_CURRENCY_PROFIT);
         if(posBase == baseCurr || posQuote == baseCurr || posBase == quoteCurr || posQuote == quoteCurr)
         {
            currencyExposure++;
         }
      }
   }

   if(symbolPosCount >= m_config.maxTradesPerSymbol)
   {
      res.rejectionReason = StringFormat("REJECTED: Max open trades on %s reached (%d / %d).",
                                         symbol, symbolPosCount, m_config.maxTradesPerSymbol);
      return res;
   }

   if(currencyExposure >= m_config.maxCorrelatedCurrency)
   {
      res.rejectionReason = StringFormat("REJECTED: Correlated currency exposure reached (%d pairs sharing %s/%s).",
                                         currencyExposure, baseCurr, quoteCurr);
      return res;
   }

   // 6. Strict Capital-Based Position Sizing (No Martingale, No Guesswork)
   double basisCapital = m_config.equityCompounding ? AccountInfoDouble(ACCOUNT_EQUITY) : AccountInfoDouble(ACCOUNT_BALANCE);
   double maxTradeRiskMoney = basisCapital * (m_config.maxRiskPerTradePct / 100.0);

   // Tick value and lot step specifications
   double tickSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
   double minLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);

   if(tickSize <= 0.0 || tickValue <= 0.0)
   {
      res.rejectionReason = "REJECTED: Broker tick specification invalid or unavailable.";
      return res;
   }

   // Calculate monetary risk per 1.0 standard lot at this SL distance
   double ticksAtRisk = slDistance / tickSize;
   double riskPerLot = ticksAtRisk * tickValue;

   if(riskPerLot <= 0.0)
   {
      res.rejectionReason = "REJECTED: Mathematical risk per lot calculation resulted in zero or negative value.";
      return res;
   }

   // Raw lot calculation
   double rawVolume = maxTradeRiskMoney / riskPerLot;

   // Enforce step precision: MUST ROUND DOWN to prevent exceeding risk limit
   double steppedVolume = MathFloor(rawVolume / lotStep) * lotStep;

   // Safety minimum check: NEVER round up if min lot exceeds permitted risk!
   if(steppedVolume < minLot)
   {
      double minLotRisk = minLot * riskPerLot;
      res.rejectionReason = StringFormat("REJECTED: Minimum permitted lot size (%.2f) entails $%.2f risk, exceeding strict limit $%.2f (%.2f%%). Trade skipped for capital preservation.",
                                         minLot, minLotRisk, maxTradeRiskMoney, m_config.maxRiskPerTradePct);
      return res;
   }

   // Clamp against broker and config ceilings
   if(steppedVolume > maxLot) steppedVolume = maxLot;
   if(steppedVolume > m_config.maxLotSizeCap) steppedVolume = m_config.maxLotSizeCap;

   // Final monetary risk check on stepped volume
   double finalMonetaryRisk = steppedVolume * riskPerLot;
   if(finalMonetaryRisk > maxTradeRiskMoney * 1.02) // allow tiny rounding delta only
   {
      res.rejectionReason = StringFormat("REJECTED: Stepped volume %.2f risk $%.2f exceeds maximum authorized risk $%.2f.",
                                         steppedVolume, finalMonetaryRisk, maxTradeRiskMoney);
      return res;
   }

   // 7. Margin Requirement Verification
   double requiredMargin = 0.0;
   if(!OrderCalcMargin(orderType, symbol, steppedVolume, entryPrice, requiredMargin))
   {
      res.rejectionReason = "REJECTED: Failed to calculate required margin with broker API.";
      return res;
   }

   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   if(requiredMargin > (freeMargin * 0.70)) // Require 30% margin buffer
   {
      res.rejectionReason = StringFormat("REJECTED: Insufficient free margin buffer. Required: $%.2f, Free: $%.2f",
                                         requiredMargin, freeMargin);
      return res;
   }

   // All validation gates passed!
   res.isApproved = true;
   res.calculatedVolume = steppedVolume;
   res.monetaryRisk = finalMonetaryRisk;
   res.rejectionReason = "APPROVED";
   return res;
}

//+------------------------------------------------------------------+
//| Log Trade Outcome & Manage Loss Streaks and Cooldowns            |
//+------------------------------------------------------------------+
void CRiskManager::OnTradeClosed(const double profit, const double loss)
{
   if(profit + loss < 0.0)
   {
      m_consecutiveLosses++;
      PrintFormat("[RISK ENGINE] Trade closed with loss. Consecutive losses: %d / %d", 
                  m_consecutiveLosses, m_config.maxConsecutiveLosses);

      if(m_consecutiveLosses >= m_config.maxConsecutiveLosses)
      {
         m_cooldownUntil = TimeCurrent() + (m_config.cooldownPeriodMinutes * 60);
         PrintFormat("[RISK ENGINE] MANDATORY COOLDOWN TRIGGERED until %s (%d mins). Ceasing all new entries.",
                     TimeToString(m_cooldownUntil, TIME_DATE|TIME_SECONDS), m_config.cooldownPeriodMinutes);
      }
   }
   else
   {
      // Reset streak upon winning or breakeven trade
      if(m_consecutiveLosses > 0)
      {
         PrintFormat("[RISK ENGINE] Profitable trade closed. Consecutive losses reset to 0 (was %d).", m_consecutiveLosses);
         m_consecutiveLosses = 0;
      }
   }
   
   UpdateEquityMetrics();
}

//+------------------------------------------------------------------+
//| Circuit Breaker Trip                                             |
//+------------------------------------------------------------------+
void CRiskManager::TripCircuitBreaker(const string reason)
{
   m_circuitBreakerTripped = true;
   m_circuitBreakerReason = reason;
   Alert("[APEX AI CRITICAL] CIRCUIT BREAKER TRIPPED: " + reason);
   PrintFormat("[APEX AI CRITICAL] CIRCUIT BREAKER TRIPPED: %s. All new automated trades HALTED.", reason);
}

//+------------------------------------------------------------------+
//| Manual Reset of Circuit Breaker                                  |
//+------------------------------------------------------------------+
void CRiskManager::ResetCircuitBreaker()
{
   m_circuitBreakerTripped = false;
   m_circuitBreakerReason = "";
   m_peakEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   m_dayStartEquity = m_peakEquity;
   m_consecutiveLosses = 0;
   m_cooldownUntil = 0;
   Print("[RISK ENGINE] Circuit Breaker manually reset by user authorization.");
}
