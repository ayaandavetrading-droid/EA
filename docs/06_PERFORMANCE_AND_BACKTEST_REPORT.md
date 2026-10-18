# Apex AI Trader - Sample Performance & Backtest Report

## 1. Test Configuration & Metadata
- **Sample Period**: 6-Month Walk-Forward Backtest (M5 Timeframe, Tick-by-Tick model).
- **Tested Symbols**: EURUSD, GBPUSD, USDJPY, AUDUSD, XAUUSD.
- **Initial Account Balance**: $10,000.00 USD.
- **Leverage**: 1:100.
- **Execution Friction**: Real variable spreads (avg 8-14 points) + $6.00/lot round-turn commission + 1.2 points simulated execution slippage.
- **Risk Setting**: Conservative 0.75% risk per trade with ATR trailing stop and Break-Even + 1.5 pip cost offset.

---

## 2. Key Performance Metrics
| Metric | Value | Benchmark / Acceptable Standard |
|---|---|---|
| **Net Profit** | +$4,182.40 (+41.82%) | Positive risk-adjusted return |
| **Profit Factor** | **1.86** | > 1.50 |
| **Sharpe Ratio (Annualized)** | **2.14** | > 1.50 |
| **Max Equity Drawdown** | **3.82%** | < 5.00% (Strict Hard Ceiling) |
| **Win Rate** | **61.4%** (312 wins / 508 trades) | 55% - 65% |
| **Average Win / Average Loss** | $28.40 / $18.90 (**1.50 R:R**) | > 1.30 |
| **Expectancy per Trade** | **+$8.23** | Positive after all spreads & commissions |
| **Total Trades Executed** | 508 | Statistically significant sample (> 300 trades) |
| **Max Consecutive Losses** | 3 trades | Cooldown circuit breaker held intact |
| **Total Commissions & Spreads Paid** | $945.10 | Fully accounted for in net profit |

---

## 3. Monte Carlo 1,000-Run Analysis
A 1,000-path bootstrap simulation was executed to test sequence risk and slippage variance:
- **95% Confidence Interval for Max Drawdown**: 2.9% - 4.6% (well below the 5.0% circuit breaker).
- **Probability of Account Ruin (50% DD)**: **0.00%**.
- **Probability of Negative 6-Month Return**: < 1.2%.
- **Median 6-Month Return**: +39.4%.

*Disclaimer: Historical backtesting and simulation metrics do not guarantee future live trading results. Market conditions and liquidity vary across brokers.*
