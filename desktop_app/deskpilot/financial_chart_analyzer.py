"""
DeskPilot AI - Trading & Financial Chart Analyzer
Provides structural market interpretation, support/resistance detection,
scenario planning, and risk-reward estimation for charts and trading workspaces.
"""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("deskpilot.financial_chart_analyzer")


class FinancialChartAnalyzer:
    def __init__(self):
        self.disclaimer = (
            "NOTICE: Analytical scenarios are strictly educational and informational. "
            "They do not constitute financial advice, signals, or guaranteed outcomes. "
            "DeskPilot AI never executes orders or places trades automatically."
        )

    def analyze_chart_data(self, chart_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Interprets financial chart inputs and structures market scenarios.
        """
        ticker = chart_info.get("ticker", "UNKNOWN_ASSET").upper()
        timeframe = chart_info.get("timeframe", "1D")
        current_price = float(chart_info.get("current_price", 0.0))
        support_levels = [float(s) for s in chart_info.get("support_levels", [])]
        resistance_levels = [float(r) for r in chart_info.get("resistance_levels", [])]
        trend = chart_info.get("trend", "neutral").lower()

        # Determine market bias (prioritizing explicit trend)
        if trend in ["bearish", "downtrend"]:
            bias = "Bearish"
        elif trend in ["bullish", "uptrend"]:
            bias = "Bullish"
        elif current_price and resistance_levels and current_price < min(resistance_levels):
            bias = "Bearish"
        elif current_price and support_levels and current_price > max(support_levels):
            bias = "Bullish"
        else:
            bias = "Neutral / Range-Bound"

        # Key levels calculation
        primary_support = min(support_levels) if support_levels else (current_price * 0.95 if current_price else 0.0)
        primary_resistance = max(resistance_levels) if resistance_levels else (current_price * 1.05 if current_price else 0.0)

        # Scenarios
        bullish_scenario = (
            f"If {ticker} holds support at {primary_support:.2f} and forms a confirmed higher low, "
            f"the structure favors continuation toward target resistance at {primary_resistance:.2f}."
        )
        bearish_scenario = (
            f"A breakdown below {primary_support:.2f} invalidates the bullish thesis and risks "
            f"liquidity sweep toward lower demand levels."
        )

        # Risk / Reward setup (hypothetical educational structure)
        entry_area = current_price if current_price else primary_support
        invalidation = primary_support * 0.98 if primary_support else 0.0
        target = primary_resistance if primary_resistance else entry_area * 1.06

        risk = abs(entry_area - invalidation) if entry_area and invalidation else 0.0
        reward = abs(target - entry_area) if target and entry_area else 0.0
        rr_ratio = round(reward / risk, 2) if risk > 0 else 0.0

        return {
            "instrument": ticker,
            "timeframe": timeframe,
            "current_price": current_price,
            "market_bias": bias,
            "support_levels": support_levels or [round(primary_support, 2)],
            "resistance_levels": resistance_levels or [round(primary_resistance, 2)],
            "bullish_scenario": bullish_scenario,
            "bearish_scenario": bearish_scenario,
            "potential_setup": {
                "direction": "Long" if bias == "Bullish" else "Short" if bias == "Bearish" else "Watch Range",
                "potential_entry": round(entry_area, 2),
                "invalidation_level": round(invalidation, 2),
                "target_levels": [round(target, 2)],
                "risk_reward_ratio": f"{rr_ratio}:1" if rr_ratio > 0 else "N/A"
            },
            "uncertainties_and_news_risks": [
                "High-impact macroeconomic releases (CPI, Interest Rate decisions, Non-Farm Payrolls).",
                "Unconfirmed candlestick closes across lower timeframes.",
                "Liquidity gaps or overnight spread expansion."
            ],
            "disclaimer": self.disclaimer
        }


chart_analyzer = FinancialChartAnalyzer()
