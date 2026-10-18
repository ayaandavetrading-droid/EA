//+------------------------------------------------------------------+
//|                                                  StopManager.mqh |
//|                                  Apex AI Trader Stop Management  |
//|                    Dynamic ATR Stops, Break-Even & Trailing Risk |
//+------------------------------------------------------------------+
#property copyright "Apex AI Quantitative Team"
#property link      "https://apexaitrader.internal"
#property strict

#include <Trade\Trade.mqh>

struct S_StopConfig
{
   double   atrMultiplierSL;          // e.g. 1.5x ATR for Initial Stop Loss
   double   atrMultiplierTP;          // e.g. 2.5x ATR for Take Profit (1.67 R:R)
   double   minRewardRiskRatio;       // e.g. 1.50 minimum R:R threshold
   bool     useBreakEven;             // Enable automated break-even movement
   double   breakEvenTriggerR;        // Move to BE after reaching 1.0R profit
   double   breakEvenOffsetPips;      // Commission & spread buffer (e.g. +1.5 pips)
   bool     useTrailingStop;          // Dynamic trailing stop
   double   trailingAtrMultiplier;    // e.g. 1.2x ATR trailing distance
   double   trailingActivationR;      // Activate trailing after reaching 1.5R profit
   bool     usePartialClose;          // Enable partial profit taking
   double   partialCloseR;            // Partial exit trigger at 1.3R
   double   partialClosePct;          // Percentage to close (e.g. 50%)
   int      maxHoldingBarsM5;         // Max holding duration in M5 bars (e.g. 36 = 3 hours)
};

class CStopManager
{
private:
   S_StopConfig   m_config;
   CTrade         m_trade;

public:
   CStopManager();
   ~CStopManager();

   void           Init(const S_StopConfig &config, ulong magicNumber);
   
   //--- Stop Loss and Take Profit Levels Calculation
   void           CalculateAtrStops(const string symbol, 
                                   const ENUM_ORDER_TYPE orderType, 
                                   const double entryPrice, 
                                   const double atrValue, 
                                   double &outSL, 
                                   double &outTP);

   void           CalculateStructureStops(const string symbol, 
                                         const ENUM_ORDER_TYPE orderType, 
                                         const double entryPrice, 
                                         const double swingLow, 
                                         const double swingHigh, 
                                         const double atrValue, 
                                         double &outSL, 
                                         double &outTP);

   //--- Dynamic Position Management Loop
   void           ManageOpenPositions(const ulong magicNumber);

private:
   void           ProcessPosition(ulong ticket, const string symbol);
   bool           ModifyStopLoss(ulong ticket, const string symbol, double newSL, double currentTP);
   bool           ExecutePartialClose(ulong ticket, const string symbol, double closeRatio);
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CStopManager::CStopManager()
{
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CStopManager::~CStopManager()
{
}

//+------------------------------------------------------------------+
//| Initialize                                                       |
//+------------------------------------------------------------------+
void CStopManager::Init(const S_StopConfig &config, ulong magicNumber)
{
   m_config = config;
   m_trade.SetExpertMagicNumber(magicNumber);
   m_trade.SetDeviationInPoints(10);
   m_trade.SetTypeFilling(ORDER_FILLING_FOK);
}

//+------------------------------------------------------------------+
//| Calculate ATR-based Protective Stops                             |
//+------------------------------------------------------------------+
void CStopManager::CalculateAtrStops(const string symbol, 
                                    const ENUM_ORDER_TYPE orderType, 
                                    const double entryPrice, 
                                    const double atrValue, 
                                    double &outSL, 
                                    double &outTP)
{
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   double slDist = MathMax(atrValue * m_config.atrMultiplierSL, 10.0 * point);
   double tpDist = slDist * MathMax(m_config.atrMultiplierTP / m_config.atrMultiplierSL, m_config.minRewardRiskRatio);

   if(orderType == ORDER_TYPE_BUY)
   {
      outSL = NormalizeDouble(entryPrice - slDist, digits);
      outTP = NormalizeDouble(entryPrice + tpDist, digits);
   }
   else if(orderType == ORDER_TYPE_SELL)
   {
      outSL = NormalizeDouble(entryPrice + slDist, digits);
      outTP = NormalizeDouble(entryPrice - tpDist, digits);
   }
}

//+------------------------------------------------------------------+
//| Calculate Swing Structure Stops with ATR Buffer                  |
//+------------------------------------------------------------------+
void CStopManager::CalculateStructureStops(const string symbol, 
                                          const ENUM_ORDER_TYPE orderType, 
                                          const double entryPrice, 
                                          const double swingLow, 
                                          const double swingHigh, 
                                          const double atrValue, 
                                          double &outSL, 
                                          double &outTP)
{
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   double buffer = MathMax(atrValue * 0.25, 5.0 * point);

   if(orderType == ORDER_TYPE_BUY)
   {
      double rawSL = swingLow - buffer;
      double slDist = entryPrice - rawSL;
      if(slDist < 10.0 * point) slDist = atrValue * m_config.atrMultiplierSL;
      outSL = NormalizeDouble(entryPrice - slDist, digits);
      outTP = NormalizeDouble(entryPrice + (slDist * m_config.minRewardRiskRatio), digits);
   }
   else
   {
      double rawSL = swingHigh + buffer;
      double slDist = rawSL - entryPrice;
      if(slDist < 10.0 * point) slDist = atrValue * m_config.atrMultiplierSL;
      outSL = NormalizeDouble(entryPrice + slDist, digits);
      outTP = NormalizeDouble(entryPrice - (slDist * m_config.minRewardRiskRatio), digits);
   }
}

//+------------------------------------------------------------------+
//| Main Position Monitoring Loop (Break-even, Trailing, Exits)      |
//+------------------------------------------------------------------+
void CStopManager::ManageOpenPositions(const ulong magicNumber)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0) continue;

      if(PositionGetInteger(POSITION_MAGIC) != (long)magicNumber) continue;

      string symbol = PositionGetString(POSITION_SYMBOL);
      ProcessPosition(ticket, symbol);
   }
}

//+------------------------------------------------------------------+
//| Process Individual Position Rules                                |
//+------------------------------------------------------------------+
void CStopManager::ProcessPosition(ulong ticket, const string symbol)
{
   ENUM_POSITION_TYPE posType = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
   double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
   double currentSL = PositionGetDouble(POSITION_SL);
   double currentTP = PositionGetDouble(POSITION_TP);
   double currentPrice = (posType == POSITION_TYPE_BUY) ? SymbolInfoDouble(symbol, SYMBOL_BID) : SymbolInfoDouble(symbol, SYMBOL_ASK);
   double currentProfit = PositionGetDouble(POSITION_PROFIT);
   double volume = PositionGetDouble(POSITION_VOLUME);
   datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
   string comment = PositionGetString(POSITION_COMMENT);

   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   double pipVal = (digits == 3 || digits == 5) ? point * 10.0 : point;
   int stopLevel = (int)SymbolInfoInteger(symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double minStopDist = stopLevel * point;

   double initialRiskDist = MathAbs(openPrice - currentSL);
   if(initialRiskDist <= 0.0) return; // Cannot calculate R without initial SL

   // Profit in terms of R-Multiple
   double currentR = 0.0;
   if(posType == POSITION_TYPE_BUY)
   {
      currentR = (currentPrice - openPrice) / initialRiskDist;
   }
   else
   {
      currentR = (openPrice - currentPrice) / initialRiskDist;
   }

   // 1. Time-Based Stagnation Exit Check
   if(m_config.maxHoldingBarsM5 > 0)
   {
      int elapsedSeconds = (int)(TimeCurrent() - openTime);
      int elapsedM5Bars = elapsedSeconds / 300;
      if(elapsedM5Bars >= m_config.maxHoldingBarsM5 && currentProfit <= 0.0)
      {
         PrintFormat("[STOP ENGINE] Max holding time reached (%d M5 bars) on ticket #%I64u. Closing stagnant position to liberate capital.",
                     elapsedM5Bars, ticket);
         m_trade.PositionClose(ticket);
         return;
      }
   }

   // 2. Partial Profit Taking (e.g., at 1.3R)
   if(m_config.usePartialClose && currentR >= m_config.partialCloseR && StringFind(comment, "[PARTIAL_TAKEN]") < 0)
   {
      if(ExecutePartialClose(ticket, symbol, m_config.partialClosePct / 100.0))
      {
         PrintFormat("[STOP ENGINE] Partial profit taken (%.1f%%) on ticket #%I64u at %.2fR.", 
                     m_config.partialClosePct, ticket, currentR);
      }
   }

   // 3. Automated Break-Even Movement (with Commission Offset)
   if(m_config.useBreakEven && currentR >= m_config.breakEvenTriggerR)
   {
      double offsetPrice = m_config.breakEvenOffsetPips * pipVal;
      double candidateBE = 0.0;

      if(posType == POSITION_TYPE_BUY)
      {
         candidateBE = NormalizeDouble(openPrice + offsetPrice, digits);
         // Move to BE only if candidateBE is higher than current SL (NEVER move SL backwards)
         if(candidateBE > currentSL + point && (currentPrice - candidateBE) > minStopDist)
         {
            PrintFormat("[STOP ENGINE] Moving BUY #%I64u to Break-Even + %.1f pips (New SL: %.5f)",
                        ticket, m_config.breakEvenOffsetPips, candidateBE);
            ModifyStopLoss(ticket, symbol, candidateBE, currentTP);
            return;
         }
      }
      else
      {
         candidateBE = NormalizeDouble(openPrice - offsetPrice, digits);
         // Move to BE only if candidateBE is lower than current SL (NEVER move SL backwards)
         if((currentSL == 0.0 || candidateBE < currentSL - point) && (candidateBE - currentPrice) > minStopDist)
         {
            PrintFormat("[STOP ENGINE] Moving SELL #%I64u to Break-Even + %.1f pips (New SL: %.5f)",
                        ticket, m_config.breakEvenOffsetPips, candidateBE);
            ModifyStopLoss(ticket, symbol, candidateBE, currentTP);
            return;
         }
      }
   }

   // 4. Dynamic Trailing Stop (Activated after reaching activation threshold)
   if(m_config.useTrailingStop && currentR >= m_config.trailingActivationR)
   {
      // Calculate trailing buffer from ATR or initial risk
      double trailDistance = initialRiskDist * 0.8; // Tighten trailing stop
      double candidateTrailingSL = 0.0;

      if(posType == POSITION_TYPE_BUY)
      {
         candidateTrailingSL = NormalizeDouble(currentPrice - trailDistance, digits);
         // Enforce monotonic tightening: new SL must be strictly greater than current SL
         if(candidateTrailingSL > currentSL + (2.0 * point) && (currentPrice - candidateTrailingSL) > minStopDist)
         {
            PrintFormat("[STOP ENGINE] Trailing BUY #%I64u tightened from %.5f to %.5f", ticket, currentSL, candidateTrailingSL);
            ModifyStopLoss(ticket, symbol, candidateTrailingSL, currentTP);
         }
      }
      else
      {
         candidateTrailingSL = NormalizeDouble(currentPrice + trailDistance, digits);
         // Enforce monotonic tightening: new SL must be strictly lower than current SL
         if((currentSL == 0.0 || candidateTrailingSL < currentSL - (2.0 * point)) && (candidateTrailingSL - currentPrice) > minStopDist)
         {
            PrintFormat("[STOP ENGINE] Trailing SELL #%I64u tightened from %.5f to %.5f", ticket, currentSL, candidateTrailingSL);
            ModifyStopLoss(ticket, symbol, candidateTrailingSL, currentTP);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Safely Modify Stop Loss on Ticket                                |
//+------------------------------------------------------------------+
bool CStopManager::ModifyStopLoss(ulong ticket, const string symbol, double newSL, double currentTP)
{
   if(!m_trade.PositionModify(ticket, newSL, currentTP))
   {
      uint err = GetLastError();
      PrintFormat("[STOP ENGINE ERROR] Failed to modify ticket #%I64u SL to %.5f. Code: %u (%s)",
                  ticket, newSL, err, m_trade.ResultComment());
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Execute Partial Position Close                                   |
//+------------------------------------------------------------------+
bool CStopManager::ExecutePartialClose(ulong ticket, const string symbol, double closeRatio)
{
   double currentVol = PositionGetDouble(POSITION_VOLUME);
   double minLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double lotStep = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);

   double rawCloseVol = currentVol * closeRatio;
   double steppedCloseVol = MathFloor(rawCloseVol / lotStep) * lotStep;

   // Check if remainder meets minimum broker volume
   double remainingVol = currentVol - steppedCloseVol;
   if(steppedCloseVol < minLot || remainingVol < minLot)
   {
      // Cannot partially close due to broker volume constraints
      return false;
   }

   if(m_trade.PositionClosePartial(ticket, steppedCloseVol))
   {
      return true;
   }
   return false;
}
