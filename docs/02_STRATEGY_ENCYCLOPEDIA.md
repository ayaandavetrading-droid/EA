# Apex AI Trader - Strategy Encyclopedia

This document details the 15 candidate scalping strategies implemented within `Include/Apex/StrategyLibrary.mqh`. Each strategy operates as an independent module that can be toggled on or off, parameter-tuned, and audited.

---

### Strategy 1: Trend-Following Scalping (`STRAT_TREND_SCALP`)
- **Category**: Trend Continuation.
- **Market Assumptions**: Asset displays directional momentum where pullbacks to moving averages are defended by institutional flow.
- **Entry Rules**: 
  - Buy: EMA 9 > EMA 21 > EMA 50. Price pulls back into EMA 21 zone without closing below EMA 50, followed by a bullish tick confirmation.
  - Sell: EMA 9 < EMA 21 < EMA 50. Price tests EMA 21 from below and prints an upper rejection wick.
- **Exit Rules**: Stop-loss at 1.5x ATR(14). Take-profit at 2.5x ATR(14) (1.67 R:R).
- **Failure Modes**: Range-bound chop creates repeated false crosses.
- **Cost Impact**: High sensitivity to spreads; only tradeable when spread < 18% of ATR.
- **Auto-Disabled When**: Market regime shifts to `RANGING_SIDEWAYS` or `VOLATILITY_EXPANSION`.

---

### Strategy 2: Pullback Entries in Established Trends (`STRAT_PULLBACK_ENTRY`)
- **Category**: Fibonacci & Value Retracement.
- **Market Assumptions**: Strong trends exhibit 38.2% to 50.0% retracements before expanding to new highs/lows.
- **Entry Rules**: Calculates 20-bar swing high/low. Enters upon a touch of the 50% retracement level with a reversal candle close.
- **Exit Rules**: Stop-loss beyond recent structural swing (plus 0.25x ATR buffer). Target at 1.85 R:R.
- **Failure Modes**: Deep trend reversals that slice through 61.8% retracement.
- **Cost Impact**: Low to moderate; entries occur during low-volatility pullback phases.

---

### Strategy 3: Breakout and Breakout-Retest (`STRAT_BREAKOUT_RETEST`)
- **Category**: Structure Expansion.
- **Market Assumptions**: Horizontal consolidation boundaries pool liquidity. A decisive close outside the channel followed by a retest confirms breakout authenticity.
- **Entry Rules**: Breakout candle closes beyond 24-bar high/low. Next candle retests prior resistance (now support) with lower wick.
- **Exit Rules**: Stop-loss inside previous breakout base. Target at 2.0 R:R.
- **Failure Modes**: Liquidity sweeps / "Fakeouts" followed by immediate mean-reversion.
- **Cost Impact**: Must use limit orders or tight slippage deviation to prevent execution drag.

---

### Strategy 4: Support & Resistance Reaction (`STRAT_SR_REACTION`)
- **Category**: Liquidity Absorption.
- **Market Assumptions**: Key multi-timeframe swing pivots contain institutional resting limit orders.
- **Entry Rules**: Price sweeps within 30 points of major M15 pivot level and forms a rejection pinbar.
- **Exit Rules**: Stop-loss 20 points outside the sweep extreme. Target at 1.80 R:R.
- **Failure Modes**: High-impact news releases breaking levels with runaway velocity.

---

### Strategy 5: Momentum Continuation (`STRAT_MOMENTUM_CONT`)
- **Category**: Oscillator Momentum.
- **Market Assumptions**: Expanding MACD histograms in the direction of the trend indicate fresh volume participation.
- **Entry Rules**: MACD line > signal line above zero. Histogram delta positive for 2 consecutive bars.
- **Exit Rules**: Stop-loss at 1.5x ATR. Target at 2.0 R:R.
- **Failure Modes**: MACD divergence indicating exhaustion.

---

### Strategy 6: Range-Bound Mean Reversion (`STRAT_RANGE_MEAN_REV`)
- **Category**: Statistical Arbitrage / Mean Reversion.
- **Market Assumptions**: In low-ADX regimes (ADX < 20), price oscillates between Bollinger 2.0-sigma bands.
- **Entry Rules**: Touch of lower band with RSI(14) <= 32 (Buy), or touch of upper band with RSI(14) >= 68 (Sell).
- **Exit Rules**: Target at middle Bollinger SMA(20). Stop-loss at 0.4x channel width beyond the band.
- **Failure Modes**: Squeeze breakouts that result in band walking.
- **Auto-Disabled When**: ADX > 22 or regime is `BULL_TREND` / `BEAR_TREND`.

---

### Strategy 7: Moving-Average Trend Filters (`STRAT_EMA_FILTER_PULSE`)
- **Category**: Triple EMA Alignment.
- **Market Assumptions**: EMA 20, 50, and 200 stack hierarchy indicates persistent directional drift.
- **Entry Rules**: 20 > 50 > 200 for Longs; 20 < 50 < 200 for Shorts.

---

### Strategy 8: RSI & Stochastic Momentum Filters (`STRAT_RSI_STOCH_FILTER`)
- **Category**: Dual Momentum Oscillator.
- **Market Assumptions**: Stochastic %K crossing above %D while RSI exits the 30-40 zone provides high-probability scalping triggers.

---

### Strategy 9: MACD Momentum Confirmation (`STRAT_MACD_CONFIRM`)
- **Category**: Directional Confirmation Gate.
- **Entry Rules**: Validates trend setups by demanding that the MACD signal line confirms directional bias.

---

### Strategy 10: ATR Volatility Filters (`STRAT_ATR_VOL_EXP`)
- **Category**: Volatility Thresholding.
- **Market Assumptions**: Scalping requires sufficient volatility to cover broker spreads and commissions.
- **Rule**: Trades are skipped if current ATR < minimum profitable pip threshold.

---

### Strategy 11: Multi-Timeframe Trend Confirmation (`STRAT_MTF_CONFIRM`)
- **Category**: Multi-Timeframe Alignment (H1 + M15 + M5).
- **Market Assumptions**: Trading in the direction of the H1 50-EMA slope dramatically increases win rate on M5 scalps.

---

### Strategy 12: Price-Action & Candlestick Analysis (`STRAT_PRICE_ACTION_CANDLE`)
- **Category**: Naked Price Action.
- **Patterns**: Bullish/Bearish Engulfing, Hammer / Shooting Star pinbars, and Inside-Bar breakouts.

---

### Strategy 13: Session-Based Trading Filters (`STRAT_SESSION_MOMENTUM`)
- **Category**: Session Liquidity Windows.
- **Market Assumptions**: Peak liquidity and lowest spreads occur during London (07:00-11:00 UTC) and New York (12:00-16:00 UTC) overlap. Asian sessions or pre-rollover hours are restricted.

---

### Strategy 14: Volatility Squeeze Breakout (`STRAT_VOL_SQUEEZE_BREAKOUT`)
- **Category**: Bollinger / Keltner Squeeze.
- **Market Assumptions**: Extended periods of low volatility (Bollinger Bandwidth < 0.0018) precede explosive expansions.

---

### Strategy 15: Volume Flow & Absorption Analysis (`STRAT_VOLUME_FLOW_ABSORP`)
- **Category**: Order Flow Proxy.
- **Market Assumptions**: Abnormally high tick volume accompanied by narrow candlestick range indicates institutional limit order absorption.
