"""
Apex AI Trader - Market Regime Classifier
Quantitative Regime Identification & Volatility Feature Extraction
"""
import math
from typing import Dict, List, Any


class MarketRegimeClassifier:
    """
    Identifies real-time market regimes based on:
    - Trend Strength (Directional Movement & Slope)
    - Volatility Expansion/Compression (ATR & Bollinger Bandwidth)
    - Mean Reversion Potential (Hurst Exponent & Oscillation)
    """

    def __init__(self):
        self.regimes = [
            "BULL_TREND",
            "BEAR_TREND",
            "RANGING_SIDEWAYS",
            "VOLATILITY_EXPANSION",
            "VOLATILITY_COMPRESSION",
            "POTENTIAL_BREAKOUT",
            "ABNORMAL_UNSTABLE",
        ]

    def calculate_atr(self, high: List[float], low: List[float], close: List[float], period: int = 14) -> float:
        if len(close) < period + 1:
            return 0.0
        trs = []
        for i in range(1, len(close)):
            tr = max(
                high[i] - low[i],
                abs(high[i] - close[i - 1]),
                abs(low[i] - close[i - 1])
            )
            trs.append(tr)
        return sum(trs[-period:]) / period if trs else 0.0

    def calculate_hurst_exponent(self, prices: List[float], max_lag: int = 20) -> float:
        """
        Estimates Hurst exponent H:
        H < 0.45: Mean-reverting series
        0.45 <= H <= 0.55: Random walk / Geometric Brownian motion
        H > 0.55: Trending / Persistent series
        """
        if len(prices) < max_lag * 2:
            return 0.50

        lags = range(2, max_lag)
        tau = []
        for lag in lags:
            diffs = [prices[i] - prices[i - lag] for i in range(lag, len(prices))]
            variance = sum(d * d for d in diffs) / len(diffs)
            tau.append(math.sqrt(variance))

        # Log-log regression
        log_lags = [math.log(lag) for lag in lags]
        log_tau = [math.log(t) if t > 0 else -10.0 for t in tau]

        n = len(log_lags)
        sum_x = sum(log_lags)
        sum_y = sum(log_tau)
        sum_xx = sum(x * x for x in log_lags)
        sum_xy = sum(x * y for x, y in zip(log_lags, log_tau))

        denom = (n * sum_xx - sum_x * sum_x)
        if abs(denom) < 1e-9:
            return 0.50

        slope = (n * sum_xy - sum_x * sum_y) / denom
        return max(0.05, min(0.95, slope))

    def classify_regime(
        self,
        prices: List[float],
        high: List[float],
        low: List[float],
        spread_points: int,
        point_value: float = 0.00001
    ) -> Dict[str, Any]:
        """
        Synthesizes technical features into deterministic regime classification.
        """
        if len(prices) < 30:
            return {
                "regime": "ABNORMAL_UNSTABLE",
                "label": "Insufficient Data",
                "trend_strength": 0.0,
                "volatility_ratio": 1.0,
                "hurst": 0.50,
                "uncertainty": 0.95,
                "is_tradeable": False,
                "reason": "At least 30 historical price bars required."
            }

        atr14 = self.calculate_atr(high, low, prices, 14)
        atr70 = self.calculate_atr(high, low, prices, min(70, len(prices) - 1))
        vol_ratio = (atr14 / atr70) if atr70 > 0 else 1.0
        hurst = self.calculate_hurst_exponent(prices, max_lag=min(15, len(prices) // 3))

        spread_in_price = spread_points * point_value
        spread_atr_cost = (spread_in_price / atr14) if atr14 > 0 else 1.0

        # Short & Long Moving Averages
        sma20 = sum(prices[-20:]) / 20.0
        sma50 = sum(prices[-50:]) / min(50, len(prices))
        slope = (sma20 - sma50) / sma50 if sma50 > 0 else 0.0

        # Anomaly Checks: High Spread or Extreme Volatility
        if spread_atr_cost > 0.30:
            return {
                "regime": "ABNORMAL_UNSTABLE",
                "label": "Excessive Spread relative to Volatility",
                "trend_strength": abs(slope) * 1000,
                "volatility_ratio": round(vol_ratio, 2),
                "hurst": round(hurst, 2),
                "uncertainty": 0.85,
                "is_tradeable": False,
                "reason": f"Spread eats {round(spread_atr_cost * 100, 1)}% of typical ATR bar."
            }

        # Volatility Squeeze
        if vol_ratio < 0.65 and abs(slope) < 0.0008:
            return {
                "regime": "VOLATILITY_COMPRESSION",
                "label": "Volatility Squeeze (Breakout Pending)",
                "trend_strength": abs(slope) * 1000,
                "volatility_ratio": round(vol_ratio, 2),
                "hurst": round(hurst, 2),
                "uncertainty": 0.28,
                "is_tradeable": True,
                "reason": "ATR compressed below 65% of historical baseline. Breakout setup."
            }

        # Strong Trend Bullish
        if slope > 0.0015 and hurst > 0.55:
            return {
                "regime": "BULL_TREND",
                "label": "Strong Bullish Trend",
                "trend_strength": min(100.0, slope * 25000),
                "volatility_ratio": round(vol_ratio, 2),
                "hurst": round(hurst, 2),
                "uncertainty": max(0.12, 0.45 - hurst * 0.4),
                "is_tradeable": True,
                "reason": f"Persistent trend (H={round(hurst, 2)}) with positive SMA delta."
            }

        # Strong Trend Bearish
        if slope < -0.0015 and hurst > 0.55:
            return {
                "regime": "BEAR_TREND",
                "label": "Strong Bearish Trend",
                "trend_strength": min(100.0, abs(slope) * 25000),
                "volatility_ratio": round(vol_ratio, 2),
                "hurst": round(hurst, 2),
                "uncertainty": max(0.12, 0.45 - hurst * 0.4),
                "is_tradeable": True,
                "reason": f"Persistent downward trend (H={round(hurst, 2)}) with negative SMA delta."
            }

        # Ranging / Mean Reversion
        if hurst < 0.45 and abs(slope) < 0.0010:
            return {
                "regime": "RANGING_SIDEWAYS",
                "label": "Sideways Mean-Reverting Channel",
                "trend_strength": abs(slope) * 1000,
                "volatility_ratio": round(vol_ratio, 2),
                "hurst": round(hurst, 2),
                "uncertainty": 0.24,
                "is_tradeable": True,
                "reason": f"Mean-reverting Hurst exponent (H={round(hurst, 2)}) with flat slope."
            }

        # Potential Breakout
        if vol_ratio > 1.25 and hurst > 0.52:
            return {
                "regime": "POTENTIAL_BREAKOUT",
                "label": "Active Breakout Dynamics",
                "trend_strength": abs(slope) * 1000,
                "volatility_ratio": round(vol_ratio, 2),
                "hurst": round(hurst, 2),
                "uncertainty": 0.35,
                "is_tradeable": True,
                "reason": "ATR expanding with directional persistence."
            }

        # Unclear / Ambiguous
        return {
            "regime": "RANGING_SIDEWAYS",
            "label": "Ambiguous Consolidation",
            "trend_strength": abs(slope) * 1000,
            "volatility_ratio": round(vol_ratio, 2),
            "hurst": round(hurst, 2),
            "uncertainty": 0.48,
            "is_tradeable": False,
            "reason": "Uncertainty exceeds 0.40 threshold. Capital preserved by skipping."
        }
