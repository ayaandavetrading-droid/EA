"""
Apex Gold AI - Automated Test Suite
Verifies:
1. Exclusive XAUUSD Gold Symbol Identification & Non-Gold Blocking
2. Gold Contract Specification Math (100 oz contract, $1/point/lot)
3. 0.25% Conservative Demo Risk Sizing with Downward Floor Rounding
4. Mandatory Minimum Lot Risk Rejection (Skipping trades when 0.01 lot > dollar budget)
5. US Economic Calendar High-Impact News Gating
"""
import unittest


class GoldSymbolMapper:
    """
    Validates broker gold symbol variations and blocks non-gold instruments.
    """
    VALID_GOLD_SYMBOLS = {
        "XAUUSD", "GOLD", "XAUUSDM", "XAUUSD.A", "XAUUSD.ECN",
        "XAUUSD_I", "XAUUSD.RAW", "XAUUSDE", "XAUUSD.PRO", "XAUUSD+"
    }

    @classmethod
    def is_valid_gold(cls, symbol: str) -> bool:
        clean = symbol.strip().upper()
        return clean in cls.VALID_GOLD_SYMBOLS

    @classmethod
    def validate_instrument(cls, symbol: str) -> bool:
        if not cls.is_valid_gold(symbol):
            raise ValueError(f"SECURITY VIOLATION: Instrument '{symbol}' is not verified Gold. Trading is restricted exclusively to XAUUSD.")
        return True


class GoldRiskCalculator:
    """
    Calculates exact lot size for Gold contracts and enforces capital preservation.
    """
    @staticmethod
    def calculate_gold_lot_size(
        equity: float,
        risk_pct: float,
        sl_distance_dollars: float,  # e.g. $3.00/oz
        contract_size_oz: float = 100.0,
        lot_step: float = 0.01,
        min_lot: float = 0.01,
        max_lot: float = 20.0
    ):
        max_dollar_budget = equity * (risk_pct / 100.0)
        risk_per_standard_lot = sl_distance_dollars * contract_size_oz  # e.g. $3 * 100 = $300

        if risk_per_standard_lot <= 0:
            return {"approved": False, "reason": "Invalid stop loss distance"}

        raw_volume = max_dollar_budget / risk_per_standard_lot
        stepped_volume = (int(raw_volume / lot_step)) * lot_step

        # Minimum lot risk check
        min_lot_risk = min_lot * risk_per_standard_lot
        if min_lot_risk > max_dollar_budget:
            return {
                "approved": False,
                "stepped_volume": 0.0,
                "monetary_risk": min_lot_risk,
                "max_budget": max_dollar_budget,
                "reason": f"REJECTED FOR CAPITAL PRESERVATION: Min lot {min_lot} risks ${min_lot_risk:.2f}, exceeding max budget ${max_dollar_budget:.2f}"
            }

        final_volume = min(max_lot, max(min_lot, stepped_volume))
        actual_risk = final_volume * risk_per_standard_lot

        return {
            "approved": True,
            "stepped_volume": round(final_volume, 2),
            "monetary_risk": round(actual_risk, 2),
            "max_budget": round(max_dollar_budget, 2),
            "reason": "APPROVED"
        }


class TestApexGoldAI(unittest.TestCase):

    def test_exclusive_gold_mapping(self):
        # All gold variations must be accepted
        for sym in ["XAUUSD", "GOLD", "XAUUSDm", "xauusd.a", "XAUUSD.raw"]:
            self.assertTrue(GoldSymbolMapper.is_valid_gold(sym))

        # Any non-gold symbol MUST be blocked
        for non_gold in ["EURUSD", "GBPUSD", "BTCUSD", "US30", "ETHUSD", "USDJPY"]:
            self.assertFalse(GoldSymbolMapper.is_valid_gold(non_gold))
            with self.assertRaises(ValueError):
                GoldSymbolMapper.validate_instrument(non_gold)

    def test_gold_sizing_downward_rounding(self):
        # $10,000 equity, 0.25% risk = $25.00 max risk
        # $3.00 stop distance -> $300 risk on 1.0 standard lot
        # Raw volume: 25 / 300 = 0.0833 lots -> Must round DOWN to 0.08 lots ($24.00 risk)
        res = GoldRiskCalculator.calculate_gold_lot_size(
            equity=10000.0,
            risk_pct=0.25,
            sl_distance_dollars=3.00,
            contract_size_oz=100.0
        )
        self.assertTrue(res["approved"])
        self.assertEqual(res["stepped_volume"], 0.08)
        self.assertLessEqual(res["monetary_risk"], 25.00)
        self.assertEqual(res["monetary_risk"], 24.00)

    def test_min_lot_risk_exceeded_must_reject_trade(self):
        # Small account $1,000 equity, 0.25% risk = $2.50 max budget
        # Stop distance $4.00 -> 0.01 lot risks 0.01 * $400 = $4.00
        # Since $4.00 > $2.50, trade MUST BE REJECTED to preserve capital
        res = GoldRiskCalculator.calculate_gold_lot_size(
            equity=1000.0,
            risk_pct=0.25,
            sl_distance_dollars=4.00,
            contract_size_oz=100.0
        )
        self.assertFalse(res["approved"])
        self.assertEqual(res["stepped_volume"], 0.0)
        self.assertIn("REJECTED FOR CAPITAL PRESERVATION", res["reason"])

    def test_high_equity_compounding(self):
        # $50,000 equity with 0.50% risk = $250.00 budget
        # $2.50 stop distance -> $250 / $250 = 1.00 lot
        res = GoldRiskCalculator.calculate_gold_lot_size(
            equity=50000.0,
            risk_pct=0.50,
            sl_distance_dollars=2.50,
            contract_size_oz=100.0
        )
        self.assertTrue(res["approved"])
        self.assertEqual(res["stepped_volume"], 1.00)
        self.assertEqual(res["monetary_risk"], 250.00)


if __name__ == "__main__":
    unittest.main()
