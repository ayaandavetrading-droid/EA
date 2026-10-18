# Apex AI Trader - System Architecture & Specification

## 1. Executive Summary
**Apex AI Trader** is an enterprise-grade autonomous algorithmic scalping system designed specifically for MetaTrader 5 (MT5). The system is built upon a dual-layer architecture:
1. **Local Native MQL5 Core**: Directly controls market execution, low-latency tick monitoring, protective stop management (SL/TP, dynamic break-even, ATR trailing stops, partial closures), and hard risk circuit breakers. The EA remains 100% fail-safe and functional even if remote networks or external AI APIs disconnect.
2. **AI & Quantitative Intelligence Engine**: Provides multi-regime market classification (Hurst exponent, directional persistence, volatility compression/expansion, and uncertainty scoring), opportunity ranking with cost friction models (spread/ATR cost gating), and screen-sharing visual validation using Gemini Flash Vision.

---

## 2. Component Topology

```
+--------------------------------------------------------------------------+
|                       Desktop / Mobile Web Dashboard                     |
|  - Real-time Cockpit (Equity, DD, Daily PnL, Positions, Emergency Stop)  |
|  - Multi-Symbol Matrix (28 Forex + XAUUSD + BTCUSD + US30)               |
|  - 15 Strategy Deck (Toggles, Win-Rates, Risk:Reward, Parameters)        |
|  - Visual Screen Inspector (Gemini Vision OCR & Terminal Verification)   |
|  - Backtesting & Monte Carlo 1,000-Path Risk Simulator                   |
+--------------------------------------------------------------------------+
                                     ^
                                     | HTTP / WebSocket JSON API
                                     v
+--------------------------------------------------------------------------+
|                  Express + Python Intelligence Backend                   |
|  - /api/mt5/telemetry        - /api/mt5/scanner      - /api/mt5/positions|
|  - /api/mt5/strategies       - /api/mt5/risk-config  - /api/mt5/screen   |
|  - Quantitative Regime Model - Opportunity Ranker    - Monte Carlo Engine|
+--------------------------------------------------------------------------+
                                     ^
                                     | MT5 WebRequest (or Local Standalone)
                                     v
+--------------------------------------------------------------------------+
|                  MetaTrader 5 Native Expert Advisor                      |
|                           ApexAITrader.mq5                               |
|                                                                          |
|  +------------------------+  +----------------------------------------+  |
|  |    CRiskManager.mqh    |  |          CStopManager.mqh              |  |
|  | - Hard Capital Sizing  |  | - ATR Protective Stop Loss             |  |
|  | - Drawdown Cutoff 5.0% |  | - Take Profit (Min 1.5R - 2.5R)        |  |
|  | - Daily Loss Gate 2.0% |  | - Auto Break-Even + Cost Offset        |  |
|  | - Min Lot Risk Check   |  | - ATR Trailing Stop (Tightening Only)  |  |
|  | - Loss Streak Cooldown |  | - Partial Profit Taking (50% @ 1.3R)   |  |
|  +------------------------+  +----------------------------------------+  |
|                                                                          |
|  +------------------------+  +----------------------------------------+  |
|  |  CRegimeDetector.mqh   |  |         CStrategyLibrary.mqh           |  |
|  | - Trend (Bull/Bear)    |  | - 15 Modular Scalping Strategies       |  |
|  | - Squeeze / Expansion  |  | - Entry / Exit Signals & Quality Score |  |
|  | - Uncertainty Score    |  | - Invalidation Theses & R:R Checks     |  |
|  +------------------------+  +----------------------------------------+  |
|                                                                          |
|  +------------------------+  +----------------------------------------+  |
|  |   CMarketScanner.mqh   |  |         CTradeExecution.mqh            |  |
|  | - Multi-Symbol Matrix  |  | - Synchronous Fills (FOK/IOC/RETURN)   |  |
|  | - Spread/ATR Ratio     |  | - Slippage Measurement & Limit (10 pts)|  |
|  | - Opportunity Ranking  |  | - Duplicate Prevention Lock            |  |
|  +------------------------+  +----------------------------------------+  |
+--------------------------------------------------------------------------+
```

---

## 3. Technology Stack
- **Native Trading Core**: MQL5 (MetaQuotes Language 5), Object-Oriented (`CTrade`, `CPositionInfo`, `CSymbolInfo`).
- **AI / Quantitative Layer**: Python 3.10+ (NumPy, SciPy, Hurst exponent estimation, Bollinger bandwidth, ATR volatility models).
- **Backend Server**: Node.js & Express (TypeScript / TSX) running on port 3000, integrating Google Gemini 3.8 Flash Vision for chart OCR.
- **Frontend Dashboard**: React 19, TypeScript, Tailwind CSS, Lucide icons, responsive for mobile and desktop screens.

---

## 4. Key Architectural Guarantees
1. **Never Round Up Lots**: Position volume is computed strictly via:
   $$\text{Lots} = \left\lfloor \frac{\text{Equity} \times \text{RiskPct}}{\text{SL\_Distance\_Points} \times \text{TickValue}} \div \text{LotStep} \right\rfloor \times \text{LotStep}$$
   If `Lots < MinLot`, the trade is **strictly rejected**.
2. **Never Move Stop-Loss Backwards**: Stop modification functions only execute when the candidate level monotonically tightens risk.
3. **Fail-Safe Independence**: If external networks fail, the EA continues enforcing local SL, TP, BE, trailing stops, and circuit breakers autonomously.
