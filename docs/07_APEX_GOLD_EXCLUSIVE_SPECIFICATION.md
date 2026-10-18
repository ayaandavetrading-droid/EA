# Apex Gold AI — Autonomous XAUUSD Scalping Agent
## Exclusive Gold Architecture, Phone Screen-Sharing & Visual Supervision Specification

---

## 1. Executive Summary & Exclusive Instrument Mandate

**Apex Gold AI** is engineered exclusively for scalping Spot Gold (**XAUUSD**). It is architecturally prohibited from opening orders or managing positions on any other instrument (e.g., EURUSD, GBPUSD, BTCUSD, US30).

### Broker Suffix Discovery & Strict Contract Verification
Gold is identified across brokers under various symbols:
- `XAUUSD` (Standard 5-digit raw ECN)
- `GOLD` (Alternative CFD naming)
- `XAUUSD.a`, `XAUUSD.raw`, `XAUUSD.pro` (ECN account suffixes)
- `XAUUSDm` (Micro Gold accounts, 10 oz contract size)

At initialization, the system performs a mandatory 7-point specification verification:
1. **Instrument Classification**: Validates that the underlying asset is Gold bullion / CFD.
2. **Contract Size**: Verifies 100 troy ounces (or 10 troy oz for micro contracts). Any non-standard value triggers instant initialization rejection (`INIT_FAILED`).
3. **Tick Size & Value**: Confirms 2-digit ($0.01) tick size and standard tick value calculation.
4. **Volume Constraints**: Reads `min_lot` (0.01), `max_lot` (e.g. 50.0), and `lot_step` (0.01).
5. **Spread Gating**: Measures current live spread. If spread exceeds 35 points ($0.35/oz) or spread exceeds 20% of 14-period ATR, order placement is blocked.
6. **Margin & Stops Level**: Reads broker stop-level constraints to prevent rejection during dynamic SL/TP modification.
7. **Foreign Symbol Exclusion**: Explicitly rejects order execution on any symbol outside the verified gold mapping.

---

## 2. Phone Screen-Sharing Visual AI Agent

The system features a visual AI observer capable of inspecting MetaTrader 5 on iPhone (iOS) and Android devices.

### Supported Mobile Navigation & Layout Recognition
- **Quotes Tab**: Reads real-time bid/ask prices, spread points, and broker connection status.
- **Charts Tab**: Opens XAUUSD chart, recognizes candlestick structure, moving averages, and support/resistance zones.
- **Timeframe Switching**: Dynamically shifts between **M1, M5, M15, and H1** for multi-timeframe confirmation:
  - **H1**: Dominant trend and session liquidity bias.
  - **M15**: Intermediate structure and key psychological levels ($10 and $50 increments).
  - **M5**: Primary execution timeframe for scalping pullbacks and breakouts.
  - **M1**: Micro-entry timing and immediate execution confirmation.
- **Chart Zoom & Latest Price Restoration**: Restores chart scroll to latest tick and adjusts zoom level.
- **Trade Tab**: Inspects active positions, floating PnL, margin level, and protective Stop Loss / Take Profit lines.
- **History Tab**: Audits closed trades, net profit/loss, and commission deductions.
- **Settings Tab**: Verifies connected account login, server name, ping latency, and detects broker warnings or disconnected states.

### The Observe–Interpret–Act–Verify Loop
1. **Observe**: Captures phone screen frame via live WebRTC screen-share or user screenshot upload.
2. **Interpret**: Employs multimodal vision (Gemini 2.5 Flash) to parse visual elements:
   - Identifies active tab (Quotes, Chart, Trade, History, Settings).
   - Verifies displayed symbol is strictly XAUUSD/GOLD.
   - Verifies account login number matches authorized credential.
   - Reads floating PnL and candlestick patterns.
3. **Act**:
   - In **Demo Autonomous Mode**: Sends verified trade parameters directly to native MT5 EA (`ApexGoldAI.mq5`) via low-latency WebBridge REST API.
   - In **Monitor Only Mode**: Displays proposed actions, technical justification, and risk assessment without executing.
   - In **Live Strict Confirm Mode**: Requires explicit human confirmation with safety passphrase (`AUTHORIZED_GOLD_APEX_2026`).
4. **Verify**: Inspects subsequent screen state to confirm order presence, stop-loss placement, and exact fill price.

---

## 3. Real Native Execution & Risk Preservation

The system operates with dual-layer safety:
- **Client/Mobile Interface**: Provides phone screen supervision, visual OCR, and multi-timeframe analysis.
- **Local Native EA (`ApexGoldAI.mq5`)**: Runs locally inside MT5 on desktop or VPS, executing orders with millisecond execution speed, guaranteed hard stop-losses, and break-even trailing logic.

### Capital Preservation Invariants
1. **Never Trade Without Stop-Loss**: Every order is placed with a protective SL at inception.
2. **Strict Downward Lot Rounding**: Lot size is rounded down to `lot_step`. Never rounded up.
3. **Monetary Risk Ceiling**: If 0.01 minimum lot exceeds the allowed dollar risk budget (0.25% - 0.50% of equity), the trade is strictly skipped.
4. **Dynamic Break-Even with Commission Buffer**: Once profit reaches 1.0R, SL is moved to entry price + $0.15/oz to cover round-turn broker commissions.
5. **Circuit Breaker**: If daily loss exceeds 1.0% or peak-to-trough drawdown hits 4.0%, all gold operations are halted immediately.
