"""
Tests for ExcelEngine
"""
import unittest
from deskpilot.excel_engine import ExcelEngine


class TestExcelEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ExcelEngine()

    def test_explain_formula_xlookup(self):
        exp = self.engine.explain_formula("=XLOOKUP(A2, Products!A:A, Products!B:B)")
        self.assertIn("XLOOKUP searches a range", exp)

    def test_explain_formula_sumifs(self):
        exp = self.engine.explain_formula("=SUMIFS(D:D, C:C, '>100')")
        self.assertIn("SUMIFS adds cells", exp)

    def test_clean_data_rows(self):
        raw_rows = [
            ["  Alice Smith  ", "2026-03-01", 100],
            ["Bob Jones", "2026-03-02", 200],
            ["Alice Smith", "2026-03-01", 100],  # Duplicate after trimming!
        ]
        headers = ["Customer", "Date", "Amount"]
        res = self.engine.clean_data_rows(raw_rows, headers)

        self.assertEqual(res["trimmed_cells"], 1)
        self.assertEqual(res["removed_duplicates"], 1)
        self.assertEqual(len(res["cleaned_rows"]), 2)
        self.assertEqual(res["cleaned_rows"][0][0], "Alice Smith")


if __name__ == "__main__":
    unittest.main()
