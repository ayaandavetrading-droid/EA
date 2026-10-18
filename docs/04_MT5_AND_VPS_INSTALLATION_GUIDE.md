# Apex AI Trader - MetaTrader 5 & VPS Installation Guide

## 1. Prerequisites
- MetaTrader 5 Desktop Terminal (build 3800 or newer) running on Windows 10/11 or Windows Server VPS.
- An active Demo or Live account with any MT5-compatible broker (RAW spread / ECN account recommended for scalping).
- Node.js 18+ or Python 3.10+ if running the accompanying AI telemetry service locally.

---

## 2. Step-by-Step Installation

### Step A: Download the EA Package
Download the complete `Apex_AI_Trader_MT5_Package.zip` directly from the **MQL5 EA Package** tab on your Apex AI Trader dashboard.

### Step B: Copy Files to MT5 Data Folder
1. Open your MetaTrader 5 terminal.
2. In the top menu, click **File** -> **Open Data Folder**.
3. Navigate into the **MQL5** folder.
4. Copy the files as follows:
   - Copy `ApexAITrader.mq5` into `MQL5/Experts/`
   - Copy the entire `Include/Apex/` folder into `MQL5/Include/Apex/`
   - Copy the `.set` files from `Profiles/` into `MQL5/Profiles/Tester/` or `MQL5/Presets/`

### Step C: Configure Terminal Settings
1. In MT5, click **Tools** -> **Options** (or press `Ctrl + O`).
2. Navigate to the **Expert Advisors** tab.
3. Check the following boxes:
   - [x] **Allow automated trading**
   - [ ] *Disable automated trading when the account has been changed* (recommended for security)
   - [x] **Allow WebRequest for listed URL**
4. Add your dashboard telemetry URL to the WebRequest list:
   - `http://127.0.0.1:3000` (for local running)
   - Or your production cloud URL: `https://your-apex-domain.com`
5. Click **OK**.

### Step D: Compile the Expert Advisor
1. In MT5, press `F4` to open the **MetaEditor**.
2. In the Navigator panel on the left, expand **Experts** and double-click `ApexAITrader.mq5`.
3. Click the green **Compile** button at the top (or press `F7`).
4. Ensure the output window shows: `0 errors, 0 warnings`.

### Step E: Attach to Chart
1. Return to the MT5 terminal.
2. Open a clean chart for your primary pair (e.g. `EURUSD` or `XAUUSD`) on the **M5 (5-Minute)** timeframe.
3. In the Navigator window (`Ctrl + N`), expand **Expert Advisors** -> drag `ApexAITrader` onto the chart.
4. In the dialog:
   - Under the **Common** tab, ensure **Allow automated trading** is checked.
   - Under the **Inputs** tab, click **Load** and select `Apex_Conservative_Defaults.set`.
   - Ensure `InpExecutionMode` is set to `EXEC_MODE_DEMO_EXECUTION` for initial testing.
5. Click **OK**.
6. Ensure the **Algo Trading** button on MT5's top toolbar is green. You should see the Apex AI Trader HUD panel render on the chart.
