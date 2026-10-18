//+------------------------------------------------------------------+
//|                                               RegimeDetector.mqh |
//|                                Apex AI Trader Regime Classifier  |
//|               Quantitative Market Regime & Uncertainty Detection |
//+------------------------------------------------------------------+
#property copyright "Apex AI Quantitative Team"
#property link      "https://apexaitrader.internal"
#property strict

enum ENUM_MARKET_REGIME
{
   REGIME_UNKNOWN = 0,
   REGIME_BULL_TREND,         // Strong upward trend
   REGIME_BEAR_TREND,         // Strong downward trend
   REGIME_RANGING_SIDEWAYS,   // Mean-reverting consolidation range
   REGIME_VOL_EXPANSION,      // Explosive volatility expansion
   REGIME_VOL_COMPRESSION,    // Low volatility squeeze
   REGIME_POTENTIAL_BREAKOUT, // Pressure at key structural extremes
   REGIME_ABNORMAL_UNSTABLE   // Erratic spread, gap, news spike (NO TRADE)
};

struct S_RegimeClassification
{
   ENUM_MARKET_REGIME   regime;
   string               regimeName;
   double               trendStrength;     // 0.0 to 100.0 (ADX / EMA slope)
   double               volatilityRatio;   // ATR / 100-period ATR
   double               uncertaintyScore;  // 0.0 (certain) to 1.0 (highly uncertain)
   bool                 isTradeable;
   string               diagnosticSummary;
};

class CRegimeDetector
{
public:
   CRegimeDetector();
   ~CRegimeDetector();

   S_RegimeClassification Classify(const string symbol, const ENUM_TIMEFRAMES tf = PERIOD_M5);

private:
   double   CalculateEmaSlope(const string symbol, ENUM_TIMEFRAMES tf, int period);
   double   CalculateAdx(const string symbol, ENUM_TIMEFRAMES tf, int period);
   double   CalculateBandwidth(const string symbol, ENUM_TIMEFRAMES tf, int period, double dev);
   double   CalculateAtr(const string symbol, ENUM_TIMEFRAMES tf, int period);
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CRegimeDetector::CRegimeDetector()
{
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CRegimeDetector::~CRegimeDetector()
{
}

//+------------------------------------------------------------------+
//| Classify Symbol Market Regime and Calculate Uncertainty Score    |
//+------------------------------------------------------------------+
S_RegimeClassification CRegimeDetector::Classify(const string symbol, const ENUM_TIMEFRAMES tf)
{
   S_RegimeClassification res;
   res.regime = REGIME_UNKNOWN;
   res.regimeName = "Unknown";
   res.trendStrength = 0.0;
   res.volatilityRatio = 1.0;
   res.uncertaintyScore = 0.50;
   res.isTradeable = false;
   res.diagnosticSummary = "";

   // 1. Fetch Indicators
   double atrShort = CalculateAtr(symbol, tf, 14);
   double atrLong  = CalculateAtr(symbol, tf, 70);
   double adxVal   = CalculateAdx(symbol, tf, 14);
   double emaSlope20 = CalculateEmaSlope(symbol, tf, 20);
   double emaSlope50 = CalculateEmaSlope(symbol, tf, 50);
   double bandwidth  = CalculateBandwidth(symbol, tf, 20, 2.0);

   if(atrShort <= 0.0 || atrLong <= 0.0)
   {
      res.regime = REGIME_ABNORMAL_UNSTABLE;
      res.regimeName = "Data Unavailable";
      res.uncertaintyScore = 1.0;
      res.isTradeable = false;
      res.diagnosticSummary = "Insufficient historical bar data for indicator calculation.";
      return res;
   }

   res.volatilityRatio = atrShort / atrLong;
   res.trendStrength = adxVal;

   // 2. Check for Abnormal / Erratic Market
   int currentSpread = (int)SymbolInfoInteger(symbol, SYMBOL_SPREAD);
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   double spreadCostInPrice = currentSpread * point;

   if(spreadCostInPrice > atrShort * 0.35 || res.volatilityRatio > 3.2)
   {
      res.regime = REGIME_ABNORMAL_UNSTABLE;
      res.regimeName = "Abnormal / High Spread Spike";
      res.uncertaintyScore = 0.85;
      res.isTradeable = false;
      res.diagnosticSummary = "Spread exceeds 35% of ATR or extreme volatility spike detected. Avoid execution.";
      return res;
   }

   // 3. Volatility Compression / Squeeze
   if(bandwidth < 0.0018 && res.volatilityRatio < 0.65)
   {
      res.regime = REGIME_VOL_COMPRESSION;
      res.regimeName = "Volatility Compression (Squeeze)";
      res.uncertaintyScore = 0.28;
      res.isTradeable = true;
      res.diagnosticSummary = "Market energy coiling in tight channel. Setup for breakout strategies.";
      return res;
   }

   // 4. Volatility Expansion
   if(res.volatilityRatio > 1.85 && adxVal < 22.0)
   {
      res.regime = REGIME_VOL_EXPANSION;
      res.regimeName = "Volatile Expansion (Whipsaw Risk)";
      res.uncertaintyScore = 0.55;
      res.isTradeable = false; // High uncertainty without directional consensus
      res.diagnosticSummary = "Large ATR expansion without clear trend momentum. Whipsaw danger.";
      return res;
   }

   // 5. Strong Bull Trend
   if(adxVal >= 25.0 && emaSlope20 > 0.0003 && emaSlope50 > 0.0001)
   {
      res.regime = REGIME_BULL_TREND;
      res.regimeName = "Strong Bullish Trend";
      res.uncertaintyScore = MathMax(0.12, 0.40 - (adxVal / 100.0));
      res.isTradeable = true;
      res.diagnosticSummary = "Clean upward EMA alignment with ADX > 25. Favors Trend Scalp & Pullbacks.";
      return res;
   }

   // 6. Strong Bear Trend
   if(adxVal >= 25.0 && emaSlope20 < -0.0003 && emaSlope50 < -0.0001)
   {
      res.regime = REGIME_BEAR_TREND;
      res.regimeName = "Strong Bearish Trend";
      res.uncertaintyScore = MathMax(0.12, 0.40 - (adxVal / 100.0));
      res.isTradeable = true;
      res.diagnosticSummary = "Clean downward EMA alignment with ADX > 25. Favors Trend Short & Pullbacks.";
      return res;
   }

   // 7. Ranging / Sideways Consolidation
   if(adxVal < 20.0 && MathAbs(emaSlope50) < 0.00015)
   {
      res.regime = REGIME_RANGING_SIDEWAYS;
      res.regimeName = "Sideways Consolidation Range";
      res.uncertaintyScore = 0.25;
      res.isTradeable = true;
      res.diagnosticSummary = "Low directional drift and stable boundary oscillation. Favors Mean Reversion.";
      return res;
   }

   // 8. Potential Breakout Testing
   if(adxVal >= 20.0 && res.volatilityRatio >= 1.15)
   {
      res.regime = REGIME_POTENTIAL_BREAKOUT;
      res.regimeName = "Potential Breakout in Progress";
      res.uncertaintyScore = 0.32;
      res.isTradeable = true;
      res.diagnosticSummary = "Increasing volume momentum testing range boundaries.";
      return res;
   }

   // Fallback: Mild trend or ambiguous
   res.regime = REGIME_RANGING_SIDEWAYS;
   res.regimeName = "Low Conviction / Mild Range";
   res.uncertaintyScore = 0.42;
   res.isTradeable = false; // Above 0.40 uncertainty threshold -> prefer no trade
   res.diagnosticSummary = "Ambiguous momentum signal; uncertainty exceeds safe scalping threshold.";
   return res;
}

//+------------------------------------------------------------------+
//| Calculate ATR Helper                                             |
//+------------------------------------------------------------------+
double CRegimeDetector::CalculateAtr(const string symbol, ENUM_TIMEFRAMES tf, int period)
{
   int handle = iATR(symbol, tf, period);
   if(handle == INVALID_HANDLE) return 0.0;
   double buf[1];
   if(CopyBuffer(handle, 0, 0, 1, buf) <= 0)
   {
      IndicatorRelease(handle);
      return 0.0;
   }
   IndicatorRelease(handle);
   return buf[0];
}

//+------------------------------------------------------------------+
//| Calculate ADX Helper                                             |
//+------------------------------------------------------------------+
double CRegimeDetector::CalculateAdx(const string symbol, ENUM_TIMEFRAMES tf, int period)
{
   int handle = iADX(symbol, tf, period);
   if(handle == INVALID_HANDLE) return 20.0;
   double buf[1];
   if(CopyBuffer(handle, 0, 0, 1, buf) <= 0)
   {
      IndicatorRelease(handle);
      return 20.0;
   }
   IndicatorRelease(handle);
   return buf[0];
}

//+------------------------------------------------------------------+
//| Calculate EMA Slope (Delta over 3 bars)                          |
//+------------------------------------------------------------------+
double CRegimeDetector::CalculateEmaSlope(const string symbol, ENUM_TIMEFRAMES tf, int period)
{
   int handle = iMA(symbol, tf, period, 0, MODE_EMA, PRICE_CLOSE);
   if(handle == INVALID_HANDLE) return 0.0;
   double buf[4];
   if(CopyBuffer(handle, 0, 0, 4, buf) < 4)
   {
      IndicatorRelease(handle);
      return 0.0;
   }
   IndicatorRelease(handle);
   double slope = (buf[3] - buf[0]) / 3.0; // Current minus 3 bars ago
   return slope;
}

//+------------------------------------------------------------------+
//| Calculate Bollinger Bandwidth                                    |
//+------------------------------------------------------------------+
double CRegimeDetector::CalculateBandwidth(const string symbol, ENUM_TIMEFRAMES tf, int period, double dev)
{
   int handle = iBands(symbol, tf, period, 0, dev, PRICE_CLOSE);
   if(handle == INVALID_HANDLE) return 0.01;
   double upper[1], lower[1], mid[1];
   if(CopyBuffer(handle, 1, 0, 1, upper) <= 0 ||
      CopyBuffer(handle, 2, 0, 1, lower) <= 0 ||
      CopyBuffer(handle, 0, 0, 1, mid) <= 0)
   {
      IndicatorRelease(handle);
      return 0.01;
   }
   IndicatorRelease(handle);
   if(mid[0] <= 0.0) return 0.01;
   return (upper[0] - lower[0]) / mid[0];
}
