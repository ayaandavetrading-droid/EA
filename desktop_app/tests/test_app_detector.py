"""
Tests for AppDetector
"""
import unittest
from deskpilot.app_detector import AppDetector


class TestAppDetector(unittest.TestCase):
    def setUp(self):
        self.detector = AppDetector()

    def test_classify_vscode(self):
        app_type, name = self.detector.classify_window("main.py - my_project - Visual Studio Code")
        self.assertEqual(app_type, "vscode")
        self.assertEqual(name, "Visual Studio Code")

    def test_classify_excel(self):
        app_type, name = self.detector.classify_window("Q3_Financials.xlsx - Excel")
        self.assertEqual(app_type, "excel")
        self.assertEqual(name, "Microsoft Excel")

    def test_classify_visual_studio(self):
        app_type, name = self.detector.classify_window("SolutionDeskPilot - Microsoft Visual Studio")
        self.assertEqual(app_type, "visual_studio")
        self.assertEqual(name, "Visual Studio")

    def test_parse_vscode_dirty_file(self):
        ctx = self.detector.parse_workspace_context({
            "type": "vscode",
            "app": "Visual Studio Code",
            "title": "● expense_tracker.py - finance_app - Visual Studio Code"
        })
        self.assertTrue(ctx["is_dirty"])
        self.assertEqual(ctx["resource_name"], "expense_tracker.py")
        self.assertEqual(ctx["file_extension"], "py")
        self.assertEqual(ctx["project_name"], "finance_app")

    def test_parse_excel_file(self):
        ctx = self.detector.parse_workspace_context({
            "type": "excel",
            "app": "Microsoft Excel",
            "title": "Sales_2026.xlsx - Excel"
        })
        self.assertEqual(ctx["resource_name"], "Sales_2026.xlsx")
        self.assertEqual(ctx["file_extension"], "xlsx")


if __name__ == "__main__":
    unittest.main()
