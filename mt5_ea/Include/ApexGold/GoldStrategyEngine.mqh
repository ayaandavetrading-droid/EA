//+------------------------------------------------------------------+
//|                                           GoldStrategyEngine.mqh |
//|                          Apex Gold AI — XAUUSD Strategy Library  |
//|               12 Specialized Quantitative Scalping Strategies    |
//+------------------------------------------------------------------+
#property copyright "Apex Gold AI Quantitative Team"
#property link      "https://apexgold.internal"
#property strict

enum ENUM_GOLD_STRATEGY
{
   GOLD_STRAT_TREND_PULLBACK = 1,      // 1. Trend continuation & pullbacks
   GOLD_STRAT_BREAKOUT_RETEST,         // 2. Breakout and breakout-retest setups
   GOLD_STRAT_ROUND_LEVEL_REACTION,    // 3. Support & resistance round-number reactions ($2700, $2725)
   GOLD_STRAT_MOMENTUM_EXPANSION,      // 4. Momentum continuation
   GOLD_STRAT_RANGE_MEAN_REV,          // 5. Statistical range scalping
   GOLD_STRAT_ATR_VOLATILITY_ADAPT,    // 6. ATR-based volatility adaptation
   GOLD_STRAT_MTF_ALIGNMENT,           // 7. Multi-timeframe trend confirmation (H1 + M15 + M5)
   GOLD_STRAT_PRICE_ACTION_PINBAR,     // 8. Price-action & candle-structure rejections
   GOLD_STRAT_SESSION_LIQUIDITY,       // 9. Session-aware London/NY overlap momentum
   GOLD_STRAT_VOLATILITY_SQUEEZE,      // 10. Volatility expansion & contraction (BB squeeze)
   GOLD_STRAT_FALSE_BREAKOUT_HUNT,     // 11. False-breakout stop hunt detection
   GOLD_STRAT_REGIME_CLASSIFIER        // 12. Market-regime classification trigger
};

struct S_GoldSignal
{
   ENUM_GOLD_STRATEGY   strategy;
   string               strategyName;
   ENUM_ORDER_TYPE      signalType;       // ORDER_TYPE_BUY or ORDER_TYPE_SELL or -1
   double               entryPrice;
   double               stopLoss;
   double               takeProfit;
   double               convictionScore;  // 0.0 to 100.0
   double               rewardRiskRatio;
   string               setupThesis;
   string               invalidationRule;
};

struct S_GoldRegime
{
   string   name;
   bool     isTradeable;
   double   uncertaintyScore; // 0.0 (certain) to 1.0 (untradeable)
   string   sessionPhase;     // "LONDON_OPEN", "NY_OVERLAP", "ASIAN_RANGE", "ROLLOVER_PAUSE"
};

class CGoldStrategyEngine
{
public:
   CGoldStrategyEngine();
   ~CGoldStrategyEngine();

   S_GoldRegime   DetectGoldRegime(const string goldSymbol);
   bool           EvaluateBestSetup(const string goldSymbol, const S_GoldRegime &regime, S_GoldSignal &outSignal);

private:
   bool EvaluateTrendPullback(const string sym, S_GoldSignal &sig);
   bool EvaluateBreakoutRetest(const string sym, S_GoldSignal &sig);
   bool EvaluateRoundNumberReaction(const string sym, S_GoldSignal &sig);
   bool EvaluateFalseBreakoutHunt(const string sym, S_GoldSignal &sig);
   bool EvaluateRangeMeanRev(const string sym, S_GoldSignal &sig);
   bool EvaluateVolatilitySqueeze(const string sym, S_GoldSignal &sig);
   bool EvaluateSessionLiquidity(const string sym, S_GoldSignal &sig);
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CGoldStrategyEngine::CGoldStrategyEngine()
{
}

CGoldStrategyEngine::~CGoldStrategyEngine()
{
}

//+------------------------------------------------------------------+
//| Detect Gold Market Regime & Session Phase                        |
//+------------------------------------------------------------------+
S_GoldRegime CGoldStrategyEngine::DetectGoldRegime(const string goldSymbol)
{
   S_GoldRegime reg;
   reg.name = "Gold Sideways Range";
   reg.isTradeable = true;
   reg.uncertaintyScore = 0.25;

   // 1. Session Timing (GMT / UTC server time)
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   int hour = dt.hour;

   if(hour >= 21 || hour < 1)
   {
      reg.sessionPhase = "ROLLOVER_PAUSE";
      reg.name = "Illiquid Rollover Window";
      reg.isTradeable = false;
      reg.uncertaintyScore = 0.85;
      return reg;
   }
   else if(hour >= 7 && hour < 11)
   {
      reg.sessionPhase = "LONDON_OPEN";
   }
   else if(hour >= 12 && hour < 17)
   {
      reg.sessionPhase = "NY_OVERLAP";
   }
   else
   {
      reg.sessionPhase = "ASIAN_RANGE";
   }

   // 2. Fetch Gold ATR and Moving Averages
   int atrHandle = iATR(goldSymbol, PERIOD_M5, 14);
   int ema21Handle = iMA(goldSymbol, PERIOD_M5, 21, 0, MODE_EMA, PRICE_CLOSE);
   int ema50Handle = iMA(goldSymbol, PERIOD_M5, 50, 0, MODE_EMA, PRICE_CLOSE);

   if(atrHandle == INVALID_HANDLE || ema21Handle == INVALID_HANDLE || ema50Handle == INVALID_HANDLE)
   {
      reg.name = "Data Unavailable";
      reg.isTradeable = false;
      reg.uncertaintyScore = 0.90;
      return reg;
   }

   double atr[1], e21[2], e50[2];
   CopyBuffer(atrHandle, 0, 0, 1, atr);
   CopyBuffer(ema21Handle, 0, 0, 2, e21);
   CopyBuffer(ema50Handle, 0, 0, 2, e50);

   IndicatorRelease(atrHandle);
   IndicatorRelease(ema21Handle);
   IndicatorRelease(ema50Handle);

   double slope = e21[0] - e21[1];

   if(slope > 0.35 && e21[0] > e50[0])
   {
      reg.name = "Strong Bullish Expansion";
      reg.uncertaintyScore = 0.18;
      reg.isTradeable = true;
   }
   else if(slope < -0.35 && e21[0] < e50[0])
   {
      reg.name = "Strong Bearish Cascade";
      reg.uncertaintyScore = 0.18;
      reg.isTradeable = true;
   }
   else if(atr[0] < 1.20)
   {
      reg.name = "Volatility Compression Squeeze";
      reg.uncertaintyScore = 0.22;
      reg.isTradeable = true;
   }
   else
   {
      reg.name = "Sideways Liquidity Consolidation";
      reg.uncertaintyScore = 0.28;
      reg.isTradeable = true;
   }

   return reg;
}

//+------------------------------------------------------------------+
//| Evaluate Best Signal for Current Gold Regime                     |
//+------------------------------------------------------------------+
bool CGoldStrategyEngine::EvaluateBestSetup(const string goldSymbol, const S_GoldRegime &regime, S_GoldSignal &outSignal)
{
   outSignal.signalType = (ENUM_ORDER_TYPE)-1;
   outSignal.convictionScore = 0.0;

   if(!regime.isTradeable || regime.uncertaintyScore > 0.40)
   {
      return false; // Skip execution when regime uncertainty is elevated
   }

   S_GoldSignal candidates[6];
   int count = 0;

   // 1. Trend Pullback
   if(EvaluateTrendPullback(goldSymbol, candidates[count])) count++;

   // 2. Breakout & Retest
   if(EvaluateBreakoutRetest(goldSymbol, candidates[count])) count++;

   // 3. Round Number Key Level Reactions ($2700, $2725, $2750)
   if(EvaluateRoundNumberReaction(goldSymbol, candidates[count])) count++;

   // 4. False Breakout Hunting
   if(EvaluateFalseBreakoutHunt(goldSymbol, candidates[count])) count++;

   // 5. Volatility Squeeze Breakout
   if(EvaluateVolatilitySqueeze(goldSymbol, candidates[count])) count++;

   // Find highest conviction candidate
   double bestScore = 70.0;
   int bestIdx = -1;
   for(int i = 0; i < count; i++)
   {
      if(candidates[i].convictionScore > bestScore)
      {
         bestScore = candidates[i].convictionScore;
         bestIdx = i;
      }
   }

   if(bestIdx >= 0)
   {
      outSignal = candidates[bestIdx];
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| Strategy 1: Trend Pullback in Gold Directional Flow              |
//+------------------------------------------------------------------+
bool CGoldStrategyEngine::EvaluateTrendPullback(const string sym, S_GoldSignal &sig)
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(sym, PERIOD_M5, 0, 10, rates) < 10) return false;

   MqlTick tick;
   SymbolInfoTick(sym, tick);

   int e21H = iMA(sym, PERIOD_M5, 21, 0, MODE_EMA, PRICE_CLOSE);
   int e50H = iMA(sym, PERIOD_M5, 50, 0, MODE_EMA, PRICE_CLOSE);
   int atrH = iATR(sym, PERIOD_M5, 14);

   if(e21H == INVALID_HANDLE || e50H == INVALID_HANDLE || atrH == INVALID_HANDLE) return false;

   double e21[1], e50[1], atr[1];
   CopyBuffer(e21H, 0, 0, 1, e21);
   CopyBuffer(e50H, 0, 0, 1, e50);
   CopyBuffer(atrH, 0, 0, 1, atr);

   IndicatorRelease(e21H);
   IndicatorRelease(e50H);
   IndicatorRelease(atrH);

   double slDist = MathMax(atr[0] * 1.5, 2.0); // Minimum $2.00/oz stop on Gold
   double tpDist = slDist * 1.8;

   // Bullish Pullback: Price dips into 21 EMA in established uptrend
   if(e21[0] > e50[0] && rates[1].low <= e21[0] && rates[1].close > e21[0])
   {
      sig.strategy = GOLD_STRAT_TREND_PULLBACK;
      sig.strategyName = "XAUUSD Trend Pullback (21 EMA)";
      sig.signalType = ORDER_TYPE_BUY;
      sig.entryPrice = tick.ask;
      sig.stopLoss = tick.ask - slDist;
      sig.takeProfit = tick.ask + tpDist;
      sig.convictionScore = 84.0;
      sig.rewardRiskRatio = 1.80;
      sig.setupThesis = "Gold ascending trend tested 21 EMA dynamic support with rejection tail.";
      sig.invalidationRule = "Bar close below 50 EMA invalidates directional momentum.";
      return true;
   }

   // Bearish Pullback
   if(e21[0] < e50[0] && rates[1].high >= e21[0] && rates[1].close < e21[0])
   {
      sig.strategy = GOLD_STRAT_TREND_PULLBACK;
      sig.strategyName = "XAUUSD Trend Pullback (21 EMA)";
      sig.signalType = ORDER_TYPE_SELL;
      sig.entryPrice = tick.bid;
      sig.stopLoss = tick.bid + slDist;
      sig.takeProfit = tick.bid - tpDist;
      sig.convictionScore = 84.0;
      sig.rewardRiskRatio = 1.80;
      sig.setupThesis = "Gold descending trend tested 21 EMA dynamic resistance with upper wick rejection.";
      sig.invalidationRule = "Bar close above 50 EMA invalidates directional momentum.";
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| Strategy 2: Breakout & Retest of Gold Key Price Levels           |
//+------------------------------------------------------------------+
bool CGoldStrategyEngine::EvaluateBreakoutRetest(const string sym, S_GoldSignal &sig)
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(sym, PERIOD_M5, 0, 25, rates) < 25) return false;

   double resLevel = rates[3].high;
   for(int i = 4; i < 20; i++) { if(rates[i].high > resLevel) resLevel = rates[i].high; }

   MqlTick tick;
   SymbolInfoTick(sym, tick);

   // Breakout bar at [2], retest at [1]
   if(rates[2].close > resLevel && rates[1].low <= resLevel && rates[1].close > resLevel)
   {
      sig.strategy = GOLD_STRAT_BREAKOUT_RETEST;
      sig.strategyName = "Gold High-Volume Breakout & Retest";
      sig.signalType = ORDER_TYPE_BUY;
      sig.entryPrice = tick.ask;
      double sl = resLevel - 2.50; // $2.50 stop below retest base
      sig.stopLoss = sl;
      sig.takeProfit = tick.ask + ((tick.ask - sl) * 2.0);
      sig.convictionScore = 86.0;
      sig.rewardRiskRatio = 2.00;
      sig.setupThesis = "Decisive breakout above 20-bar resistance with lower wick confirming retest support.";
      sig.invalidationRule = "Close back under prior resistance signifies fakeout.";
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| Strategy 3: Round Number Institutional Reaction ($2700, $2725)   |
//+------------------------------------------------------------------+
bool CGoldStrategyEngine::EvaluateRoundNumberReaction(const string sym, S_GoldSignal &sig)
{
   MqlTick tick;
   SymbolInfoTick(sym, tick);

   // Round levels every $25.00 on Gold
   double roundLevel = MathRound(tick.bid / 25.0) * 25.0;
   double dist = MathAbs(tick.bid - roundLevel);

   // If price is within $0.80 of round level with reversal reaction
   if(dist < 0.80)
   {
      MqlRates rates[];
      ArraySetAsSeries(rates, true);
      if(CopyRates(sym, PERIOD_M5, 0, 3, rates) < 3) return false;

      // Pinbar bounce off round support
      if(rates[1].low <= roundLevel && rates[1].close > roundLevel + 0.50)
      {
         sig.strategy = GOLD_STRAT_ROUND_LEVEL_REACTION;
         sig.strategyName = StringFormat("Gold $%.0f Institutional Round Level Bounce", roundLevel);
         sig.signalType = ORDER_TYPE_BUY;
         sig.entryPrice = tick.ask;
         sig.stopLoss = roundLevel - 2.00;
         sig.takeProfit = tick.ask + 4.00;
         sig.convictionScore = 80.0;
         sig.rewardRiskRatio = 2.00;
         sig.setupThesis = StringFormat("Institutional liquidity defended at major psychological $%.0f round level.", roundLevel);
         sig.invalidationRule = "Break and close beneath psychological level.";
         return true;
      }
   }

   return false;
}

//+------------------------------------------------------------------+
//| Strategy 4: False Breakout / Turtle Soup Trap                    |
//+------------------------------------------------------------------+
bool CGoldStrategyEngine::EvaluateFalseBreakoutHunt(const string sym, S_GoldSignal &sig)
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(sym, PERIOD_M5, 0, 15, rates) < 15) return false;

   double recentHigh = rates[2].high;
   for(int i = 3; i < 14; i++) { if(rates[i].high > recentHigh) recentHigh = rates[i].high; }

   MqlTick tick;
   SymbolInfoTick(sym, tick);

   // Wick briefly popped above recent high, but closed back inside with large upper shadow
   if(rates[1].high > recentHigh && rates[1].close < recentHigh)
   {
      sig.strategy = GOLD_STRAT_FALSE_BREAKOUT_HUNT;
      sig.strategyName = "Gold Liquidity Sweep & Reversal Trap";
      sig.signalType = ORDER_TYPE_SELL;
      sig.entryPrice = tick.bid;
      sig.stopLoss = rates[1].high + 0.80; // Stop above sweep wick
      double riskDist = sig.stopLoss - sig.entryPrice;
      sig.takeProfit = sig.entryPrice - (riskDist * 1.8);
      sig.convictionScore = 82.0;
      sig.rewardRiskRatio = 1.80;
      sig.setupThesis = "Liquidity sweep above Asian high rejected immediately, trapping breakout longs.";
      sig.invalidationRule = "New high above sweep wick invalidates trap thesis.";
      return true;
   }

   return false;
}

//+------------------------------------------------------------------+
//| Strategy 5: Volatility Squeeze Breakout                          |
//+------------------------------------------------------------------+
bool CGoldStrategyEngine::EvaluateVolatilitySqueeze(const string sym, S_GoldSignal &sig)
{
   int bbHandle = iBands(sym, PERIOD_M5, 20, 0, 2.0, PRICE_CLOSE);
   if(bbHandle == INVALID_HANDLE) return false;

   double upper[2], lower[2], mid[2];
   CopyBuffer(bbHandle, 1, 0, 2, upper);
   CopyBuffer(bbHandle, 2, 0, 2, lower);
   CopyBuffer(bbHandle, 0, 0, 2, mid);
   IndicatorRelease(bbHandle);

   MqlTick tick;
   SymbolInfoTick(sym, tick);

   double currentBw = (upper[0] - lower[0]) / mid[0];
   double prevBw = (upper[1] - lower[1]) / mid[1];

   if(prevBw < 0.0016 && currentBw > prevBw * 1.40 && tick.ask > upper[0])
   {
      sig.strategy = GOLD_STRAT_VOLATILITY_SQUEEZE;
      sig.strategyName = "Gold Keltner/BB Compression Fire";
      sig.signalType = ORDER_TYPE_BUY;
      sig.entryPrice = tick.ask;
      sig.stopLoss = mid[0];
      double risk = tick.ask - mid[0];
      sig.takeProfit = tick.ask + (risk * 2.2);
      sig.convictionScore = 88.0;
      sig.rewardRiskRatio = 2.20;
      sig.setupThesis = "Energy compression on Gold resolved into upward volatility expansion.";
      sig.invalidationRule = "Close back under middle band.";
      return true;
   }

   return false;
}
