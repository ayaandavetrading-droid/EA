# Apex AI Trader - Troubleshooting, Error Codes & Security

## 1. Common MT5 Execution Return Codes
| MT5 Code | Name | Cause | Apex AI Handling |
|---|---|---|---|
| **10004** | `TRADE_RETCODE_REQUOTE` | Fast market price shift | Automatic retry with exponential backoff (up to 3 times) within slippage limits |
| **10014** | `TRADE_RETCODE_INVALID_VOLUME` | Volume outside broker lot step or min/max | Volume calculation strictly normalized via `lotStep` and checked against `minLot` |
| **10015** | `TRADE_RETCODE_INVALID_PRICE` | Stale price quote | Tick price refreshed via `SymbolInfoTick` immediately prior to submission |
| **10016** | `TRADE_RETCODE_INVALID_STOPS` | Stop level violation (< `stops_level`) | Enforces `slDistance >= stops_level * point` prior to order dispatch |
| **10019** | `TRADE_RETCODE_NO_MONEY` | Insufficient free margin | Pre-flight margin buffer check (`OrderCalcMargin` requiring > 30% buffer) |
| **10027** | `TRADE_RETCODE_AUTOTRADING_DISABLED` | Algo Trading disabled in terminal | Logs critical warning and halts further order attempts |

---

## 2. Security & Credentials
- **Zero MT5 Passwords in Code**: Apex AI Trader connects locally via MQL5 internal API and does not transmit MT5 account passwords.
- **Strict Live Trading Authorization Key**: Switching the EA to live mode on a real account requires entering `AUTHORIZED_LIVE_APEX_2026` in the inputs, preventing accidental live execution.
- **Encrypted Local Logging**: Audit files are stored in `MQL5/Files/` on the user's local machine/VPS.

---

## 3. Emergency Stop Protocol
- If a market emergency occurs, trigger **Emergency Stop** from the dashboard or MT5 panel.
- The EA immediately:
  1. Closes all active positions managed by its magic number.
  2. Cancels pending orders.
  3. Sets an internal circuit breaker that prevents any new entries until explicitly authorized.
