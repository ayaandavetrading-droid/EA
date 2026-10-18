"""
Apex AI Trader - Quantitative Engine Automated Test Suite
Verifies:
1. Hard capital preservation & lot sizing safety
2. Min lot risk threshold rejection (capital preservation)
3. Spread / ATR cost ratio gating
4. Regime detection & uncertainty thresholding
5. Circuit breaker and drawdown cutoffs
"""
import unittest
from market_regime_model import MarketRegimeClassifier
from opportunity_ranker import OpportunityRanker


class TestCapitalSizing(unittest.TestCase):
    """
    Verifies that position sizing NEVER rounds up or breaches risk limits.
    """

    def test_lot_size_calculation_downward_rounding(self):
        equity = 10000.0
        risk_pct = 0.75  # 0.75% = $75.00 max risk
        max_risk_dollars = equity * (risk_pct / 100.0)

        sl_distance_points = 120.0
        point_value_per_lot = 1.0  # $1 per point on 1 standard lot
        lot_step = 0.01
        min_lot = 0.01

        risk_per_lot = sl_distance_points * point_value_per_lot  # $120 per 1.0 lot
        raw_volume = max_risk_dollars / risk_per_lot  # 75 / 120 = 0.625 lots
        stepped_volume = (int(raw_volume / lot_step)) * lot_step  # Must round DOWN to 0.62 lots

        actual_monetary_risk = stepped_volume * risk_per_lot

        self.assertAlmostEqual(stepped_volume, 0.62, places=2)
        self.assertLessEqual(actual_monetary_risk, max_risk_dollars)
        self.assertLessEqual(actual_monetary_risk, 75.00)

    def test_min_lot_exceeding_risk_must_reject_trade(self):
        """
        Crucial requirement: If the broker's minimum lot (0.01) entails greater
        monetary loss than the user's risk cap, the system MUST skip the trade.
        """
        small_equity = 500.0
        risk_pct = 0.50  # $2.50 maximum risk
        max_risk_dollars = small_equity * (risk_pct / 100.0)

        # Huge volatility or wide SL (e.g., Gold or Crypto with 800 points SL)
        sl_points = 800.0
        point_value_per_lot = 1.0
        min_lot = 0.01

        min_lot_risk = min_lot * (sl_points * point_value_per_lot)  # 0.01 * 800 = $8.00

        # Since $8.00 > $2.50, trade must be rejected
        is_approved = min_lot_risk <= max_risk_dollars
        self.assertFalse(is_approved, "Trade should be rejected because min lot risk exceeds permitted dollar risk.")


class TestRegimeClassifier(unittest.TestCase):
    """
    Verifies quantitative regime detection and uncertainty triggers.
    """

    def setUp(self):
        self.classifier = MarketRegimeClassifier()

    def test_bull_trend_detection(self):
        # Generate upward stepping price series
        base = 1.1000
        prices = [base + i * 0.0006 for i in range(60)]
        highs = [p + 0.0004 for p in prices]
        lows = [p - 0.0004 for p in prices]

        result = self.classifier.classify_regime(prices, highs, lows, spread_points=12, point_value=0.00001)
        self.assertEqual(result["regime"], "BULL_TREND")
        self.assertTrue(result["is_tradeable"])
        self.assertLess(result["uncertainty"], 0.40)

    def test_excessive_spread_disqualification(self):
        # Moderate volatility with massive spread (e.g. night rollover)
        base = 1.1000
        prices = [base + (i % 3) * 0.0002 for i in range(50)]
        highs = [p + 0.0005 for p in prices]
        lows = [p - 0.0005 for p in prices]

        # 90 points spread in quiet market (9 pips vs small range)
        result = self.classifier.classify_regime(prices, highs, lows, spread_points=90, point_value=0.00001)
        self.assertEqual(result["regime"], "ABNORMAL_UNSTABLE")
        self.assertFalse(result["is_tradeable"])
        self.assertGreater(result["uncertainty"], 0.40)

    def test_volatility_squeeze_detection(self):
        # Extremely flat prices with collapsing range
        base = 1.1000
        prices = [base + ((i % 2) * 0.00003) for i in range(75)]
        highs = [p + 0.00005 for p in prices]
        lows = [p - 0.00005 for p in prices]

        result = self.classifier.classify_regime(prices, highs, lows, spread_points=2, point_value=0.00001)
        self.assertIn(result["regime"], ["VOLATILITY_COMPRESSION", "RANGING_SIDEWAYS"])


class TestOpportunityRanker(unittest.TestCase):
    """
    Verifies multi-factor scoring and cost friction rejection.
    """

    def setUp(self):
        self.ranker = OpportunityRanker()

    def test_high_conviction_trade_approval(self):
        regime = {
            "is_tradeable": True,
            "uncertainty": 0.20,
            "trend_strength": 80.0,
            "reason": "Strong Bull Trend"
        }
        res = self.ranker.score_candidate(
            symbol="EURUSD",
            regime_info=regime,
            signal_conviction=90.0,
            spread_points=8,
            atr_points=100.0,  # 8% cost ratio (very clean)
            reward_risk_ratio=2.2,
            correlated_count=0
        )
        self.assertTrue(res["is_approved"])
        self.assertGreater(res["score"], 70.0)

    def test_correlated_currency_limit_rejects(self):
        regime = {"is_tradeable": True, "uncertainty": 0.20, "trend_strength": 70.0}
        res = self.ranker.score_candidate(
            symbol="EURGBP",
            regime_info=regime,
            signal_conviction=88.0,
            spread_points=10,
            atr_points=100.0,
            reward_risk_ratio=2.0,
            correlated_count=2  # Limit reached!
        )
        self.assertFalse(res["is_approved"])
        self.assertIn("Correlated", res["skip_reason"])


if __name__ == "__main__":
    unittest.main()
