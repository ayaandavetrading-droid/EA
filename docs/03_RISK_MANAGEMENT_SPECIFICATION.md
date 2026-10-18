# Apex AI Trader - Risk Management Specification

## 1. Absolute Capital Preservation Invariants
1. **Never Trade Without Protective Stop-Loss**: If a broker rejects the stop-loss order or if stop distance cannot be validated, the position is rejected or closed immediately.
2. **Never Move Stop-Loss Away**: The EA contains strict monotonic code: a stop-loss can only be moved in the direction of profit (to reduce risk or lock in gains).
3. **Never Double Down or Martingale**: Volume sizing is deterministic based on account equity and stop distance. Losses never trigger increased lot sizes.
4. **Skip When Min Lot Exceeds Dollar Risk**: If 0.01 lot on a given asset risks $12.00, but the configured 0.75% risk cap permits only $7.50, the trade is **rejected**. Never force an oversized trade.

---

## 2. Risk Sizing Formula
$$\text{DollarRisk} = \text{Equity} \times \left( \frac{\text{RiskPerTradePct}}{100} \right)$$
$$\text{TicksAtRisk} = \frac{|\text{EntryPrice} - \text{StopLossPrice}|}{\text{TickSize}}$$
$$\text{RiskPerStandardLot} = \text{TicksAtRisk} \times \text{TickValue}$$
$$\text{CalculatedVolume} = \left\lfloor \frac{\text{DollarRisk}}{\text{RiskPerStandardLot} \times \text{LotStep}} \right\rfloor \times \text{LotStep}$$

---

## 3. Circuit Breaker Matrix
| Parameter | Default Setting | Action When Triggered | Recovery / Reset Procedure |
|---|---|---|---|
| **Max Peak Drawdown** | 5.00% | Halts all new orders immediately | Requires manual user authorization in UI |
| **Max Daily Loss** | 2.00% | Stops all new entries until 00:00 server time | Resets automatically at new daily session boundary |
| **Max Weekly Loss** | 5.00% | Halts automated entries for remainder of week | Resets on Monday 00:00 UTC |
| **Consecutive Loss Cooldown** | 3 losses in a row | Mandatory 90-minute cooling off period | Automatic resumption after timer expires |
| **Spread / ATR Cost Gate** | > 20% of ATR | Skips symbol scan cycle | Resumes when spread normalizes |
| **Minimum Margin Level** | < 250% | Skips new entries | Resumes when positions close or margin level recovers |
| **Correlated Exposure** | Max 2 pairs | Skips 3rd correlated pair (e.g. EURUSD + EURJPY) | Allowed after one of the pairs is closed |
