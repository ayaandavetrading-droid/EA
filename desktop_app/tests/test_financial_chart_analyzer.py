"""
Tests for FinancialChartAnalyzer
"""
import unittest
from deskpilot.financial_chart_analyzer import FinancialChartAnalyzer


class TestFinancialChartAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = FinancialChartAnalyzer()

    def test_bullish_chart_analysis(self):
        chart_data = {
            "ticker": "BTC/USD",
            "timeframe": "4H",
            "current_price": 68500.0,
            "support_levels": [66000.0, 64500.0],
            "resistance_levels": [72000.0],
            "trend": "bullish"
        }
        res = self.analyzer.analyze_chart_data(chart_data)

        self.assertEqual(res["instrument"], "BTC/USD")
        self.assertEqual(res["market_bias"], "Bullish")
        self.assertIn("bullish_scenario", res)
        self.assertIn("bearish_scenario", res)
        self.assertIn("disclaimer", res)
        self.assertEqual(res["potential_setup"]["direction"], "Long")
        self.assertGreater(float(res["potential_setup"]["target_levels"][0]), res["current_price"])

    def test_bearish_chart_analysis(self):
        chart_data = {
            "ticker": "EUR/USD",
            "timeframe": "1D",
            "current_price": 1.0500,
            "support_levels": [1.0350],
            "resistance_levels": [1.0700],
            "trend": "bearish"
        }
        res = self.analyzer.analyze_chart_data(chart_data)

        self.assertEqual(res["instrument"], "EUR/USD")
        self.assertEqual(res["market_bias"], "Bearish")
        self.assertEqual(res["potential_setup"]["direction"], "Short")


if __name__ == "__main__":
    unittest.main()
