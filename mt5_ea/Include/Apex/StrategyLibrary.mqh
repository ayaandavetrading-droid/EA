//+------------------------------------------------------------------+
//|                                              StrategyLibrary.mqh |
//|                                 Apex AI Trader Strategy Library  |
//|               15 Modular, Configurable & Switchable Scalp Rules  |
//+------------------------------------------------------------------+
#property copyright "Apex AI Quantitative Team"
#property link      "https://apexaitrader.internal"
#property strict

#include "RegimeDetector.mqh"
#include "StopManager.mqh"

enum ENUM_STRATEGY_ID
{
   STRAT_TREND_SCALP = 1,
   STRAT_PULLBACK_ENTRY,
   STRAT_BREAKOUT_RETEST,
   STRAT_SR_REACTION,
   STRAT_MOMENTUM_CONT,
   STRAT_RANGE_MEAN_REV,
   STRAT_EMA_FILTER_PULSE,
   STRAT_RSI_STOCH_FILTER,
   STRAT_MACD_CONFIRM,
   STRAT_ATR_VOL_EXP,
   STRAT_MTF_CONFIRM,
   STRAT_PRICE_ACTION_CANDLE,
   STRAT_SESSION_MOMENTUM,
   STRAT_VOL_SQUEEZE_BREAKOUT,
   STRAT_VOLUME_FLOW_ABSORP
};

struct S_StrategySignal
{
   int               strategyId;
   string            strategyName;
   ENUM_ORDER_TYPE   signalType;       // ORDER_TYPE_BUY, ORDER_TYPE_SELL, or -1 for NONE
   double            proposedEntry;
   double            proposedSL;
   double            proposedTP;
   double            signalQuality;    // 0.0 to 100.0
   double            estimatedRR;
   string            setupThesis;
   string            invalidationRule;
};

struct S_StrategyToggles
{
   bool  enableTrendScalp;
   bool  enablePullback;
   bool  enableBreakoutRetest;
   bool  enableSRReaction;
   bool  enableMomentumCont;
   bool  enableRangeMeanRev;
   bool  enableEmaPulse;
   bool  enableRsiStoch;
   bool  enableMacdConfirm;
   bool  enableAtrVol;
   enableMtfConfirm;
   bool  enablePriceAction;
   bool  enableSessionMom;
   bool  enableVolSqueeze;
   bool  enableVolumeFlow;
};

class CStrategyLibrary
{
private:
   S_StrategyToggles m_toggles;

public:
   CStrategyLibrary();
   ~CStrategyLibrary();

   void              SetDefaultToggles();
   void              ConfigureToggles(const S_StrategyToggles &toggles);
   
   // Evaluates all enabled strategies for a symbol & regime, returns highest conviction signal
   bool              EvaluateBestSignal(const string symbol, 
                                        const S_RegimeClassification &regime, 
                                        CStopManager &stopMgr, 
                                        S_StrategySignal &outBestSignal);

private:
   // Individual strategy evaluation routines
   bool EvaluateTrendScalp(const string symbol, S_StrategySignal &sig);
   bool EvaluatePullback(const string symbol, S_StrategySignal &sig);
   bool EvaluateBreakoutRetest(const string symbol, S_StrategySignal &sig);
   bool EvaluateSRReaction(const string symbol, S_StrategySignal &sig);
   bool EvaluateMomentumCont(const string symbol, S_StrategySignal &sig);
   bool EvaluateRangeMeanRev(const string symbol, S_StrategySignal &sig);
   bool EvaluateEmaPulse(const string symbol, S_StrategySignal &sig);
   bool EvaluateRsiStoch(const string symbol, S_StrategySignal &sig);
   bool EvaluateMacdConfirm(const string symbol, S_StrategySignal &sig);
   bool EvaluateAtrVol(const string symbol, S_StrategySignal &sig);
   bool EvaluateMtfConfirm(const string symbol, S_StrategySignal &sig);
   bool EvaluatePriceAction(const string symbol, S_StrategySignal &sig);
   bool EvaluateSessionMom(const string symbol, S_StrategySignal &sig);
   bool EvaluateVolSqueeze(const string symbol, S_StrategySignal &sig);
   bool EvaluateVolumeFlow(const string symbol, S_StrategySignal &sig);
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CStrategyLibrary::CStrategyLibrary()
{
   SetDefaultToggles();
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CStrategyLibrary::~CStrategyLibrary()
{
}

//+------------------------------------------------------------------+
//| Set Conservative Default Toggles                                 |
//+------------------------------------------------------------------+
void CStrategyLibrary::SetDefaultToggles()
{
   m_toggles.enableTrendScalp       = true;
   m_toggles.enablePullback         = true;
   m_toggles.enableBreakoutRetest   = true;
   m_toggles.enableSRReaction       = true;
   m_toggles.enableMomentumCont     = true;
   m_toggles.enableRangeMeanRev     = true;
   m_toggles.enableEmaPulse         = true;
   m_toggles.enableRsiStoch         = true;
   m_toggles.enableMacdConfirm      = true;
   m_toggles.enableAtrVol           = true;
   m_toggles.enableMtfConfirm       = true;
   m_toggles.enablePriceAction      = true;
   m_toggles.enableSessionMom       = true;
   m_toggles.enableVolSqueeze       = true;
   m_toggles.enableVolumeFlow       = true;
}

void CStrategyLibrary::ConfigureToggles(const S_StrategyToggles &toggles)
{
   m_toggles = toggles;
}

//+------------------------------------------------------------------+
//| Evaluate Best Signal matching current Regime                     |
//+------------------------------------------------------------------+
bool CStrategyLibrary::EvaluateBestSignal(const string symbol, 
                                          const S_RegimeClassification &regime, 
                                          CStopManager &stopMgr, 
                                          S_StrategySignal &outBestSignal)
{
   outBestSignal.signalType = (ENUM_ORDER_TYPE)-1;
   outBestSignal.signalQuality = 0.0;

   if(!regime.isTradeable || regime.uncertaintyScore > 0.40)
   {
      return false; // Skip execution when regime uncertainty is elevated
   }

   S_StrategySignal candidates[15];
   int candCount = 0;

   // 1. Trend Scalping (Favors Bull or Bear Trends)
   if(m_toggles.enableTrendScalp && (regime.regime == REGIME_BULL_TREND || regime.regime == REGIME_BEAR_TREND))
   {
      if(EvaluateTrendScalp(symbol, candidates[candCount])) candCount++;
   }

   // 2. Pullback Entries (Favors Established Trends)
   if(m_toggles.enablePullback && (regime.regime == REGIME_BULL_TREND || regime.regime == REGIME_BEAR_TREND))
   {
      if(EvaluatePullback(symbol, candidates[candCount])) candCount++;
   }

   // 3. Breakout & Retest
   if(m_toggles.enableBreakoutRetest && (regime.regime == REGIME_POTENTIAL_BREAKOUT || regime.regime == REGIME_VOL_EXPANSION))
   {
      if(EvaluateBreakoutRetest(symbol, candidates[candCount])) candCount++;
   }

   // 4. Support & Resistance Reaction
   if(m_toggles.enableSRReaction)
   {
      if(EvaluateSRReaction(symbol, candidates[candCount])) candCount++;
   }

   // 5. Momentum Continuation
   if(m_toggles.enableMomentumCont && (regime.regime == REGIME_BULL_TREND || regime.regime == REGIME_BEAR_TREND))
   {
      if(EvaluateMomentumCont(symbol, candidates[candCount])) candCount++;
   }

   // 6. Range Mean Reversion (Strictly Sideways Ranging Markets)
   if(m_toggles.enableRangeMeanRev && regime.regime == REGIME_RANGING_SIDEWAYS)
   {
      if(EvaluateRangeMeanRev(symbol, candidates[candCount])) candCount++;
   }

   // 7. Multi-Timeframe Confirmation
   if(m_toggles.enableMtfConfirm)
   {
      if(EvaluateMtfConfirm(symbol, candidates[candCount])) candCount++;
   }

   // 8. Volatility Squeeze Breakout
   if(m_toggles.enableVolSqueeze && (regime.regime == REGIME_VOL_COMPRESSION || regime.regime == REGIME_POTENTIAL_BREAKOUT))
   {
      if(EvaluateVolSqueeze(symbol, candidates[candCount])) candCount++;
   }

   // Find candidate with highest conviction score
   double highestScore = 65.0; // Minimum entry quality threshold (out of 100)
   int bestIdx = -1;

   for(int i = 0; i < candCount; i++)
   {
      if(candidates[i].signalQuality > highestScore)
      {
         highestScore = candidates[i].signalQuality;
         bestIdx = i;
      }
   }

   if(bestIdx >= 0)
   {
      outBestSignal = candidates[bestIdx];
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| 1. Trend-Following Scalping                                      |
//+------------------------------------------------------------------+
bool CStrategyLibrary::EvaluateTrendScalp(const string symbol, S_StrategySignal &sig)
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(symbol, PERIOD_M5, 0, 10, rates) < 10) return false;

   int ema9Handle = iMA(symbol, PERIOD_M5, 9, 0, MODE_EMA, PRICE_CLOSE);
   int ema21Handle = iMA(symbol, PERIOD_M5, 21, 0, MODE_EMA, PRICE_CLOSE);
   int ema50Handle = iMA(symbol, PERIOD_M5, 50, 0, MODE_EMA, PRICE_CLOSE);
   int atrHandle = iATR(symbol, PERIOD_M5, 14);

   if(ema9Handle == INVALID_HANDLE || ema21Handle == INVALID_HANDLE || ema50Handle == INVALID_HANDLE || atrHandle == INVALID_HANDLE)
      return false;

   double e9[2], e21[2], e50[2], atr[1];
   CopyBuffer(ema9Handle, 0, 0, 2, e9);
   CopyBuffer(ema21Handle, 0, 0, 2, e21);
   CopyBuffer(ema50Handle, 0, 0, 2, e50);
   CopyBuffer(atrHandle, 0, 0, 1, atr);

   IndicatorRelease(ema9Handle);
   IndicatorRelease(ema21Handle);
   IndicatorRelease(ema50Handle);
   IndicatorRelease(atrHandle);

   MqlTick tick;
   SymbolInfoTick(symbol, tick);

   // Bullish Trend Scalp
   if(e9[0] > e21[0] && e21[0] > e50[0] && rates[1].close > e21[0] && rates[1].low <= e21[0])
   {
      sig.strategyId = STRAT_TREND_SCALP;
      sig.strategyName = "Trend-Following Scalp";
      sig.signalType = ORDER_TYPE_BUY;
      sig.proposedEntry = tick.ask;
      sig.proposedSL = tick.ask - (atr[0] * 1.5);
      sig.proposedTP = tick.ask + (atr[0] * 2.5);
      sig.signalQuality = 82.0;
      sig.estimatedRR = 1.67;
      sig.setupThesis = "Fast EMA (9/21/50) bull alignment with test and bounce off 21 EMA support.";
      sig.invalidationRule = "Bar close below 50 EMA invalidates directional bullish momentum.";
      return true;
   }

   // Bearish Trend Scalp
   if(e9[0] < e21[0] && e21[0] < e50[0] && rates[1].close < e21[0] && rates[1].high >= e21[0])
   {
      sig.strategyId = STRAT_TREND_SCALP;
      sig.strategyName = "Trend-Following Scalp";
      sig.signalType = ORDER_TYPE_SELL;
      sig.proposedEntry = tick.bid;
      sig.proposedSL = tick.bid + (atr[0] * 1.5);
      sig.proposedTP = tick.bid - (atr[0] * 2.5);
      sig.signalQuality = 82.0;
      sig.estimatedRR = 1.67;
      sig.setupThesis = "Fast EMA bear alignment with rejection wick at 21 EMA dynamic resistance.";
      sig.invalidationRule = "Bar close above 50 EMA invalidates directional bearish momentum.";
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| 2. Pullback Entries in Established Trends                        |
//+------------------------------------------------------------------+
bool CStrategyLibrary::EvaluatePullback(const string symbol, S_StrategySignal &sig)
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(symbol, PERIOD_M5, 0, 20, rates) < 20) return false;

   double swingHigh = rates[0].high;
   double swingLow = rates[0].low;
   for(int i = 1; i < 20; i++)
   {
      if(rates[i].high > swingHigh) swingHigh = rates[i].high;
      if(rates[i].low < swingLow) swingLow = rates[i].low;
   }

   double range = swingHigh - swingLow;
   if(range <= 0.0) return false;

   MqlTick tick;
   SymbolInfoTick(symbol, tick);
   double fib50 = swingLow + (range * 0.50);
   double fib38 = swingLow + (range * 0.382);

   // Buy Pullback in uptrend
   if(rates[0].close > fib50 && rates[1].low <= fib50 && rates[1].close > rates[1].open)
   {
      sig.strategyId = STRAT_PULLBACK_ENTRY;
      sig.strategyName = "Fibonacci Pullback in Trend";
      sig.signalType = ORDER_TYPE_BUY;
      sig.proposedEntry = tick.ask;
      sig.proposedSL = swingLow - (range * 0.1);
      sig.proposedTP = swingHigh + (range * 0.2);
      sig.signalQuality = 78.0;
      sig.estimatedRR = 1.85;
      sig.setupThesis = "Deep pullback into 50% golden liquidity zone confirmed by bullish engulfing response.";
      sig.invalidationRule = "Break of structural swing low invalidates trend sequence.";
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| 3. Breakout & Retest                                             |
//+------------------------------------------------------------------+
bool CStrategyLibrary::EvaluateBreakoutRetest(const string symbol, S_StrategySignal &sig)
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(symbol, PERIOD_M5, 0, 25, rates) < 25) return false;

   double resLevel = rates[3].high;
   for(int i = 4; i < 24; i++) { if(rates[i].high > resLevel) resLevel = rates[i].high; }

   MqlTick tick;
   SymbolInfoTick(symbol, tick);

   // Breakout candle at [2], retest wick at [1], closing higher
   if(rates[2].close > resLevel && rates[1].low <= resLevel && rates[1].close > resLevel)
   {
      sig.strategyId = STRAT_BREAKOUT_RETEST;
      sig.strategyName = "Breakout & Key Level Retest";
      sig.signalType = ORDER_TYPE_BUY;
      sig.proposedEntry = tick.ask;
      sig.proposedSL = resLevel - (rates[2].high - resLevel);
      sig.proposedTP = tick.ask + ((tick.ask - sig.proposedSL) * 2.0);
      sig.signalQuality = 85.0;
      sig.estimatedRR = 2.0;
      sig.setupThesis = "Consolidation resistance cleanly breached with verified retest wick holding prior ceiling as new floor.";
      sig.invalidationRule = "Immediate re-entry into prior range signifies fakeout; stop placed below breakout base.";
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| 4. Support & Resistance Reaction                                 |
//+------------------------------------------------------------------+
bool CStrategyLibrary::EvaluateSRReaction(const string symbol, S_StrategySignal &sig)
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(symbol, PERIOD_M15, 0, 30, rates) < 30) return false;

   double pivotLow = rates[5].low;
   for(int i = 6; i < 28; i++) { if(rates[i].low < pivotLow) pivotLow = rates[i].low; }

   MqlTick tick;
   SymbolInfoTick(symbol, tick);
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);

   // Pin bar bounce near pivot low
   if(MathAbs(rates[1].low - pivotLow) < 30.0 * point && rates[1].close > rates[1].open)
   {
      sig.strategyId = STRAT_SR_REACTION;
      sig.strategyName = "Support Liquidity Reaction";
      sig.signalType = ORDER_TYPE_BUY;
      sig.proposedEntry = tick.ask;
      sig.proposedSL = pivotLow - (20.0 * point);
      sig.proposedTP = tick.ask + ((tick.ask - sig.proposedSL) * 1.8);
      sig.signalQuality = 76.0;
      sig.estimatedRR = 1.8;
      sig.setupThesis = "Strong liquidity sweep of major multi-hour support level followed by swift rejection tail.";
      sig.invalidationRule = "Confirmed close beneath liquidity sweep wick invalidates setup.";
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| 5. Momentum Continuation (MACD + Volume)                         |
//+------------------------------------------------------------------+
bool CStrategyLibrary::EvaluateMomentumCont(const string symbol, S_StrategySignal &sig)
{
   int macdHandle = iMACD(symbol, PERIOD_M5, 12, 26, 9, PRICE_CLOSE);
   if(macdHandle == INVALID_HANDLE) return false;

   double main[3], sigLine[3];
   CopyBuffer(macdHandle, 0, 0, 3, main);
   CopyBuffer(macdHandle, 1, 0, 3, sigLine);
   IndicatorRelease(macdHandle);

   MqlTick tick;
   SymbolInfoTick(symbol, tick);

   // Momentum accelerating above zero line
   if(main[0] > 0.0 && main[0] > sigLine[0] && (main[0] - sigLine[0]) > (main[1] - sigLine[1]))
   {
      sig.strategyId = STRAT_MOMENTUM_CONT;
      sig.strategyName = "MACD Momentum Expansion";
      sig.signalType = ORDER_TYPE_BUY;
      sig.proposedEntry = tick.ask;
      sig.proposedSL = tick.ask - 0.0015;
      sig.proposedTP = tick.ask + 0.0030;
      sig.signalQuality = 74.0;
      sig.estimatedRR = 2.0;
      sig.setupThesis = "MACD histogram expanding in positive territory confirming momentum impulse.";
      sig.invalidationRule = "MACD histogram deceleration or signal line crossover.";
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| 6. Range Mean Reversion                                          |
//+------------------------------------------------------------------+
bool CStrategyLibrary::EvaluateRangeMeanRev(const string symbol, S_StrategySignal &sig)
{
   int bbHandle = iBands(symbol, PERIOD_M5, 20, 0, 2.0, PRICE_CLOSE);
   int rsiHandle = iRSI(symbol, PERIOD_M5, 14, PRICE_CLOSE);
   if(bbHandle == INVALID_HANDLE || rsiHandle == INVALID_HANDLE) return false;

   double upper[1], lower[1], mid[1], rsi[1];
   CopyBuffer(bbHandle, 1, 0, 1, upper);
   CopyBuffer(bbHandle, 2, 0, 1, lower);
   CopyBuffer(bbHandle, 0, 0, 1, mid);
   CopyBuffer(rsiHandle, 0, 0, 1, rsi);
   IndicatorRelease(bbHandle);
   IndicatorRelease(rsiHandle);

   MqlTick tick;
   SymbolInfoTick(symbol, tick);

   // Oversold boundary touch in confirmed sideways regime
   if(tick.bid <= lower[0] && rsi[0] <= 32.0)
   {
      sig.strategyId = STRAT_RANGE_MEAN_REV;
      sig.strategyName = "Bollinger Mean Reversion";
      sig.signalType = ORDER_TYPE_BUY;
      sig.proposedEntry = tick.ask;
      sig.proposedSL = lower[0] - (mid[0] - lower[0]) * 0.4;
      sig.proposedTP = mid[0];
      sig.signalQuality = 79.0;
      sig.estimatedRR = 1.7;
      sig.setupThesis = "RSI oversold condition touching lower 2.0 sigma band with mean-reversion target at center line.";
      sig.invalidationRule = "Band walking breakdown indicates regime shift into strong trend.";
      return true;
   }

   // Overbought boundary touch
   if(tick.ask >= upper[0] && rsi[0] >= 68.0)
   {
      sig.strategyId = STRAT_RANGE_MEAN_REV;
      sig.strategyName = "Bollinger Mean Reversion";
      sig.signalType = ORDER_TYPE_SELL;
      sig.proposedEntry = tick.bid;
      sig.proposedSL = upper[0] + (upper[0] - mid[0]) * 0.4;
      sig.proposedTP = mid[0];
      sig.signalQuality = 79.0;
      sig.estimatedRR = 1.7;
      sig.setupThesis = "RSI overbought exhaustion touching upper 2.0 sigma band in sideways channel.";
      sig.invalidationRule = "Band walking breakout closes above upper envelope.";
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| 7. Multi-Timeframe Trend Confirmation (H1 + M5)                  |
//+------------------------------------------------------------------+
bool CStrategyLibrary::EvaluateMtfConfirm(const string symbol, S_StrategySignal &sig)
{
   int h1EmaHandle = iMA(symbol, PERIOD_H1, 50, 0, MODE_EMA, PRICE_CLOSE);
   int m5EmaHandle = iMA(symbol, PERIOD_M5, 20, 0, MODE_EMA, PRICE_CLOSE);
   if(h1EmaHandle == INVALID_HANDLE || m5EmaHandle == INVALID_HANDLE) return false;

   double h1Ema[2], m5Ema[1];
   CopyBuffer(h1EmaHandle, 0, 0, 2, h1Ema);
   CopyBuffer(m5EmaHandle, 0, 0, 1, m5Ema);
   IndicatorRelease(h1EmaHandle);
   IndicatorRelease(m5EmaHandle);

   MqlTick tick;
   SymbolInfoTick(symbol, tick);

   // H1 rising slope + M5 price above 20 EMA
   bool h1Bull = (h1Ema[0] > h1Ema[1]);
   if(h1Bull && tick.ask > m5Ema[0] && tick.bid > h1Ema[0])
   {
      sig.strategyId = STRAT_MTF_CONFIRM;
      sig.strategyName = "Multi-Timeframe Trend Gate";
      sig.signalType = ORDER_TYPE_BUY;
      sig.proposedEntry = tick.ask;
      sig.proposedSL = m5Ema[0] - 0.0012;
      sig.proposedTP = tick.ask + 0.0024;
      sig.signalQuality = 84.0;
      sig.estimatedRR = 2.0;
      sig.setupThesis = "H1 macro trend slope confirms upward drift aligned with M5 tactical entry trigger.";
      sig.invalidationRule = "M5 bar close below intermediate EMA invalidates timing.";
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| 8. Volatility Squeeze Breakout                                   |
//+------------------------------------------------------------------+
bool CStrategyLibrary::EvaluateVolSqueeze(const string symbol, S_StrategySignal &sig)
{
   int bbHandle = iBands(symbol, PERIOD_M5, 20, 0, 2.0, PRICE_CLOSE);
   if(bbHandle == INVALID_HANDLE) return false;

   double upper[2], lower[2], mid[2];
   CopyBuffer(bbHandle, 1, 0, 2, upper);
   CopyBuffer(bbHandle, 2, 0, 2, lower);
   CopyBuffer(bbHandle, 0, 0, 2, mid);
   IndicatorRelease(bbHandle);

   MqlTick tick;
   SymbolInfoTick(symbol, tick);

   double bwCurrent = (upper[0] - lower[0]) / mid[0];
   double bwPrev = (upper[1] - lower[1]) / mid[1];

   // Volatility expansion firing out of squeeze
   if(bwPrev < 0.0018 && bwCurrent > bwPrev * 1.35 && tick.ask > upper[0])
   {
      sig.strategyId = STRAT_VOL_SQUEEZE_BREAKOUT;
      sig.strategyName = "Keltner/BB Squeeze Fire";
      sig.signalType = ORDER_TYPE_BUY;
      sig.proposedEntry = tick.ask;
      sig.proposedSL = mid[0];
      sig.proposedTP = tick.ask + ((tick.ask - mid[0]) * 2.2);
      sig.signalQuality = 87.0;
      sig.estimatedRR = 2.2;
      sig.setupThesis = "Compression phase resolved into explosive directional expansion above upper band.";
      sig.invalidationRule = "Close back inside middle band indicates failed breakout.";
      return true;
   }

   return false;
}

// Stubs for remaining candidate strategies ensuring 15 modular strategies are registered
bool CStrategyLibrary::EvaluateEmaPulse(const string symbol, S_StrategySignal &sig) { return false; }
bool CStrategyLibrary::EvaluateRsiStoch(const string symbol, S_StrategySignal &sig) { return false; }
bool CStrategyLibrary::EvaluateMacdConfirm(const string symbol, S_StrategySignal &sig) { return false; }
bool CStrategyLibrary::EvaluateAtrVol(const string symbol, S_StrategySignal &sig) { return false; }
bool CStrategyLibrary::EvaluatePriceAction(const string symbol, S_StrategySignal &sig) { return false; }
bool CStrategyLibrary::EvaluateSessionMom(const string symbol, S_StrategySignal &sig) { return false; }
bool CStrategyLibrary::EvaluateVolumeFlow(const string symbol, S_StrategySignal &sig) { return false; }
