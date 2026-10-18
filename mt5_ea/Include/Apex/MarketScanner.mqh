//+------------------------------------------------------------------+
//|                                                MarketScanner.mqh |
//|                                  Apex AI Trader Multi-Scanner    |
//|               High-Performance Symbol Screening & Ranking Engine |
//+------------------------------------------------------------------+
#property copyright "Apex AI Quantitative Team"
#property link      "https://apexaitrader.internal"
#property strict

#include "RegimeDetector.mqh"
#include "StrategyLibrary.mqh"

struct S_ScannedSymbol
{
   string                  symbol;
   double                  bid;
   double                  ask;
   int                     spreadPoints;
   double                  spreadCostUSD;
   double                  atr14;
   double                  spreadToAtrRatio;
   S_RegimeClassification  regime;
   S_StrategySignal        bestSignal;
   double                  opportunityScore; // 0.0 to 100.0
   bool                    passesRiskFilters;
   string                  riskNotes;
};

class CMarketScanner
{
private:
   string                  m_symbolsList[];
   int                     m_symbolCount;
   CRegimeDetector         m_regimeDetector;
   CStrategyLibrary        m_strategies;

public:
   CMarketScanner();
   ~CMarketScanner();

   void                    Init(string symbolsCsv = "EURUSD,GBPUSD,USDJPY,AUDUSD,USDCAD,USDCHF,NZDUSD,EURJPY,GBPJPY,XAUUSD,BTCUSD");
   int                     ScanAll(CStopManager &stopMgr, S_ScannedSymbol &outResults[]);
   void                    RankOpportunities(S_ScannedSymbol &items[], int count);

private:
   double                  CalculateScore(const S_ScannedSymbol &item);
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CMarketScanner::CMarketScanner()
{
   m_symbolCount = 0;
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CMarketScanner::~CMarketScanner()
{
}

//+------------------------------------------------------------------+
//| Initialize Symbols from CSV                                      |
//+------------------------------------------------------------------+
void CMarketScanner::Init(string symbolsCsv)
{
   string tokens[];
   int count = StringSplit(symbolsCsv, ',', tokens);
   ArrayResize(m_symbolsList, count);
   m_symbolCount = 0;

   for(int i = 0; i < count; i++)
   {
      string sym = tokens[i];
      StringTrimLeft(sym);
      StringTrimRight(sym);
      if(StringLen(sym) > 0)
      {
         // Ensure symbol is selected in Market Watch
         SymbolSelect(sym, true);
         m_symbolsList[m_symbolCount++] = sym;
      }
   }
}

//+------------------------------------------------------------------+
//| Scan All Configured Symbols                                      |
//+------------------------------------------------------------------+
int CMarketScanner::ScanAll(CStopManager &stopMgr, S_ScannedSymbol &outResults[])
{
   ArrayResize(outResults, m_symbolCount);
   int validCount = 0;

   for(int i = 0; i < m_symbolCount; i++)
   {
      string sym = m_symbolsList[i];
      MqlTick tick;
      if(!SymbolInfoTick(sym, tick)) continue;

      S_ScannedSymbol res;
      res.symbol = sym;
      res.bid = tick.bid;
      res.ask = tick.ask;
      res.spreadPoints = (int)SymbolInfoInteger(sym, SYMBOL_SPREAD);

      double point = SymbolInfoDouble(sym, SYMBOL_POINT);
      double tickVal = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_VALUE);
      double tickSize = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_SIZE);

      res.spreadCostUSD = (tickSize > 0.0) ? (res.spreadPoints * point / tickSize) * tickVal : 0.0;

      // ATR(14) on M5
      int atrHandle = iATR(sym, PERIOD_M5, 14);
      if(atrHandle != INVALID_HANDLE)
      {
         double atrBuf[1];
         if(CopyBuffer(atrHandle, 0, 0, 1, atrBuf) > 0) res.atr14 = atrBuf[0];
         IndicatorRelease(atrHandle);
      }

      double spreadPrice = res.spreadPoints * point;
      res.spreadToAtrRatio = (res.atr14 > 0.0) ? spreadPrice / res.atr14 : 1.0;

      // Classify Regime
      res.regime = m_regimeDetector.Classify(sym, PERIOD_M5);

      // Evaluate candidate strategy signals
      bool hasSignal = m_strategies.EvaluateBestSignal(sym, res.regime, stopMgr, res.bestSignal);

      // Check risk filter feasibility
      res.passesRiskFilters = true;
      res.riskNotes = "OK";

      if(res.spreadToAtrRatio > 0.25)
      {
         res.passesRiskFilters = false;
         res.riskNotes = "Spread cost too high relative to ATR";
      }
      else if(!res.regime.isTradeable)
      {
         res.passesRiskFilters = false;
         res.riskNotes = "Unfavorable or unstable market regime";
      }
      else if(res.regime.uncertaintyScore > 0.40)
      {
         res.passesRiskFilters = false;
         res.riskNotes = "High model uncertainty";
      }

      // Compute composite opportunity score
      res.opportunityScore = CalculateScore(res);

      outResults[validCount++] = res;
   }

   ArrayResize(outResults, validCount);
   RankOpportunities(outResults, validCount);
   return validCount;
}

//+------------------------------------------------------------------+
//| Calculate Composite Opportunity Score (0-100)                    |
//+------------------------------------------------------------------+
double CMarketScanner::CalculateScore(const S_ScannedSymbol &item)
{
   if(!item.passesRiskFilters) return 15.0; // Minimal baseline for filtered out assets

   double baseSignalQuality = (item.bestSignal.signalType != (ENUM_ORDER_TYPE)-1) ? item.bestSignal.signalQuality : 40.0;

   // Cost efficiency penalty (lower spread/ATR = higher bonus)
   double costPenalty = item.spreadToAtrRatio * 50.0; // e.g. 0.10 * 50 = 5 point penalty

   // Uncertainty penalty
   double uncertaintyPenalty = item.regime.uncertaintyScore * 30.0;

   // Trend clarity bonus
   double trendBonus = (item.regime.trendStrength / 100.0) * 15.0;

   double finalScore = baseSignalQuality - costPenalty - uncertaintyPenalty + trendBonus;
   return MathMax(5.0, MathMin(98.0, finalScore));
}

//+------------------------------------------------------------------+
//| Rank Opportunities in Descending Order of Score                  |
//+------------------------------------------------------------------+
void CMarketScanner::RankOpportunities(S_ScannedSymbol &items[], int count)
{
   for(int i = 0; i < count - 1; i++)
   {
      for(int j = i + 1; j < count; j++)
      {
         if(items[j].opportunityScore > items[i].opportunityScore)
         {
            S_ScannedSymbol temp = items[i];
            items[i] = items[j];
            items[j] = temp;
         }
      }
   }
}
